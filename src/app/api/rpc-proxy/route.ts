import { NextRequest, NextResponse } from 'next/server'

// This proxy allows the frontend to make RPC calls through our HTTPS server
// to the insecure HTTP RPC endpoint, avoiding mixed content errors

const RPC_URL = process.env.NEXT_PUBLIC_RETH_RPC_URL || 'http://34.139.214.94:8545'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('RPC Proxy: Forwarding request to', RPC_URL)
    console.log('RPC Proxy: Request body:', body)
    
    // Forward the RPC request to the actual RPC endpoint
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('RPC Proxy: Response status:', response.status)
    const data = await response.json()
    console.log('RPC Proxy: Response data:', data)
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('RPC Proxy Error:', error)
    console.error('RPC Proxy: Target URL was:', RPC_URL)
    return NextResponse.json(
      { error: 'Failed to proxy RPC request', details: error instanceof Error ? error.message : 'Unknown error', url: RPC_URL },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
