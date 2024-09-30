import { Networks, Network } from "./Networks"

export type Wallet = {
  name: string
  address: string
  network: Network
}

enum WalletNames {
  ARAGON = "Aragon Agent",
  DAO = "DAO Committee",
}

export const WALLETS: Wallet[] = [
  { name: WalletNames.ARAGON, address: "0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce", network: Networks.getEth() },
  { name: WalletNames.DAO, address: "0x89214c8ca9a49e60a3bfa8e00544f384c93719b1", network: Networks.getEth() },
  { name: WalletNames.DAO, address: "0xb08e3e7cc815213304d884c88ca476ebc50eaab2", network: Networks.getPolygon() },
]

export class Wallets {
  public static getAll(): Wallet[] {
    return WALLETS
  }

  public static getAddresses(): string[] {
    return WALLETS.map(w => w.address)
  }
}
