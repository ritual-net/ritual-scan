import { NextRequest } from 'next/server'
import { WebSocket as WS } from 'ws'

/**
 * WebSocket Proxy Route - Solves HTTPS mixed content issues for WebSocket connections
 * 
 * This creates a WebSocket-to-WebSocket proxy that allows HTTPS pages to connect
 * to insecure WebSocket endpoints without mixed content errors.
 * 
 * Architecture:
 * HTTPS Browser → WSS to Next.js → WS to RPC Node
 */

const connections = new Map<string, { 
  clientWs: WebSocket, 
  rpcWs: WS,
  connectionId: string 
}>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get('id') || `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const wsUrl = process.env.NEXT_PUBLIC_RETH_WS_URL
  if (!wsUrl) {
    return new Response('WebSocket endpoint not configured', { status: 500 })
  }

  console.log(`🔗 [WS-Proxy-${connectionId}] Setting up WebSocket proxy to: ${wsUrl}`)

  // Check if upgrade header is present
  const upgrade = request.headers.get('upgrade')
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 400 })
  }

  try {
    // This is a simplified version - Next.js doesn't have built-in WebSocket support
    // In production, you'd use a separate WebSocket server or a custom Next.js plugin
    return new Response('WebSocket proxy requires custom server setup', {
      status: 501,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error(`❌ [WS-Proxy-${connectionId}] Setup failed:`, error)
    return new Response('WebSocket proxy setup failed', { status: 500 })
  }
}

// WebSocket proxy implementation for when we have a custom server
export function createWebSocketProxy(wsUrl: string) {
  return function handleWebSocketProxy(ws: WebSocket, connectionId: string) {
    console.log(`🔗 [WS-Proxy-${connectionId}] Connecting to RPC WebSocket: ${wsUrl}`)
    
    // Create connection to RPC WebSocket
    const rpcWs = new WS(wsUrl)
    
    // Store connection
    connections.set(connectionId, { clientWs: ws, rpcWs, connectionId })
    
    // Forward messages from client to RPC
    ws.addEventListener('message', (event) => {
      if (rpcWs.readyState === WS.OPEN) {
        console.log(`📤 [WS-Proxy-${connectionId}] Client → RPC:`, event.data)
        rpcWs.send(event.data)
      }
    })
    
    // Forward messages from RPC to client
    rpcWs.on('message', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`📥 [WS-Proxy-${connectionId}] RPC → Client:`, data.toString().slice(0, 100))
        ws.send(data.toString())
      }
    })
    
    // Handle RPC WebSocket connection
    rpcWs.on('open', () => {
      console.log(`✅ [WS-Proxy-${connectionId}] Connected to RPC WebSocket`)
    })
    
    rpcWs.on('error', (error: Error) => {
      console.error(`❌ [WS-Proxy-${connectionId}] RPC WebSocket error:`, error)
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'RPC WebSocket error')
      }
    })
    
    rpcWs.on('close', () => {
      console.log(`🔌 [WS-Proxy-${connectionId}] RPC WebSocket closed`)
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'RPC WebSocket closed')
      }
      connections.delete(connectionId)
    })
    
    // Handle client WebSocket close
    ws.addEventListener('close', () => {
      console.log(`🔌 [WS-Proxy-${connectionId}] Client WebSocket closed`)
      if (rpcWs.readyState === WS.OPEN) {
        rpcWs.close()
      }
      connections.delete(connectionId)
    })
    
    ws.addEventListener('error', (error) => {
      console.error(`❌ [WS-Proxy-${connectionId}] Client WebSocket error:`, error)
      if (rpcWs.readyState === WS.OPEN) {
        rpcWs.close()
      }
      connections.delete(connectionId)
    })
  }
}

// Cleanup function
export function cleanupWebSocketProxy() {
  connections.forEach(({ clientWs, rpcWs, connectionId }) => {
    console.log(`🧹 [WS-Proxy-${connectionId}] Cleaning up connection`)
    try {
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close()
      if (rpcWs.readyState === WS.OPEN) rpcWs.close()
    } catch (error) {
      console.error(`❌ [WS-Proxy-${connectionId}] Cleanup error:`, error)
    }
  })
  connections.clear()
}
