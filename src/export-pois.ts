import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import POI_ABI from './abi/poi.json'
import { ProposalParsed } from './export-proposals'
import { Category, GovernanceProposalType } from './interfaces/GovernanceProposal'
import { Decimals, Token } from './interfaces/Network'
import { saveToCSV, saveToJSON } from './utils'

require('dotenv').config()

interface POI {
  x?: number
  y?: number
}

const POI_ADDRESS = "0x0ef15a1c7a49429a36cb46d4da8c53119242b54e";

export type PointOfInterest = POI

const web3 = new Web3(process.env.INFURA_URL)


async function main() {
  const contract = new web3.eth.Contract(POI_ABI as AbiItem[], POI_ADDRESS)
  const size: number = (await contract.methods.size().call())

  for (var i = 0 ; i < size ; i ++) {
    const poi: string = (await contract.methods.get(i).call())
    console.log(poi)
  }
  console.log(size, 'points of interest found.')

  // TODO:
  // * pull all events, adds and deletes. include dates.
  // * store poi events in pois.json and csv, upload to transparency dashboard.

  // saveToJSON('pois.json', pois)
  // saveToCSV('pois.csv', pois, [
  //   { id: 'id', title: 'Proposal ID' },
  //   { id: 'snapshot_id', title: 'Snapshot ID' },
  //   { id: 'user', title: 'Author' },
  // ])
}

main()
