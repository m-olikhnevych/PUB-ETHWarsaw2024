'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Beer, TrendingUp, TrendingDown, Share2, Clock, DollarSign, Users } from 'lucide-react'

const contractABI = [
  {
    "type": "function",
    "name": "Info",
    "inputs": [],
    "outputs": [
      { "name": "name", "type": "string" },
      { "name": "description", "type": "string" },
      { "name": "prompt", "type": "string" },
      { "name": "endTimestamp", "type": "uint256" },
      { "name": "resolved", "type": "bool" },
      { "name": "result", "type": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "makeBet",
    "inputs": [{ "name": "_side", "type": "bool" }],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getTrueBetAmount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFalseBetAmount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isResolved",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getResult",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  }
]

export default function BetPage() {
  const params = useParams()
  const contractAddress = params.id as `0x${string}`
  const [betAmount, setBetAmount] = useState('')
  const { isConnected } = useAccount()

  const { data: betInfo } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'Info',
  }) as {data: [string, string, string, string, boolean, boolean]}

  const { data: trueBetAmount } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getTrueBetAmount',
  }) as {data: number}

  const { data: falseBetAmount } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getFalseBetAmount',
  }) as {data: number}

  const { data: isResolved } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'isResolved',
  }) as { data: boolean }

  const { data: result } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getResult',
  }) as { data: boolean }

  const { writeContract, data: hash } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleBet = async (betType: 'Yes' | 'No') => {
    console.log('Placing bet:', betType)
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    console.log('Simulating bet...')
    try {
      const result = useSimulateContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'makeBet',
        args: [betType === 'Yes'],
        value: parseEther(betAmount || '0'),
      });
      console.log('Simulated result:', result)
      console.log('Placing bet...')
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'makeBet',
        args: [betType === 'Yes'],
        value: parseEther(betAmount || '0'),
      }, {
        onError: (error) => {
          console.error('Error placing bet:', error)
        }
      })
    } catch (error) {
      console.error('Error placing bet:', error)
    }
  }

  const totalBetAmount = (BigInt(trueBetAmount || 0) + BigInt(falseBetAmount || 0)).toString()
  const trueBetPercentage = totalBetAmount !== '0'
      ? (Number(trueBetAmount) / Number(totalBetAmount) * 100).toFixed(2)
      : '0'
  const falseBetPercentage = totalBetAmount !== '0'
      ? (Number(falseBetAmount) / Number(totalBetAmount) * 100).toFixed(2)
      : '0'

  return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Beer className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-yellow-400">Put Ur Bet</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <main className="container mx-auto p-4">
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <h2 className="text-2xl font-bold">{betInfo?.[0]}</h2>
                <p className="text-gray-400">{betInfo?.[1]}</p>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Prompt</h3>
              <p>{betInfo?.[2]}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Bet Amount</p>
                  <p className="text-lg font-semibold">{formatEther(BigInt(totalBetAmount))} ETH</p>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Yes Bet Amount</p>
                  <p className="text-lg font-semibold">{formatEther(BigInt(trueBetAmount) || 0n)} ETH ({trueBetPercentage}%)</p>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">No Bet Amount</p>
                  <p className="text-lg font-semibold">{formatEther(BigInt(falseBetAmount) || 0n)} ETH ({falseBetPercentage}%)</p>
                </div>
              </div>
            </div>

            {!isResolved && (
                <div className="space-y-4">
                  <input
                      type="number"
                      placeholder="Enter bet amount (ETH)"
                      className="w-full bg-gray-700 text-white rounded p-2"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                  />
                  <div className="flex space-x-4">
                    <button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded"
                        onClick={() => handleBet('Yes')}
                        disabled={!isConnected || isConfirming}
                    >
                      Bet YES
                    </button>
                    <button
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded"
                        onClick={() => handleBet('No')}
                        disabled={!isConnected || isConfirming}
                    >
                      Bet NO
                    </button>
                  </div>
                </div>
            )}

            {isResolved && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Bet Result</h3>
                  <p className="text-lg">
                    The bet has been resolved. The result is: <span className="font-bold">{result ? 'YES' : 'NO'}</span>
                  </p>
                </div>
            )}

            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Ends: {new Date(Number(betInfo?.[3]) * 1000).toLocaleString()}</span>
              </div>
              <Share2 className="w-4 h-4 cursor-pointer" />
            </div>
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