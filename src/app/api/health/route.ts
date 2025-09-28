import { NextResponse } from 'next/server'

export async function GET() {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: process.memoryUsage().heapUsed / 1024 / 1024,
      total: process.memoryUsage().heapTotal / 1024 / 1024,
      external: process.memoryUsage().external / 1024 / 1024,
    },
    checks: {
      database: 'ok', // Add actual database check if needed
      external_apis: 'ok', // Add actual API checks if needed
    }
  }

  return NextResponse.json(healthCheck, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
