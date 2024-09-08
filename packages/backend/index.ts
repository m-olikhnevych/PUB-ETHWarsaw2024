import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

import BetFactoryABI from './abis/BetFactory.json';
import PromptABI from './abis/Prompt.json';

dotenv.config();

// GraphQL client setup
const client = new ApolloClient({
  uri: process.env.GRAPHQL_API_URL,
  cache: new InMemoryCache()
});

// Smart contract setup
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const betFactoryAddress = process.env.BET_FACTORY_ADDRESS!;
const promptAddress = process.env.PROMPT_ADDRESS!;
const betFactory = new ethers.Contract(betFactoryAddress, BetFactoryABI, wallet);
const prompt = new ethers.Contract(promptAddress, PromptABI, wallet);

// GraphQL query
const GET_BETS = gql`
query GetActiveBets {
    betCreateds(orderBy: params_endTimestamp, orderDirection: asc) {
      id
      betAddress
      betId
      params_name
      params_description
      params_prompt
      params_endTimestamp
    }
  }
`;

interface Bet {
  betId: string;
  params_endTimestamp: string;
}

async function fetchBets(): Promise<Bet[]> {
  const result = await client.query({ query: GET_BETS });
  return result.data.betCreateds;
}

async function solveBet(betId: string) {
  console.log(`Solving bet ${betId}`);
  try {
    const fee = await prompt.estimateFee(11);
    const value = Number(fee) / 10 ** 16;
    const tx = await betFactory.solveBet(betId, { value: ethers.parseEther(value.toString()) });
    await tx.wait();
    console.log(`Bet ${betId} solved successfully`);
  } catch (error) {
    console.error(`Error solving bet ${betId}:`, error);
  }
}

async function checkAndSolveBets() {
  const bets = await fetchBets();
  console.log('Checking bets:', bets);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  console.log('Current timestamp:', currentTimestamp);

  for (const bet of bets) {
    if (currentTimestamp >= parseInt(bet.params_endTimestamp)) {
      await solveBet(bet.betId);
    }
  }
}

// Run the check every minute
setInterval(checkAndSolveBets, 60 * 1000);

console.log('Bet resolver service started');
