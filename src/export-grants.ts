import { rollbar } from './rollbar'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import PROPOSALS from '../public/proposals.json'
import VESTING_ABI from './abi/Ethereum/vesting.json'
import VESTING_V2_ABI from './abi/Ethereum/vesting_v2.json'
import { Networks } from './entities/Networks'
import { Tokens } from './entities/Tokens'
import { GovernanceProposalType, Status } from './interfaces/GovernanceProposal'
import {
  GrantProposal,
  GrantUpdate,
  GrantUpdateResponse,
  OneTimePaymentInfo,
  Updates,
  UpdateStatus,
  VestingInfo,
  VestingStatus
} from './interfaces/Grant'
import { Decoded, DecodedName, ParamName, TransactionItem } from './interfaces/Transactions/Transactions'
import {
  baseCovalentUrl,
  COVALENT_API_KEY,
  fetchCovalentURL,
  fetchURL,
  getMonthsBetweenDates,
  INFURA_URL,
  isSameAddress,
  parseNumber,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON,
  toISOString
} from './utils'

const web3 = new Web3(INFURA_URL)

function getTxAmount(decodedLogEvent: Decoded, decimals: number) {
  for (let param of decodedLogEvent.params) {
    if (param.name === ParamName.Value) {
      return parseNumber(Number(param.value), decimals)
    }
  }
  return null
}

function getInitialVestingStatus(startAt: string, finishAt: string) {
  const now = new Date()

  if (now < new Date(startAt)) {
    return VestingStatus.Pending
  }

  if (now < new Date(finishAt)) {
    return VestingStatus.InProgress
  }

  return VestingStatus.Finished
}

async function _getVestingContractDataV1(vestingAddress: string): Promise<VestingInfo> {
  const vestingContract = new web3.eth.Contract(VESTING_ABI as AbiItem[], vestingAddress)
  const contract_token_address: string = (await vestingContract.methods.token().call()).toLowerCase()
  const token = Tokens.getEthereumToken(contract_token_address)
  const decimals = token.decimals

  const raw_vesting_released = await vestingContract.methods.released().call()
  const vesting_released = parseNumber(raw_vesting_released, decimals)

  const raw_vesting_releasable = await vestingContract.methods.releasableAmount().call()
  const vesting_releasable = parseNumber(raw_vesting_releasable, decimals)

  const contractStart: number = await vestingContract.methods.start().call()
  const contractDuration: number = await vestingContract.methods.duration().call()
  const contractEndsTimestamp = Number(contractStart) + Number(contractDuration)
  const vesting_start_at = toISOString(contractStart)
  const vesting_finish_at = toISOString(contractEndsTimestamp)

  const tokenContract = new web3.eth.Contract(token.abi, contract_token_address)
  const raw_token_contract_balance = await tokenContract.methods.balanceOf(vestingAddress).call()
  const vesting_token_contract_balance = parseNumber(raw_token_contract_balance, decimals)
  const vesting_total_amount = vesting_token_contract_balance + vesting_released

  let vesting_status = getInitialVestingStatus(vesting_start_at, vesting_finish_at)

  const isRevoked = await vestingContract.methods.revoked().call()

  if (isRevoked) {
    vesting_status = VestingStatus.Revoked
  }

  return {
    token: token.symbol,
    vesting_released,
    vesting_releasable,
    vesting_start_at,
    vesting_finish_at,
    vesting_token_contract_balance,
    vesting_total_amount,
    vesting_status,
    duration_in_months: getMonthsBetweenDates(new Date(vesting_start_at), new Date(vesting_finish_at))
  }
}

async function _getVestingContractDataV2(vestingAddress: string): Promise<VestingInfo> {
  const vestingContract = new web3.eth.Contract(VESTING_V2_ABI as AbiItem[], vestingAddress)
  const contract_token_address: string = (await vestingContract.methods.getToken().call()).toLowerCase()
  const token = Tokens.getEthereumToken(contract_token_address)
  const decimals = token.decimals

  const raw_vesting_released = await vestingContract.methods.getReleased().call()
  const vesting_released = parseNumber(raw_vesting_released, decimals)

  const raw_vesting_releasable = await vestingContract.methods.getReleasable().call()
  const vesting_releasable = parseNumber(raw_vesting_releasable, decimals)

  const contractStart: number = await vestingContract.methods.getStart().call()
  const contractDuration: number = await vestingContract.methods.getPeriod().call()
  const contractEndsTimestamp = Number(contractStart) + Number(contractDuration)
  const vesting_start_at = toISOString(contractStart)
  const vesting_finish_at = toISOString(contractEndsTimestamp)

  const tokenContract = new web3.eth.Contract(token.abi, contract_token_address)
  const raw_token_contract_balance = await tokenContract.methods.balanceOf(vestingAddress).call()
  const vesting_token_contract_balance = parseNumber(raw_token_contract_balance, decimals)
  const vesting_total_amount = vesting_token_contract_balance + vesting_released

  let vesting_status = getInitialVestingStatus(vesting_start_at, vesting_finish_at)

  const isRevoked = await vestingContract.methods.getIsRevoked().call()

  if (isRevoked) {
    vesting_status = VestingStatus.Revoked
  } else {
    const isPaused = await vestingContract.methods.paused().call()
    if (isPaused) {
      vesting_status = VestingStatus.Paused
    }
  }

  return {
    token: token.symbol,
    vesting_released,
    vesting_releasable,
    vesting_start_at,
    vesting_finish_at,
    vesting_token_contract_balance,
    vesting_total_amount,
    vesting_status,
    duration_in_months: getMonthsBetweenDates(new Date(vesting_start_at), new Date(vesting_finish_at))
  }
}

async function getVestingContractData(proposalId: string, vestingAddress: string): Promise<VestingInfo> {
  try {
    return await _getVestingContractDataV1(vestingAddress)
  } catch (errorV1) {
    try {
      return await _getVestingContractDataV2(vestingAddress)
    } catch (errorV2) {
      rollbar.log(`Error trying to get vesting data for proposal ${proposalId}, vesting address ${vestingAddress}`, `Error V1: ${errorV1}, Error V2: ${errorV2}`)
    }
  }
}

function transferMatchesBeneficiary(decodedLogEvent: Decoded, beneficiary: string) {
  return decodedLogEvent && decodedLogEvent.name === DecodedName.Transfer &&
    decodedLogEvent.params.some(param => {
      return param.name === ParamName.To && isSameAddress(String(param.value), beneficiary)
    })
}

async function getTransactionItems(enactingTx: string) {
  const items = await fetchCovalentURL<TransactionItem>(`${baseCovalentUrl(Networks.getEth())}/transaction_v2/${enactingTx}/?key=${COVALENT_API_KEY}`, 0)
  return items[0]
}

async function getEnactingTxData(proposalId: string, enactingTx: string, beneficiary: string): Promise<OneTimePaymentInfo> {
  try {
    const transactionItems = await getTransactionItems(enactingTx)
    for (let logEvent of transactionItems.log_events) {
      const decodedLogEvent = logEvent.decoded
      if (transferMatchesBeneficiary(decodedLogEvent, beneficiary)) {
        const token = Tokens.getEthereumToken(logEvent.sender_address)
        const decimals = token.decimals
        const tx_date = logEvent.block_signed_at
        const tx_amount: number = getTxAmount(decodedLogEvent, decimals)
        return { token: token.symbol, tx_date, tx_amount }
      }
    }
    return null
  } catch (e) {
    console.log(`Error trying to get contract data for proposal ${proposalId}`, e)
  }
}

function getUpdatesAmountByStatus(updates: GrantUpdate[], status: UpdateStatus): number {
  return updates.filter(update => update.status === status).length
}

function parseUpdatesInfo(updatesResponseData: GrantUpdateResponse['data']): Updates {

  const lastUpdate = updatesResponseData.publicUpdates.filter(
    update => update.status === UpdateStatus.Done || update.status === UpdateStatus.Late
  ).sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())[0]
  return {
    done_updates: getUpdatesAmountByStatus(updatesResponseData.publicUpdates, UpdateStatus.Done),
    late_updates: getUpdatesAmountByStatus(updatesResponseData.publicUpdates, UpdateStatus.Late),
    missed_updates: getUpdatesAmountByStatus(updatesResponseData.publicUpdates, UpdateStatus.Pending),
    update_status: updatesResponseData.currentUpdate?.status || lastUpdate?.status,
    health: lastUpdate?.health,
    last_update: lastUpdate?.completion_date,
    next_update: updatesResponseData.nextUpdate?.due_date,
    pending_updates: updatesResponseData.pendingUpdates.length
  }
}

async function setEnactingData(proposal: GrantProposal): Promise<void> {

  const assignProposalData = (data: Updates | VestingInfo | OneTimePaymentInfo) => {
    Object.assign(proposal, data)
  }

  if (proposal.vesting_address) {
    const vestingContractData = await getVestingContractData(proposal.id, proposal.vesting_address.toLowerCase())
    assignProposalData(vestingContractData)
  }
  if (proposal.enacting_tx) {
    const enactingTxData = await getEnactingTxData(proposal.id, proposal.enacting_tx.toLowerCase(), proposal.beneficiary)
    assignProposalData(enactingTxData)
  }
  if (proposal.vesting_address === null && proposal.enacting_tx === null) {
    console.log(`A proposal without vesting address and enacting tx has been found. Id ${proposal.id}`)
  }

  const grantUpdateResponse: GrantUpdateResponse = await fetchURL(`https://governance.decentraland.org/api/proposals/${proposal.id}/updates`)

  if (!grantUpdateResponse.ok) {
    console.log(`Error trying to get updates for proposal ${proposal.id} - Message: ${grantUpdateResponse.error}`)
  } else {
    const updateInfo = parseUpdatesInfo(grantUpdateResponse.data)
    assignProposalData(updateInfo)
  }
}

async function main() {
  // Get Governance dApp Proposals
  const proposals: GrantProposal[] = PROPOSALS.filter(p => p.type === GovernanceProposalType.GRANT)
  const unresolvedEnactingData: Promise<void>[] = []

  for (const proposal of proposals) {
    proposal.category = proposal.configuration.category
    proposal.tier = proposal.configuration.tier.split(':')[0]
    proposal.size = proposal.configuration.size
    proposal.beneficiary = proposal.configuration.beneficiary

    if (proposal.status === Status.ENACTED) {
      unresolvedEnactingData.push(setEnactingData(proposal))
    }
  }

  await Promise.all(unresolvedEnactingData)

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

    { id: 'vesting_status', title: 'Vesting Status' },
    { id: 'vesting_address', title: 'Vesting Contract' },
    { id: 'vesting_released', title: 'Vesting Released Amount' },
    { id: 'vesting_releasable', title: 'Vesting Releasable Amount' },
    { id: 'vesting_token_contract_balance', title: 'Vesting Token Contract Balance' },
    { id: 'vesting_total_amount', title: 'Vesting Total Amount' },
    { id: 'vesting_start_at', title: 'Vesting Start At' },
    { id: 'vesting_finish_at', title: 'Vesting Finish At' },
    { id: 'duration_in_months', title: 'Duration (Months)' },

    { id: `enacting_tx`, title: 'Enacting Transaction' },
    { id: 'tx_date', title: 'Transaction Date' },
    { id: 'tx_amount', title: 'Transaction Amount' },

    { id: 'done_updates', title: 'Done Updates' },
    { id: 'late_updates', title: 'Late Updates' },
    { id: 'missed_updates', title: 'Missed Updates' },
    { id: 'update_status', title: 'Update Status' },
    { id: 'health', title: 'Project Health' },
    { id: 'last_update', title: 'Last Update' },
    { id: 'next_update', title: 'Next Update' },
    { id: 'pending_updates', title: 'Pending Updates' }
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))