'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { TrendingUp, Share2, Clock } from 'lucide-react'
import { request, gql } from 'graphql-request'

const GRAPH_URL = 'http://88.99.32.158:8000/subgraphs/name/pub/subgraph'

const GET_BETS = gql`
  query GetBets {
    betCreateds(first: 100, orderBy: blockTimestamp, orderDirection: desc) {
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
    "inputs": [
      {"internalType": "bool", "name": "_side", "type": "bool"}
    ],
    "name": "makeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const

interface Bet {
  id: string
  betAddress: string
  betId: string
  params_name: string
  params_description: string
  params_prompt: string
  params_endTimestamp: string
}

export default function Home() {
  const [bets, setBets] = useState<Bet[]>([])
  const [betAmounts, setBetAmounts] = useState<{ [key: string]: string }>({})
  const { isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const router = useRouter()

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const data = await request<{ betCreateds: Bet[] }>(GRAPH_URL, GET_BETS)
        setBets(data.betCreateds)
      } catch (error) {
        console.error('Error fetching bets:', error)
      }
    }
    fetchBets()
  }, [])

  const handleBetAmountChange = (id: string, amount: string) => {
    setBetAmounts(prev => ({ ...prev, [id]: amount }))
  }

  const handleBet = async (betId: string, betAddress: string, betType: 'Yes' | 'No') => {
    console.log("!!!", betId, betAddress, betType, betAmounts[betAddress]);
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      writeContract({
        address: betAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'makeBet',
        args: [betType === 'Yes'],
        value: parseEther(betAmounts[betAddress] || '0'),
      })
    } catch (error) {
      console.error('Error placing bet:', error)
    }
  }

  const handleCardClick = (betAddress: string) => {
    router.push(`/bet/${betAddress}`)
  }

  return (
      <div className="bg-gray-900 text-white">
        <main className="container mx-auto p-4">
          <h2 className="text-3xl font-bold mb-4">Welcome to Put Ur Bet</h2>
          <p className="text-gray-300 mb-8">
            Put Ur Bet is a decentralized betting platform where you can place bets on various crypto and blockchain-related events.
            Connect your wallet, choose your bets wisely, and may the odds be ever in your favor!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bets.map((bet) => (
                <div
                    key={bet.id}
                    className="bg-gray-800 rounded-lg p-4 space-y-4 cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleCardClick(bet.betAddress)}
                >
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">{bet.params_name}</h3>
                      <p className="text-sm text-gray-400">{bet.params_description}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">Prompt: {bet.params_prompt}</p>
                  <input
                      type="number"
                      placeholder="Enter bet amount"
                      className="w-full bg-gray-700 text-white rounded p-2"
                      value={betAmounts[bet.betAddress] || ''}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleBetAmountChange(bet.betAddress, e.target.value)
                      }}
                      onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex space-x-2">
                    <button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await handleBet(bet.betId, bet.betAddress, 'Yes')
                        }}
                        disabled={!isConnected || isPending || isConfirming}
                    >
                      Bet YES
                    </button>
                    <button
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await handleBet(bet.betId, bet.betAddress, 'No')
                        }}
                        disabled={!isConnected || isPending || isConfirming}
                    >
                      Bet NO
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Ends: {new Date(Number(bet.params_endTimestamp) * 1000).toLocaleString()}</span>
                    </div>
                    <Share2 className="w-4 h-4 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                  </div>
                </div>
            ))}
          </div>
        </main>

        {isSuccess && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
              Transaction confirmed! Your bet has been placed.
            </div>
        )}
      </div>
  )
}