export enum NetworkName {
  ETHEREUM = 'Ethereum',
  POLYGON = 'Polygon',
}

export type NetworkType = {
  name: `${NetworkName}`
  id: number
}

class Networks {
  static readonly ETHEREUM: NetworkType = {
    name: NetworkName.ETHEREUM,
    id: 1,
  }

  static readonly POLYGON: NetworkType = {
    name: NetworkName.POLYGON,
    id: 137,
  }

  private static readonly LIST = [Networks.ETHEREUM, Networks.POLYGON]

  static get(name: `${NetworkName}`): NetworkType {
    return this.LIST.find(network => network.name === name)
  }

  static getAll(): NetworkType[] {
    return this.LIST
  }
}

export default Networks