import BigNumber from "bignumber.js"
import { Contract } from "./interfaces/Balance"
import { Network, NetworkID, Token } from "./interfaces/Network"
import { fetchURL, saveToCSV, saveToJSON, wallets } from "./utils"
require('dotenv').config()

const ALLOWED_SYMBOLS = [Token.MANA, Token.MATIC, Token.ETH, Token.WETH, Token.DAI, Token.USDC, Token.USDT]

const API_KEY = process.env.COVALENTHQ_API_KEY

type BalanceParsed = {
  timestamp: Date
  name: string
  amount: number
  quote: number
  rate: number
  symbol: Token
  network: string
  address: string
  contractAddress: string
}

async function main() {
  let balances: BalanceParsed[] = []

  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i]
    const network = wallet[0] === Network.ETHEREUM ? NetworkID[Network.ETHEREUM] : NetworkID[Network.POLYGON]
    const address = wallet[1]
    const url = `https://api.covalenthq.com/v1/${network}/address/${address}/portfolio_v2/?key=${API_KEY}`
    const json = await fetchURL(url)
    const contracts: Contract[] = json.data.items

    const balanceParsed: BalanceParsed[] = contracts.map(t => ({
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
    balances.push(...balanceParsed)
  }

  balances = balances.filter(
    b => ALLOWED_SYMBOLS.includes(b.symbol) && b.amount > 0
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