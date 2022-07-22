import Networks, { NetworkType } from "./Networks"

export type Wallet = {
  name: string
  address: string
  network: NetworkType
}

enum WalletNames {
  ARAGON = "Aragon Agent",
  DAO = "DAO Committee",
}

export class Wallets {
  private static readonly WALLETS: Wallet[] = [
    { name: WalletNames.ARAGON, address: "0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce", network: Networks.ETHEREUM },
    { name: WalletNames.DAO, address: "0x89214c8ca9a49e60a3bfa8e00544f384c93719b1", network: Networks.ETHEREUM },
    { name: WalletNames.DAO, address: "0xb08e3e7cc815213304d884c88ca476ebc50eaab2", network: Networks.POLYGON },
  ]

  public static get(): Wallet[] {
    return this.WALLETS
  }

  public static getWalletByAddress(address: string): Wallet {
    const wallet = this.WALLETS.find(w => w.address === address.toLowerCase())
    if (!wallet) {
      throw new Error(`Wallet with address ${address} not found`)
    }
    return wallet
  }

  public static getAddresses(): string[] {
    return this.WALLETS.map(w => w.address)
  }
}