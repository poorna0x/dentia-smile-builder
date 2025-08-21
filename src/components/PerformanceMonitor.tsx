import React, { useState, useEffect } from 'react'
import { useOptimizedRealtime } from '@/lib/optimized-realtime'

const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)

  const { getConnectionStatus } = useOptimizedRealtime()

  useEffect(() => {
    // Only show in development mode
    if (import.meta.env.DEV) {
      setIsVisible(true)
    }

    const updateStatus = () => {
      try {
        const status = getConnectionStatus()
        setConnectionStatus(status)
      } catch (error) {
        console.warn('Failed to get connection status:', error)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [getConnectionStatus])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div className="flex items-center space-x-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${connectionStatus?.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span>Real-time: {connectionStatus?.isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div>Listeners: {connectionStatus?.activeListeners || 0}</div>
      <div className="text-gray-400">Free Tier Optimized</div>
    </div>
  )
}

export default PerformanceMonitor
