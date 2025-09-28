'use client'

import React from 'react'
import { RITUAL_CONTRACT_ADDRESSES, getContractDeploymentStatus } from '@/lib/ritual-events-production'

export function RitualContractDebug() {
  const deploymentStatus = getContractDeploymentStatus()

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-lime-500/30 mt-4">
      <h3 className="text-lg font-semibold text-white mb-3">🔧 Ritual Contract Debug Info</h3>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-lime-400 mb-2">Raw Contract Addresses</h4>
          <div className="grid grid-cols-1 gap-2 text-xs font-mono">
            {Object.entries(RITUAL_CONTRACT_ADDRESSES).map(([name, address]) => (
              <div key={name} className="flex justify-between items-center bg-black/20 p-2 rounded">
                <span className="text-cyan-300">{name}:</span>
                <span className="text-green-400">{address}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-lime-400 mb-2">Deployment Status</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {Object.entries(deploymentStatus).map(([name, info]) => (
              <div key={name} className="flex justify-between items-center bg-black/20 p-2 rounded">
                <span className="text-purple-300">{name}:</span>
                <div className="flex items-center space-x-2">
                  <span className={info.status.includes('ACTIVE') ? 'text-green-400' : 'text-yellow-400'}>
                    {info.status}
                  </span>
                  <code className="text-gray-400 font-mono text-xs">
                    {info.address.slice(0, 8)}...
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
