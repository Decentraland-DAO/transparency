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
