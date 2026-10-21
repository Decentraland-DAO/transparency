import { NetworkName } from './entities/Networks'
import { WALLETS } from './entities/Wallets'
import { reportToRollbarAndThrow, saveToCSV, saveToJSON } from './utils'
import { alchemyErc20Discovery, buildTreasuryBalances, RpcUrls } from './treasury-balances'

const apiKey = process.env.ALCHEMY_API_KEY

const RPC_URLS: RpcUrls = {
  [NetworkName.ETHEREUM]: `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
  [NetworkName.POLYGON]: `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`,
}

const MAX_SKIPPED_LOGGED = 50

async function main() {
  const { rows: balances, skipped } = await buildTreasuryBalances({
    wallets: WALLETS,
    rpcUrls: RPC_URLS,
    discoverErc20: alchemyErc20Discovery(RPC_URLS),
  })

  console.log(balances.length, 'balances found.')
  balances
    .filter(balance => balance.source !== 'curated')
    .forEach(balance =>
      console.log(
        `[${balance.source}] ${balance.name} (${balance.network}) ${balance.amount} ${balance.symbol}`,
        `= $${balance.quote.toFixed(2)}`,
        balance.underlying ? `(${balance.underlying.amount} ${balance.underlying.symbol})` : ''
      )
    )
  console.log(skipped.length, 'held tokens were not valued (spam or unknown positions).')
  skipped
    .slice(0, MAX_SKIPPED_LOGGED)
    .forEach(holding => console.log(`[skipped] ${holding.walletName} (${holding.network}) ${holding.contractAddress}: ${holding.reason}`))

  saveToJSON('balances.json', balances)
  // Same columns as before: the CSV is appended to the BalanceHistory sheet
  await saveToCSV('balances.csv', balances, [
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'name', title: 'Wallet' },
    { id: 'amount', title: 'Balance' },
    { id: 'symbol', title: 'Symbol' },
    { id: 'quote', title: 'USD Balance' },
    { id: 'rate', title: 'USD Rate' },
    { id: 'network', title: 'Network' },
    { id: 'address', title: 'Address' },
    { id: 'status', title: 'Status' },
    { id: 'contractAddress', title: 'Token' }
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
