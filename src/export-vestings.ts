import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import PROPOSALS from '../public/proposals.json'
import { ProposalParsed } from './export-proposals'
import { Category, GovernanceProposalType } from './interfaces/GovernanceProposal'
import { Decimals, Token } from './interfaces/Network'
import { saveToCSV, saveToJSON } from './utils'

require('dotenv').config()

interface Grant {
  grant_category?: Category
  grant_tier?: string
  grant_size?: number
  grant_beneficiary?: string
  token?: Token
  released?: number
  releasable?: number
  vesting_finish_at?: Date
}

interface Vesting {
  owner: string
  token: string
  beneficiary: string
  start_date: number
  cliff: number
  duration: number
  revocable: string
}


export type GrantProposal = Grant & ProposalParsed

const web3 = new Web3(process.env.INFURA_URL)

const DECIMALS = {
  "0x0f5d2fb29fb7d3cfee444a200298f468908cc942": [Token.MANA, Decimals.MANA],
  "0x6b175474e89094c44da98b954eedeac495271d0f": [Token.DAI, Decimals.DAI],
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": [Token.USDC, Decimals.USDC],
  "0xdac17f958d2ee523a2206206994597c13d831ec7": [Token.USDT, Decimals.USDT],
}

function parseNumber(n: number, decimals: number) {
  return new BigNumber(n).dividedBy(10 ** decimals).toNumber();
}

async function main() {
  // Get Gobernance dApp Proposals
  const proposals: GrantProposal[] = PROPOSALS.filter(
    p => p.type === GovernanceProposalType.GRANT &&
    p.status == 'passed' && (
      p.configuration.tier.startsWith("Tier 3") || 
      p.configuration.tier.startsWith("Tier 4") ||
      p.configuration.tier.startsWith("Tier 5") || 
      p.configuration.tier.startsWith("Tier 6")
  ));
  const vestings : Vesting[] = [];

  for (const p of proposals) {
    p.grant_category = p.configuration.category
    p.grant_size = p.configuration.size
    p.grant_beneficiary = p.configuration.beneficiary

    let token = p.configuration.tier.startsWith("Tier 3") ? "0x0f5d2fb29fb7d3cfee444a200298f468908cc942" : "0x6b175474e89094c44da98b954eedeac495271d0f";
    let duration = p.configuration.tier.startsWith("Tier 3") ? 7776000 : 15552000;

    console.log(p.title);

    vestings.push({
      owner: '0x89214c8Ca9A49E60a3bfa8e00544F384C93719b1',
      token: token,
      beneficiary: p.grant_beneficiary,
      start_date: ~~((new Date(p.finish_at)).getTime() / 1000),
      cliff: 2592000,
      duration: duration,
      revocable: "Yes",
    });
  }

  console.log(vestings.length, 'grants found.')

  saveToJSON('vestings.json', vestings)
  saveToCSV('vestings.csv', vestings, [
    { id: 'owner', title: 'Owner' },
    { id: 'token', title: 'Token' },
    { id: 'beneficiary', title: 'Beneficiary' },
    { id: 'start_date', title: 'Start Date' },
    { id: 'cliff', title: 'Cliff' },
    { id: 'duration', title: 'Duration' },
    { id: 'revocable', title: 'Revocable' },
  ])
}

main()
