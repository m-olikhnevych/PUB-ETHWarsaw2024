'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Beer } from 'lucide-react'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { optimismSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'

const config = getDefaultConfig({
  appName: 'Put Ur Bet',
  projectId: '88186963d12a994cdd9092b886009c16',
  chains: [optimismSepolia],
  transports: {
    [optimismSepolia.id]: http()
  },
})

const queryClient = new QueryClient()

export default function RootLayout({children}: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <html lang="en">
    <body className="bg-gray-900 text-gray-100">
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={config.chains} theme={darkTheme()}>
          <div className="min-h-screen flex flex-col">
            <header className="bg-gray-800 p-4">
              <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <Beer className="w-8 h-8 text-yellow-400"/>
                  <span
                      className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                        Put Ur Bet
                      </span>
                </Link>
                <nav className="flex items-center space-x-4">
                  <Link href="/predictions" className="hover:text-yellow-400">Predictions</Link>
                  <Link href="/create" className="hover:text-yellow-400">Create</Link>
                  <Link href="/king-of-hill" className="hover:text-yellow-400">King of the Hill</Link>
                  {mounted && <ConnectButton/>}
                </nav>
              </div>
            </header>
            <main className="flex-grow container mx-auto p-4">
              {children}
            </main>
            <footer className="bg-gray-800 p-4 text-center mt-auto">
              <p>EthWarsaw 2024 Hackathon &copy;INC4 Team</p>
            </footer>

          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
    <Toaster />
    </body>
    </html>
  )
}