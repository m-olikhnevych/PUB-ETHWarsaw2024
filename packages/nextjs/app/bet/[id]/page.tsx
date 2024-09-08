'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { TrendingUp, TrendingDown, Share2, Clock, DollarSign } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { request, gql } from 'graphql-request'

const GRAPH_URL = 'http://88.99.32.158:8000/subgraphs/name/pub/subgraph'

const GET_BET_INFO = gql`
  query GetBetInfo($betAddress: Bytes!, $userAddress: Bytes!) {
    betCreateds(where: { betAddress: $betAddress }) {
      id
      betAddress
      betId
      params_name
      params_description
      params_prompt
      params_endTimestamp
    }
    betMades(where: { betAddress: $betAddress }) {
      side
      amount
    }
    betResolveds(where: { betAddress: $betAddress }) {
      result
      totalTrueBetAmount
      totalFalseBetAmount
    }
    userBets: betMades(where: { betAddress: $betAddress, bettor: $userAddress }) {
      side
      amount
      blockTimestamp
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

export default function BetPage() {
  const params = useParams()
  const contractAddress = params.id as `0x${string}`
  const [betAmount, setBetAmount] = useState('')
  const [betInfo, setBetInfo] = useState<any>(null)
  const [trueBetAmount, setTrueBetAmount] = useState<bigint>(BigInt(0))
  const [falseBetAmount, setFalseBetAmount] = useState<bigint>(BigInt(0))
  const [isResolved, setIsResolved] = useState(false)
  const [result, setResult] = useState<boolean | null>(null)
  const [userBets, setUserBets] = useState<any[]>([])
  const { address, isConnected } = useAccount()

  const { writeContract, data: hash } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    const fetchBetInfo = async () => {
      try {
        const data = await request(GRAPH_URL, GET_BET_INFO, {
          betAddress: contractAddress,
          userAddress: address || '0x0000000000000000000000000000000000000000'
        }) as {betCreateds: any[], betMades: any[], betResolveds: any[], userBets: any[]}
        setBetInfo(data.betCreateds[0])

        let trueAmount = BigInt(0)
        let falseAmount = BigInt(0)
        data.betMades.forEach((bet: any) => {
          if (bet.side) {
            trueAmount += BigInt(bet.amount)
          } else {
            falseAmount += BigInt(bet.amount)
          }
        })
        setTrueBetAmount(trueAmount)
        setFalseBetAmount(falseAmount)

        if (data.betResolveds.length > 0) {
          setIsResolved(true)
          setResult(data.betResolveds[0].result)
          setTrueBetAmount(BigInt(data.betResolveds[0].totalTrueBetAmount))
          setFalseBetAmount(BigInt(data.betResolveds[0].totalFalseBetAmount))
        }

        setUserBets(data.userBets)
      } catch (error) {
        console.error('Error fetching bet info:', error)
        toast.error('Error fetching bet information', { duration: 3000 })
      }
    }

    fetchBetInfo()
  }, [contractAddress, address])

  const handleBet = async (betType: 'Yes' | 'No') => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', { duration: 3000 })
      return
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount', { duration: 3000 })
      return
    }

    try {
      toast.loading('Placing bet...', { duration: 3000 })
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'makeBet',
        args: [betType === 'Yes'],
        value: parseEther(betAmount),
      })
    } catch (error) {
      console.error('Error placing bet:', error)
      toast.error('Error placing bet. Please try again.', { duration: 3000 })
    }
  }

  const totalBetAmount = trueBetAmount + falseBetAmount
  const trueBetPercentage = totalBetAmount > 0n
      ? (Number(trueBetAmount) / Number(totalBetAmount) * 100).toFixed(2)
      : '0'
  const falseBetPercentage = totalBetAmount > 0n
      ? (Number(falseBetAmount) / Number(totalBetAmount) * 100).toFixed(2)
      : '0'

  if (!betInfo) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>
  }

  return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Toaster />

        <main className="container mx-auto p-4">
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <h2 className="text-2xl font-bold">{betInfo.params_name}</h2>
                <p className="text-gray-400">{betInfo.params_description}</p>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Prompt</h3>
              <p>{betInfo.params_prompt}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Bet Amount</p>
                  <p className="text-lg font-semibold">{formatEther(totalBetAmount)} ETH</p>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Yes Bet Amount</p>
                  <p className="text-lg font-semibold">{formatEther(trueBetAmount)} ETH ({trueBetPercentage}%)</p>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">No Bet Amount</p>
                  <p className="text-lg font-semibold">{formatEther(falseBetAmount)} ETH ({falseBetPercentage}%)</p>
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
                <span>Ends: {new Date(Number(betInfo.params_endTimestamp) * 1000).toLocaleString()}</span>
              </div>
              <Share2 className="w-4 h-4 cursor-pointer" />
            </div>

            {/* My Bets Table */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">My Bets</h3>
              {userBets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                      <thead className="bg-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Side</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                      </thead>
                      <tbody>
                      {userBets.map((bet, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-650'}>
                            <td className="px-4 py-2">{bet.side ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-2">{formatEther(BigInt(bet.amount))} ETH</td>
                            <td className="px-4 py-2">{new Date(Number(bet.blockTimestamp) * 1000).toLocaleString()}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              ) : (
                  <p className="text-gray-400">You haven&apos;t placed any bets on this prediction yet.</p>
              )}
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