import { useEffect, useRef, useState } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echoInstance: Echo<any> | null = null

export function useEcho() {
  const echoRef = useRef<Echo<any> | null>(null)
  const [, setReadyTick] = useState(0)

  useEffect(() => {
    if (echoRef.current) return

    // Initialize Pusher/Reverb connection
    ;(window as any).Pusher = Pusher

    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const configuredScheme = process.env.NEXT_PUBLIC_REVERB_SCHEME
    const useSecureWs = false

    const wsHost = 'localhost'
    const wsPort = 8080
    const wssPort = 443
    // Pusher appends /app/{key} automatically, so keep only the proxy base path.
    const wsPath = process.env.NEXT_PUBLIC_REVERB_PATH

    console.log('[Echo] Initializing with:', {
      broadcaster: 'reverb',
      wsHost,
      wsPort,
      wssPort,
      wsPath,
      forceTLS: useSecureWs,
      encrypted: useSecureWs,
    })

    const echo = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'u8dqlttcafh83u2gqg7c',
      wsHost,
      wsPort,
      wssPort,
      wsPath,
      forceTLS: useSecureWs,
      encrypted: useSecureWs,
      disableStats: true,
    })

    // Add connection state logging - Use the internal Pusher connection
    const pusherConn = (echo.connector as any).pusher
    if (pusherConn && pusherConn.connection) {
      // Pusher connection state: connected, disconnected, connecting, unavailable
      console.log('[Echo] Pusher connection state:', pusherConn.connection.state)
      
      pusherConn.connection.bind('connected', () => {
        console.log('[Echo] Connected to Reverb')
      })
      
      pusherConn.connection.bind('disconnected', () => {
        console.log('[Echo] Disconnected from Reverb')
      })
      
      pusherConn.connection.bind('error', (err: any) => {
        console.error('[Echo] Connection error:', err)
      })
    } else {
      console.log('[Echo] Pusher connection not immediately available, will retry on channel subscribe')
    }

    echoRef.current = echo
    echoInstance = echo
    // Force one re-render so consumers that first received null can subscribe.
    setReadyTick((value) => value + 1)
  }, [])

  return echoRef.current || echoInstance
}
