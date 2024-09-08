'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { request, gql } from 'graphql-request'
import { toast, Toaster } from 'react-hot-toast'

const GRAPH_URL = 'http://88.99.32.158:8000/subgraphs/name/pub/subgraph'

const GET_USER_BETS = gql`
  query GetUserBets($userAddress: Bytes!) {
    betMades(where: { bettor: $userAddress }) {
      id
      betAddress
      bettor
      side
      amount
    }
    betCreateds {
      betAddress
      params_name
      params_endTimestamp
    }
    betResolveds {
      betAddress
      result
    }
  }
`

const contractABI = [
  {
    type: "function",
    name: "claimWinnings",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "checkWinnings",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  }
] as const

export default function MyBets() {
  const [userBets, setUserBets] = useState<any[]>([])
  const { address, isConnected } = useAccount()

  useEffect(() => {
    const fetchUserBets = async () => {
      if (!address) return

      try {
        const data = await request(GRAPH_URL, GET_USER_BETS, { userAddress: address }) as any
        const betsWithDetails = data.betMades.map((bet: any) => {
          const betDetails = data.betCreateds.find((created: any) => created.betAddress === bet.betAddress)
          const resolution = data.betResolveds.find((resolved: any) => resolved.betAddress === bet.betAddress)
          return {
            ...bet,
            params_name: betDetails?.params_name,
            params_endTimestamp: betDetails?.params_endTimestamp,
            resolved: !!resolution,
            result: resolution ? resolution.result : null
          }
        })
        setUserBets(betsWithDetails)
      } catch (error) {
        console.error('Error fetching user bets:', error)
        toast.error('Failed to fetch your bets')
      }
    }

    fetchUserBets()
  }, [address])

  const sortedBets = [...userBets].sort((a, b) => {
    const aEnded = parseInt(a.params_endTimestamp) * 1000 < Date.now()
    const bEnded = parseInt(b.params_endTimestamp) * 1000 < Date.now()
    if (aEnded && !bEnded) return 1
    if (!aEnded && bEnded) return -1
    return 0
  })

  const activeBets = sortedBets.filter(bet => parseInt(bet.params_endTimestamp) * 1000 >= Date.now())
  const endedBets = sortedBets.filter(bet => parseInt(bet.params_endTimestamp) * 1000 < Date.now())

  return (
      <div className="bg-gray-900 text-white min-h-screen">
        <Toaster />
        <main className="container mx-auto p-4">
          <h2 className="text-3xl font-bold mb-6">My Bets</h2>
          {!isConnected ? (
              <p className="text-center text-xl">Please connect your wallet to view your bets.</p>
          ) : userBets.length === 0 ? (
              <p className="text-center text-xl">You haven&apos;t placed any bets yet.</p>
          ) : (
              <>
                {activeBets.length > 0 && (
                    <>
                      <h3 className="text-2xl font-semibold mb-4">Active Bets</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {activeBets.map((bet) => (
                            <BetCard key={bet.id} bet={bet} />
                        ))}
                      </div>
                    </>
                )}
                {endedBets.length > 0 && (
                    <>
                      <h3 className="text-2xl font-semibold mb-4">Ended Bets</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {endedBets.map((bet) => (
                            <BetCard key={bet.id} bet={bet} />
                        ))}
                      </div>
                    </>
                )}
              </>
          )}
        </main>
      </div>
  )
}

function BetCard({ bet }: { bet: any }) {
  const { writeContract, data: writeData, isPending, isError } = useWriteContract()

  const { data: winnings } = useReadContract({
    address: bet.betAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'checkWinnings',
  })

  const { isLoading: isConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: writeData,
  })

  const handleClaim = async () => {
    try {
      await writeContract({
        address: bet.betAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'claimWinnings',
      })
    } catch (error) {
      console.error('Error claiming winnings:', error)
      toast.error('Failed to claim winnings')
    }
  }

  useEffect(() => {
    if (isClaimSuccess) {
      toast.success('Winnings claimed successfully!')
    }
  }, [isClaimSuccess])

  useEffect(() => {
    if (isError) {
      toast.error('Error claiming winnings')
    }
  }, [isError])

  const isBetEnded = parseInt(bet.params_endTimestamp) * 1000 < Date.now()

  const [isHovered, setIsHovered] = useState(false)

  return (
      <div
          className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
              isHovered ? 'transform scale-105' : ''
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-xl font-bold text-white leading-tight">{bet.params_name}</h3>
            <TrendingUp className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>Ends: {new Date(parseInt(bet.params_endTimestamp) * 1000).toLocaleString()}</span>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Your bet:</span>
              <span className={`font-semibold ${bet.side ? 'text-green-400' : 'text-red-400'}`}>
              {bet.side ? 'Yes' : 'No'}
            </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Amount:</span>
              <span className="font-semibold text-yellow-400">{formatEther(bet.amount)} ETH</span>
            </div>
          </div>
          {!isBetEnded ? (
              <div className="flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-full text-sm font-medium">
                Bet is active
              </div>
          ) : bet.resolved ? (
              <>
                <div className="flex items-center justify-center space-x-2">
                  {bet.result === bet.side ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span>{bet.result === bet.side ? 'Won' : 'Lost'}</span>
                </div>
                {winnings && winnings > BigInt(0) && (
                    <button
                        onClick={handleClaim}
                        disabled={isPending || isConfirming}
                        className={`w-full font-bold py-2 px-4 rounded-full transition-colors duration-200 ${
                            isPending || isConfirming
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                        }`}
                    >
                      {isPending || isConfirming ? 'Claiming...' : 'Claim Winnings'}
                    </button>
                )}
              </>
          ) : (
              <div className="flex items-center justify-center bg-gray-500 text-white py-2 px-4 rounded-full text-sm font-medium">
                Waiting for result
              </div>
          )}
          {winnings && winnings > BigInt(0) && (
              <p className="text-sm text-green-400">Claimable: {formatEther(winnings)} ETH</p>
          )}
        </div>
      </div>
  )
}