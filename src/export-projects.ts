import Web3 from 'web3'
import type { Contract } from 'web3-eth-contract'
import type { AbiItem } from 'web3-utils'
import PROPOSALS from '../public/proposals.json'
import pLimit from 'p-limit'

import VESTING_ABI from './abi/Ethereum/vesting.json'
import VESTING_V2_ABI from './abi/Ethereum/vesting_v2.json'
import { Networks } from './entities/Networks'
import { Tokens } from './entities/Tokens'
import { GovernanceProposalType, Status } from './interfaces/GovernanceProposal'
import {
  GrantUpdate,
  OneTimePaymentInfo,
  Project,
  ProjectUpdateResponse,
  ProposalProject,
  Updates,
  UpdateStatus,
  VestingInfo,
  VestingStatus
} from './interfaces/Project'
import { Decoded, DecodedName, ParamName, TransactionItem } from './interfaces/Transactions/Transactions'

import { rollbar } from './rollbar'
import {
  baseCovalentUrl,
  COVALENT_API_KEY,
  fetchCovalentURL,
  fetchURL,
  flattenArray,
  getChecksumAddress,
  getMonthsBetweenDates,
  ALCHEMY_URL,
  isSameAddress,
  parseNumber,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON,
  toISOString,
  governanceUrl
} from './utils'
import { ProposalParsed } from './interfaces/Proposal'

const web3 = new Web3(ALCHEMY_URL)
const limit = pLimit(1)

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
  const vesting_contract_token_balance = parseNumber(raw_token_contract_balance, decimals)
  const vesting_total_amount = vesting_contract_token_balance + vesting_released

  let vesting_status = getInitialVestingStatus(vesting_start_at, vesting_finish_at)

  const isRevoked = await vestingContract.methods.revoked().call()

  if (isRevoked) {
    vesting_status = VestingStatus.Revoked
  }

  return {
    token: token.symbol,
    vesting_address: vestingAddress.toLowerCase(),
    vesting_released,
    vesting_releasable,
    vesting_start_at,
    vesting_finish_at,
    vesting_contract_token_balance,
    vesting_total_amount,
    vesting_status,
    duration_in_months: getMonthsBetweenDates(new Date(vesting_start_at), new Date(vesting_finish_at)),
  }
}

async function _getVestingV2Dates(vestingContract: Contract) {
  const contractStart: number = await vestingContract.methods.getStart().call()
  const contractDuration = await vestingContract.methods.getPeriod().call()
  const vesting_start_at = toISOString(contractStart)
  let contractEndsTimestamp = 0
  let vesting_finish_at = ''

  if (await vestingContract.methods.getIsLinear().call()) {
    contractEndsTimestamp = Number(contractStart) + Number(contractDuration)
    vesting_finish_at = toISOString(contractEndsTimestamp)
  } else {
    const periods = (await vestingContract.methods.getVestedPerPeriod().call()).length || 0
    contractEndsTimestamp = Number(contractStart) + Number(contractDuration) * periods
    vesting_finish_at = toISOString(contractEndsTimestamp)
  }

  return { vesting_start_at, vesting_finish_at }
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

  const { vesting_start_at, vesting_finish_at } = await _getVestingV2Dates(vestingContract)

  const tokenContract = new web3.eth.Contract(token.abi, contract_token_address)
  const raw_token_contract_balance = await tokenContract.methods.balanceOf(vestingAddress).call()
  const vesting_contract_token_balance = parseNumber(raw_token_contract_balance, decimals)
  const raw_vesting_total_amount = await vestingContract.methods.getTotal().call()
  const vesting_total_amount =  parseNumber(raw_vesting_total_amount, decimals)
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
    vesting_address: vestingAddress.toLowerCase(),
    vesting_released,
    vesting_releasable,
    vesting_start_at,
    vesting_finish_at,
    vesting_contract_token_balance,
    vesting_total_amount,
    vesting_status,
    duration_in_months: getMonthsBetweenDates(new Date(vesting_start_at), new Date(vesting_finish_at)),
  }
}

async function getVestingContractData(proposalId: string, vestingAddresses: string[]): Promise<VestingInfo[]> {
  try {
    return await Promise.all(vestingAddresses.map((address) => limit(() => _getVestingContractDataV1(getChecksumAddress(address)))))
  } catch (errorV1) {
    try {
      return await Promise.all(vestingAddresses.map((address) => limit(() => _getVestingContractDataV2(getChecksumAddress(address)))))
    } catch (errorV2) {
      rollbar.error(`Error trying to get vesting data`, { proposalId, vestingAddresses, errorV1: `${errorV1}`, errorV2: `${errorV2}` })
      console.error(`Error trying to get vesting data`, { proposalId, vestingAddresses, errorV1: `${errorV1}`, errorV2: `${errorV2}` })
    }
  }
}


function transferMatchesBeneficiary(decodedLogEvent: Decoded, beneficiary: string) {
  return (
    decodedLogEvent &&
    decodedLogEvent.name === DecodedName.Transfer &&
    decodedLogEvent.params.some((param) => {
      return param.name === ParamName.To && isSameAddress(String(param.value), beneficiary)
    })
  )
}

async function getTransactionItems(enactingTx: string) {
  const items = await fetchCovalentURL<TransactionItem>(
    `${baseCovalentUrl(Networks.getEth())}/transaction_v2/${enactingTx}/?key=${COVALENT_API_KEY}`,
    0
  )
  return items[0]
}

async function getEnactingTxData(
  proposalId: string,
  enactingTx: string,
  beneficiary: string
): Promise<OneTimePaymentInfo> {
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
  return updates.filter((update) => update.status === status).length
}

async function getProjectUpdates(proposal: Project): Promise<Updates | {}> {
  try {
    const projectUpdateResponse: ProjectUpdateResponse = await fetchURL(
      `${governanceUrl()}/updates?project_id=${proposal.project_id}`
    )
    if (!projectUpdateResponse.ok) {
      console.log(`Error trying to get updates for proposal ${proposal.id} - Message: ${projectUpdateResponse.error}`)
      return {}
    }
    return parseUpdatesInfo(projectUpdateResponse.data)
  } catch (error) {
    console.log(`Error trying to get updates for proposal ${proposal.id} - Error: ${JSON.stringify(error)}`)
    return {}
  }
}

function parseUpdatesInfo(updatesResponseData: ProjectUpdateResponse['data']): Updates {
  const lastUpdate = updatesResponseData.publicUpdates
    .filter((update) => update.status === UpdateStatus.Done || update.status === UpdateStatus.Late)
    .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())[0]
  return {
    done_updates: getUpdatesAmountByStatus(updatesResponseData.publicUpdates, UpdateStatus.Done),
    late_updates: getUpdatesAmountByStatus(updatesResponseData.publicUpdates, UpdateStatus.Late),
    missed_updates: getUpdatesAmountByStatus(updatesResponseData.publicUpdates, UpdateStatus.Pending),
    update_status: updatesResponseData.currentUpdate?.status || lastUpdate?.status,
    health: lastUpdate?.health,
    last_update: lastUpdate?.completion_date,
    next_update: updatesResponseData.nextUpdate?.due_date,
    pending_updates: updatesResponseData.pendingUpdates.length,
  }
}

async function setEnactingData(proposal: Project): Promise<Project> {
  if (proposal.vesting_addresses.length === 0 && proposal.enacting_tx === null) {
    console.log(`A proposal without vesting address and enacting tx has been found. Id: ${proposal.id}`)
  }

  const dataPromises = []
  dataPromises.push(
    proposal.vesting_addresses.length > 0
      ? getVestingContractData(proposal.id, proposal.vesting_addresses)
      : Promise.resolve(null)
  )
  dataPromises.push(
    proposal.enacting_tx
      ? getEnactingTxData(proposal.id, proposal.enacting_tx.toLowerCase(), proposal.beneficiary)
      : Promise.resolve({})
  )
  dataPromises.push(getProjectUpdates(proposal))
  const [vestingData, enactingTxData, updateInfo] = await Promise.all(dataPromises)

  let updatedProposal = { ...proposal, ...enactingTxData, ...updateInfo }
  if (vestingData) {
    updatedProposal = { ...updatedProposal, vesting: vestingData }
  }

  return updatedProposal
}

async function main() {
  // Get Governance dApp Proposals
  const proposals = (PROPOSALS as ProposalParsed[]).filter((p) => p.type === GovernanceProposalType.GRANT || p.type === GovernanceProposalType.BID)
  const { data: proposalProjects } = (await fetchURL(`${governanceUrl()}/projects`)) as { data: ProposalProject[] }

  const projects = proposalProjects.map((proposalProject) => {
    const proposal = proposals.find((p) => p.id === proposalProject.id)

    const project: Project = {
      ...proposal,
      project_id: proposalProject.project_id,
      size: proposalProject.size,
      beneficiary: proposal.configuration.beneficiary,
      category: proposal.configuration.category,
      tier: proposal.configuration.tier?.split(':')[0],
    }
    if (proposal.status === Status.ENACTED) {
      return setEnactingData(project)
    } else {
      return Promise.resolve(project)
    }
  })

  const projectsWithVestingData: Project[] = await Promise.all(projects)

  console.log(projectsWithVestingData.length, 'projects found.')

  saveToJSON('projects.json', projectsWithVestingData)
  await saveToCSV('projects.csv', projectsWithVestingData, [
    { id: 'id', title: 'Proposal ID' },
    { id: 'project_id', title: 'Project ID' },
    { id: 'snapshot_id', title: 'Snapshot ID' },
    { id: 'user', title: 'Author' },

    { id: 'title', title: 'Title' },
    { id: 'type', title: 'Type' },
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
    { id: 'pending_updates', title: 'Pending Updates' },
  ])

  const vestings = flattenArray(
    projectsWithVestingData.map(({ vesting, id }) => vesting?.map((vestingData) => ({ proposal_id: id, ...vestingData })))
  ).filter((v) => v)
  saveToJSON('vestings.json', vestings)
  await saveToCSV('vestings.csv', vestings, [
    { id: 'proposal_id', title: 'Proposal ID' },
    { id: 'vesting_status', title: 'Vesting Status' },
    { id: 'vesting_address', title: 'Vesting Contract' },
    { id: 'vesting_released', title: 'Vesting Released Amount' },
    { id: 'vesting_releasable', title: 'Vesting Releasable Amount' },
    { id: 'vesting_contract_token_balance', title: 'Vesting Token Contract Balance' },
    { id: 'vesting_total_amount', title: 'Vesting Total Amount' },
    { id: 'vesting_start_at', title: 'Vesting Start At' },
    { id: 'vesting_finish_at', title: 'Vesting Finish At' },
    { id: 'duration_in_months', title: 'Duration (Months)' },
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
