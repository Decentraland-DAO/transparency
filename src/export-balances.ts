import BigNumber from "bignumber.js"
import { fetchURL, saveToCSV, saveToJSON } from "./utils"
require('dotenv').config()

const wallets = [
  ["Ethereum", "0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce", "Aragon Agent"],
  ["Ethereum", "0x89214c8Ca9A49E60a3bfa8e00544F384C93719b1", "DAO Committee"],
  ["Polygon", "0xB08E3e7cc815213304d884C88cA476ebC50EaAB2", "DAO Committee"],
]

const ALLOWED_SYMBOLS = ['MANA', 'MATIC', 'ETH', 'WETH', 'DAI', 'USDC', 'USDT']

const API_KEY = process.env.COVALENTHQ_API_KEY

type HoldingDetails = {
  balance: string
  quote: number
}

type Holding = {
  timestamp: string
  quote_rate: number
  open: HoldingDetails
  high: HoldingDetails
  low: HoldingDetails
  close: HoldingDetails
}

type ContractDetails = {
  contract_decimals: number
  contract_name: string
  contract_ticker_symbol: string
  contract_address: string
  supports_erc: null
  logo_url: string
  holdings: Holding[]
}

type Balance = {
  timestamp: string
  name: string
  amount: number
  quote: number
  rate: number
  symbol: string
  network: string
  address: string
  contractAddress: string
}

async function main() {
  let balances: Balance[] = []

  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i]
    const network = wallet[0] == "Ethereum" ? 1 : 137
    const address = wallet[1]
    const url = `https://api.covalenthq.com/v1/${network}/address/${address}/portfolio_v2/?key=${API_KEY}`
    const json = await fetchURL(url)
    const contracts: ContractDetails[] = json.data.items

    const holdings: Balance[] = contracts.map(t => ({
      timestamp: t.holdings[0].timestamp,
      name: wallet[2],
      amount: new BigNumber(t.holdings[0].close.balance).dividedBy(10 ** t.contract_decimals).toNumber(),
      quote: t.holdings[0].close.quote,
      rate: t.holdings[0].quote_rate,
      symbol: t.contract_ticker_symbol,
      network: wallet[0],
      address: address,
      contractAddress: t.contract_address
    }))
    balances.push(...holdings)
  }

  balances = balances.filter(
    b => ALLOWED_SYMBOLS.indexOf(b.symbol) != -1 && b.amount > 0
  )
  console.log(balances.length, 'balances found.')

  saveToJSON('balances.json', balances)
  saveToCSV('balances.csv', balances, [
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'name', title: 'Wallet' },
    { id: 'amount', title: 'Balance' },
    { id: 'symbol', title: 'Symbol' },
    { id: 'quote', title: 'USD Balance' },
    { id: 'rate', title: 'USD Rate' },
    { id: 'network', title: 'Network' },
    { id: 'address', title: 'Address' },
    { id: 'contractAddress', title: 'Token' },
  ])
}

main()