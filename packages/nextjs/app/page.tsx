'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseEther } from 'viem'
import { TrendingUp, Share2, Clock, X, Copy, Check } from 'lucide-react'
import { request, gql } from 'graphql-request'
import { toast, Toaster } from 'react-hot-toast'

const GRAPH_URL = 'http://88.99.32.158:8000/subgraphs/name/pub/subgraph'

const GET_ACTIVE_BETS = gql`
  query GetActiveBets {
    betCreateds(where: { params_endTimestamp_gt: ${Math.floor(Date.now() / 1000)} }, orderBy: params_endTimestamp, orderDirection: asc) {
      id
      betAddress
      betId
      params_name
      params_description
      params_prompt
      params_endTimestamp
    }
  }
`

const contractABI = [
  {
    "type": "function",
    "name": "makeBet",
    "inputs": [{ "name": "_side", "type": "bool" }],
    "outputs": [],
    "stateMutability": "payable"
  }
] as const

export default function Home() {
  const [activeBets, setActiveBets] = useState<any[]>([])
  const [betAmounts, setBetAmounts] = useState<{[key: string]: string}>({})
  const [sharePopup, setSharePopup] = useState<{ isOpen: boolean; text: string; link: string }>({ isOpen: false, text: '', link: '' })
  const [isCopied, setIsCopied] = useState(false)
  const { isConnected } = useAccount()
  const router = useRouter()
  const publicClient = usePublicClient()
  const { writeContract, data: hash } = useWriteContract()

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    const fetchActiveBets = async () => {
      try {
        const data = await request(GRAPH_URL, GET_ACTIVE_BETS) as { betCreateds: any[] }
        setActiveBets(data.betCreateds)
      } catch (error) {
        console.error('Error fetching active bets:', error)
        toast.error('Error fetching active bets')
      }
    }

    fetchActiveBets()
  }, [])

  const handleBet = async (event: React.MouseEvent, betAddress: string, betType: 'Yes' | 'No') => {
    event.stopPropagation() // Prevent navigation when clicking on bet buttons
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!betAmounts[betAddress] || parseFloat(betAmounts[betAddress]) <= 0) {
      toast.error('Please enter a valid bet amount')
      return
    }

    try {
      await writeContract({
        address: betAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'makeBet',
        args: [betType === 'Yes'],
        value: parseEther(betAmounts[betAddress]),
      })
    } catch (error) {
      console.error('Error placing bet:', error)
      toast.error(`Error placing bet: ${(error as Error).message || 'Unknown error'}`)
    }
  }

  useEffect(() => {
    if (hash) {
      const checkTransaction = async () => {
        try {
          const receipt = await publicClient!.waitForTransactionReceipt({ hash })
          if (receipt.status === 'success') {
            toast.success('Bet placed successfully!')
          } else {
            toast.error('Transaction failed')
          }
        } catch (error) {
          console.error('Error checking transaction:', error)
          toast.error('Error checking transaction')
        }
      }
      checkTransaction()
    }
  }, [hash, publicClient])

  const handleShare = (event: React.MouseEvent, bet: any) => {
    event.stopPropagation() // Prevent navigation when clicking on share button
    const shareText = `🎲 Join me in predicting the future! Will "${bet.params_name}"? Place your bets now on Put Ur Bet! 💰🔮`
    const shareUrl = `${window.location.origin}/bet/${bet.betAddress}`
    setSharePopup({ isOpen: true, text: shareText, link: shareUrl })
  }

  const handleCopy = () => {
    const fullShareText = `${sharePopup.text}\n\n${sharePopup.link}`
    navigator.clipboard.writeText(fullShareText).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }).catch((error) => {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy bet link', { duration: 3000 })
    })
  }

  const navigateToBetPage = (betAddress: string) => {
    router.push(`/bet/${betAddress}`)
  }

  return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Toaster />
        <main className="container mx-auto p-4">
          <h2 className="text-3xl font-bold mb-6">Active Bets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBets.map((bet) => (
                <div
                    key={bet.id}
                    className="bg-gray-800 rounded-lg p-6 space-y-4 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:bg-gray-750"
                    onClick={() => navigateToBetPage(bet.betAddress)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="w-6 h-6 text-yellow-400 mt-1" />
                      <div>
                        <h3 className="text-xl font-bold">{bet.params_name}</h3>
                        <p className="text-gray-400">{bet.params_description}</p>
                      </div>
                    </div>
                    <button
                        onClick={(e) => handleShare(e, bet)}
                        className="text-gray-400 hover:text-white transition-colors duration-200 transform hover:scale-110"
                        aria-label="Share bet"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-gray-700 p-3 rounded transition-all duration-300 ease-in-out hover:bg-gray-650">
                    <p className="text-sm">{bet.params_prompt}</p>
                  </div>

                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="number"
                        placeholder="Enter bet amount (ETH)"
                        className="w-full bg-gray-700 text-white rounded p-2 transition-all duration-200 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                        value={betAmounts[bet.betAddress] || ''}
                        onChange={(e) => setBetAmounts({...betAmounts, [bet.betAddress]: e.target.value})}
                    />
                    <div className="flex space-x-2">
                      <button
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-all duration-200 transform hover:scale-105"
                          onClick={(e) => handleBet(e, bet.betAddress, 'Yes')}
                          disabled={!isConnected || isConfirming}
                      >
                        Bet YES
                      </button>
                      <button
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-all duration-200 transform hover:scale-105"
                          onClick={(e) => handleBet(e, bet.betAddress, 'No')}
                          disabled={!isConnected || isConfirming}
                      >
                        Bet NO
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Ends: {new Date(Number(bet.params_endTimestamp) * 1000).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </main>

        {sharePopup.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full animate-scaleIn">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Share this bet</h3>
                  <button onClick={() => setSharePopup({ isOpen: false, text: '', link: '' })} className="text-gray-400 hover:text-white transition-colors duration-200">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="bg-gray-700 p-3 rounded mb-4">
                  <p>{sharePopup.text}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded mb-4 flex items-center justify-between">
                  <p className="truncate mr-2">{sharePopup.link}</p>
                  <button onClick={handleCopy} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors duration-200">
                    {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button onClick={handleCopy} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded transition-all duration-200 transform hover:scale-105">
                  {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
        )}
      </div>
  )
}