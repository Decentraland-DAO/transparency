import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import PROPOSALS from '../public/proposals.json'
import VESTING_ABI from './abi/vesting.json'
import { GovernanceProposalType, Status } from './interfaces/GovernanceProposal'
import { GrantProposal } from './interfaces/Grant'
import { getTokenByAddress, Network, NetworkID, Token, TOKENS } from './interfaces/Network'
import { APITransactions, Decoded, DecodedName, ParamName } from './interfaces/Transactions/Transactions'
import { COVALENT_API_KEY, fetchURL, INFURA_URL, saveToCSV, saveToJSON } from './utils'

const web3 = new Web3(INFURA_URL)

function parseNumber(n: number, decimals: number) {
  return new BigNumber(n).dividedBy(10 ** decimals).toNumber()
}

function getTxAmount(decodedLogEvent: Decoded, decimals: number) {
  for (let param of decodedLogEvent.params) {
    if (param.name === ParamName.Value) {
      return parseNumber(Number(param.value), decimals)
    }
  }
  return null
}

async function getVestingContractData(proposalId: string, vestingAddress: string) {
  try {
    const vestingContract = new web3.eth.Contract(VESTING_ABI as AbiItem[], vestingAddress)
    const contract_token_address: string = (await vestingContract.methods.token().call()).toLowerCase()
    const token = getTokenByAddress(contract_token_address)
    const decimals: number = TOKENS[token].decimals

    const raw_vesting_released = await vestingContract.methods.released().call()
    const vesting_released = parseNumber(raw_vesting_released, decimals)

    const raw_vesting_releasable = await vestingContract.methods.releasableAmount().call()
    const vesting_releasable = parseNumber(raw_vesting_releasable, decimals)

    const contractStart: number = await vestingContract.methods.start().call()
    const contractDuration: number = await vestingContract.methods.duration().call()
    const contractEndsTimestamp = Number(contractStart) + Number(contractDuration)
    const vesting_start_at = new Date(contractStart * 1000)
    const vesting_finish_at = new Date(contractEndsTimestamp * 1000)

    const tokenContract = new web3.eth.Contract(TOKENS[token].abi, TOKENS[token].address)
    const raw_token_contract_balance = await tokenContract.methods.balanceOf(vestingAddress).call()
    const vesting_token_contract_balance = parseNumber(raw_token_contract_balance, decimals)
    const vesting_total_amount = vesting_token_contract_balance + vesting_released

    return {
      token,
      vesting_released,
      vesting_releasable,
      vesting_start_at,
      vesting_finish_at,
      vesting_token_contract_balance,
      vesting_total_amount
    }
  } catch (e) {
    console.log(`Error trying to get vesting data for proposal ${proposalId}, vesting address ${vestingAddress}`, e)
  }
}

function transferMatchesBeneficiary(decodedLogEvent: Decoded, beneficiary: string) {
  return decodedLogEvent && decodedLogEvent.name === DecodedName.Transfer &&
    decodedLogEvent.params.some(param => {
      return param.name === ParamName.To && String(param.value).toLowerCase() === beneficiary.toLowerCase()
    })
}

async function getTransactionItems(enactingTx: string) {
  const url = `https://api.covalenthq.com/v1/${NetworkID[Network.ETHEREUM]}/transaction_v2/${enactingTx}/?key=${COVALENT_API_KEY}`
  const json = await fetchURL(url)
  if (json.error) {
    throw new Error(JSON.stringify(json))
  }
  const data: APITransactions = json.data
  return data.items[0]
}

async function getEnactingTxData(proposalId: string, enactingTx: string, beneficiary: string) {
  try {
    const transactionItems = await getTransactionItems(enactingTx)
    for (let logEvent of transactionItems.log_events) {
      const decodedLogEvent = logEvent.decoded
      if (transferMatchesBeneficiary(decodedLogEvent, beneficiary)) {
        const token: Token = getTokenByAddress(logEvent.sender_address)
        const decimals: number = TOKENS[token].decimals
        const tx_date = logEvent.block_signed_at
        const tx_amount: number = getTxAmount(decodedLogEvent, decimals)
        return { token, tx_date, tx_amount }
      }
    }
    return null
  } catch (e) {
    console.log(`Error trying to get contract data for proposal ${proposalId}`, e)
  }
}

async function setEnactingData(proposal: GrantProposal): Promise<void> {
  if (proposal.vesting_address) {
    const vestingContractData = await getVestingContractData(proposal.id, proposal.vesting_address.toLowerCase())
    Object.assign(proposal, vestingContractData)
  }
  if (proposal.enacting_tx) {
    const enactingTxData = await getEnactingTxData(proposal.id, proposal.enacting_tx.toLowerCase(), proposal.beneficiary)
    Object.assign(proposal, enactingTxData)
  }
  if (proposal.vesting_address === null && proposal.enacting_tx === null) {
    console.log(`A proposal without vesting address and enacting tx has been found. Id ${proposal.id}`)
  }
}

async function main() {
  // Get Governance dApp Proposals
  const proposals: GrantProposal[] = PROPOSALS.filter(p => p.type === GovernanceProposalType.GRANT)
  const enactingData: Promise<void>[] = []

  for (const proposal of proposals) {
    proposal.category = proposal.configuration.category
    proposal.tier = proposal.configuration.tier.split(':')[0]
    proposal.size = proposal.configuration.size
    proposal.beneficiary = proposal.configuration.beneficiary

    if(proposal.status === Status.ENACTED){
      enactingData.push(setEnactingData(proposal))
    }
  }

  await Promise.all(enactingData)

  console.log(proposals.length, 'grants found.')

  saveToJSON('grants.json', proposals)
  await saveToCSV('grants.csv', proposals, [
    { id: 'id', title: 'Proposal ID' },
    { id: 'snapshot_id', title: 'Snapshot ID' },
    { id: 'user', title: 'Author' },

    { id: 'title', title: 'Title' },
    { id: 'status', title: 'Status' },
    { id: 'start_at', title: 'Started' },
    { id: 'finish_at', title: 'Ended' },
    { id: 'required_to_pass', title: 'Threshold' },
    { id: 'scores_total', title: 'Total VP' },

    { id: 'category', title: 'Category' },
    { id: 'tier', title: 'Tier' },
    { id: 'size', title: 'Amount USD' },
    { id: 'beneficiary', title: 'Beneficiary' },
    { id: 'token', title: 'Token' },

    { id: 'vesting_address', title: 'Vesting Contract' },
    { id: 'vesting_released', title: 'Vesting Released Amount' },
    { id: 'vesting_releasable', title: 'Vesting Releasable Amount' },
    { id: 'vesting_token_contract_balance', title: 'Vesting Token Contract Balance' },
    { id: 'vesting_total_amount', title: 'Vesting Total Amount' },
    { id: 'vesting_start_at', title: 'Vesting Start At' },
    { id: 'vesting_finish_at', title: 'Vesting Finish At' },

    { id: `enacting_tx`, title: 'Enacting Transaction' },
    { id: 'tx_date', title: 'Transaction Date' },
    { id: 'tx_amount', title: 'Transaction Amount' }
  ])
}

main()
