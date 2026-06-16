import { Networks, Network } from "./Networks"

export enum WalletStatus {
  // Under DAO control; funds are available to the DAO.
  ACTIVE = "active",
  // Controlled by a third party (e.g. the former DAO Committee); funds are
  // NOT currently available to the DAO.
  DISPUTED = "disputed",
}

export type Wallet = {
  name: string
  address: string
  network: Network
  status: WalletStatus
}

enum WalletNames {
  ARAGON = "Aragon Agent",
  DAO = "DAO Committee",
  COUNCIL = "DAO Council Operational Multisig",
  TREASURY_MANAGEMENT = "DAO Treasury Management Multisig",
}

// Proposal that deprecated the DAO Committee and created the Council
// Operational Multisig. Surfaced in the UI as the "Learn more" reference.
export const COMMITTEE_DEPRECATION_PROPOSAL_ID = "bb2b8234-42aa-4ca2-a049-3c7355d4caa4"

export const WALLETS: Wallet[] = [
  {
    name: WalletNames.ARAGON,
    address: "0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce",
    network: Networks.getEth(),
    status: WalletStatus.ACTIVE,
  },
  // DAO Council Operational Multisig (3-of-5). Replaces the deprecated DAO
  // Committee per proposal bb2b8234. Deployed on Ethereum; a Polygon
  // deployment is expected. Balances are scanned on BOTH networks for every
  // address (see export-balances.ts), so a same-address Polygon Safe will be
  // tracked automatically once deployed. If the Polygon Safe is deployed to a
  // DIFFERENT address, add a second entry here for that address.
  {
    name: WalletNames.COUNCIL,
    address: "0x184e4d9a26add0af1eafc145550e890a421f16d7",
    network: Networks.getEth(),
    status: WalletStatus.ACTIVE,
  },
  // DAO Treasury Management Multisig. A classic (Safe) multisig used as a
  // modern alternative to the Aragon Agent for treasury / DeFi operations
  // (e.g. staking ETH, trading MANA, depositing stablecoins into DeFi vaults),
  // which are impractical through the Aragon finance app. Funded from the
  // Aragon Agent and managed by a group defined by the DAO Council per:
  //   - "Approval of Decentraland Treasury Mandate"
  //     https://snapshot.org/#/s:daocouncil.dcl.eth/proposal/0x4180bc3bd1669224a425a625dfa61e06610b7c205d3e9151e81ae40f64cfee33
  //   - "Treasury Withdrawal to Operational Multisig for DAO Operations and Capital Deployment to Avantgarde"
  //     https://snapshot.org/#/s:daocouncil.dcl.eth/proposal/0x866e65525317e6dda4913533e279989dee28e8c033acf705b54a843d813a545a
  // NOTE: balances only cover the fixed token list in entities/Tokens.ts
  // (MANA, ETH, MATIC, DAI, USDT, USDC, WETH). DeFi positions held as other
  // tokens — staked ETH (stETH/wstETH/rETH), LP tokens, vault receipt tokens
  // (aTokens, yVault shares, etc.) — are NOT yet captured, so funds deployed
  // into protocols will under-report here. Tracking those needs a follow-up
  // (extend TOKENS or integrate a portfolio API such as DeBank/Zapper/Zerion).
  {
    name: WalletNames.TREASURY_MANAGEMENT,
    address: "0x96e2f6099860731cfdc0af700de862cf6eba4407",
    network: Networks.getEth(),
    status: WalletStatus.ACTIVE,
  },
  // The former DAO Committee multisigs remain controlled by the deprecated
  // committee, which has not returned the assets to the DAO. Flagged as
  // disputed so the transparency UI can warn that these funds are withheld.
  {
    name: WalletNames.DAO,
    address: "0x89214c8ca9a49e60a3bfa8e00544f384c93719b1",
    network: Networks.getEth(),
    status: WalletStatus.DISPUTED,
  },
  {
    name: WalletNames.DAO,
    address: "0xb08e3e7cc815213304d884c88ca476ebc50eaab2",
    network: Networks.getPolygon(),
    status: WalletStatus.DISPUTED,
  },
]

export class Wallets {
  public static getAll(): Wallet[] {
    return WALLETS
  }

  public static getAddresses(): string[] {
    return WALLETS.map(w => w.address)
  }
}
