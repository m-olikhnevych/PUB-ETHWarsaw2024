'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { TrendingUp, Share2 } from 'lucide-react'
import { useScaffoldWriteContract } from '~~/hooks/scaffold-eth'

const predictions = [
  { id: 1, title: "Will Bitcoin reach $100k by end of 2024?", bank: "$10,000", deadline: "12:00 GMT 31.12.2024" },
  { id: 2, title: "Will Ethereum 2.0 launch successfully in Q3 2024?", bank: "$8,500", deadline: "00:00 GMT 01.10.2024" },
  { id: 3, title: "Will the US approve a Bitcoin ETF in 2024?", bank: "$15,000", deadline: "23:59 GMT 31.12.2024" },
  { id: 4, title: "Will Cardano surpass Ethereum in daily transactions?", bank: "$5,000", deadline: "23:59 GMT 31.12.2024" },
  { id: 5, title: "Will NFT trading volume exceed $50B in 2024?", bank: "$7,500", deadline: "23:59 GMT 31.12.2024" },
  { id: 6, title: "Will a new top 10 cryptocurrency emerge in 2024?", bank: "$6,000", deadline: "23:59 GMT 31.12.2024" },
]

const contractABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "predictionId", "type": "uint256"},
      {"internalType": "bool", "name": "betYes", "type": "bool"}
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
]

export default function Home() {
  const [betAmounts, setBetAmounts] = useState<{ [key: number]: string }>({})
  const { isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("YourContract");
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const router = useRouter()

  const handleBetAmountChange = (id: number, amount: string) => {
    setBetAmounts(prev => ({ ...prev, [id]: amount }))
  }

  const handleBet = async (predictionId: number, betType: 'Yes' | 'No') => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      writeContract({
        address: '0x...', // Replace with your contract address
        abi: contractABI,
        functionName: 'placeBet',
        args: [BigInt(predictionId), betType === 'Yes'],
        value: parseEther(betAmounts[predictionId] || '0'),
      })
    } catch (error) {
      console.error('Error placing bet:', error)
    }
  }

  const handleCardClick = (id: number) => {
    router.push(`/bet/${id}`)
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
            {predictions.map((prediction) => (
                <div
                    key={prediction.id}
                    className="bg-gray-800 rounded-lg p-4 space-y-4 cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleCardClick(prediction.id)}
                >
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">{prediction.title}</h3>
                      <p className="text-sm text-gray-400">Bank: {prediction.bank}</p>
                    </div>
                  </div>
                  <input
                      type="number"
                      placeholder="Enter bet amount"
                      className="w-full bg-gray-700 text-white rounded p-2"
                      value={betAmounts[prediction.id] || ''}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleBetAmountChange(prediction.id, e.target.value)
                      }}
                      onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex space-x-2">
                    <button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBet(prediction.id, 'Yes')
                        }}
                        disabled={!isConnected || isPending || isConfirming}
                    >
                      Bet YES
                    </button>
                    <button
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBet(prediction.id, 'No')
                        }}
                        disabled={!isConnected || isPending || isConfirming}
                    >
                      Bet NO
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>{prediction.deadline}</span>
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