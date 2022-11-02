export enum NetworkName {
  ETHEREUM = 'Ethereum',
  POLYGON = 'Polygon',
}

export type Network = {
  name: `${NetworkName}`
  id: number
}

export type DataByNetworks<T> = Record<NetworkName, T>

const NETWORKS: Network[] = [
  { name: NetworkName.ETHEREUM, id: 1 },
  { name: NetworkName.POLYGON, id: 137 },
]

export class Networks {
  static get(name: `${NetworkName}` | NetworkName): Network {
    return NETWORKS.find(network => network.name === name)
  }

  static getEth(): Network {
    return Networks.get(NetworkName.ETHEREUM)
  }

  static getPolygon(): Network {
    return Networks.get(NetworkName.POLYGON)
  }

  static getAll(): Network[] {
    return NETWORKS
  }
}