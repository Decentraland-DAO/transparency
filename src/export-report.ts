import { renderFile } from 'ejs'
import { GovernanceProposal, GovernanceProposalType, Status } from './interfaces/GovernanceProposal'
import { fetchURL, governanceUrl, reportToRollbarAndThrow, saveToFile } from './utils'

type Votes = {
  choice: number
  vp: number
  timestamp: number
}

type EndedProposal = GovernanceProposal & {
  name?: string
  totalVP?: number
  choices?: (string | number)[][]
}

function lastReport(now: Date) {
  let lastReport = (new Date(now))
  lastReport.setUTCDate(now.getUTCDate() < 16 ? 1 : 16)
  return lastReport
}

function nextReport(now: Date) {
  return lastReport(new Date(now.getTime() + 3600 * 1000 * 24 * 17))
}

function yesterday(now: Date) {
  return new Date(now.getTime() - (1000 * 3600 * 24))
}

async function getPoisNames(pois: EndedProposal[]) {
  for (const poi of pois) {
    const x = poi.configuration.x
    const y = poi.configuration.y
    const json = await fetchURL(`https://api.decentraland.org/v2/tiles?x1=${x}&y1=${y}&x2=${x}&y2=${y}`)
    poi.name = json.data[`${x},${y}`].name || 'No Name'
  }
}

async function main() {
  const now = new Date(new Date().toISOString().slice(0, 10))
  let currentReport = 14 + (now.getUTCFullYear() - 2022) * 24 + (now.getUTCMonth() * 2)
  currentReport += now.getUTCDate() < 16 ? 0 : 1

  let endDate = lastReport(now)
  let startDate = lastReport(yesterday(endDate))

  await generateReport(currentReport, startDate, endDate)

  startDate = nextReport(startDate)
  endDate = nextReport(endDate)

  await generateReport(currentReport + 1, startDate, endDate)
}

async function generateReport(currentReport: number, startDate: Date, endDate: Date) {
  const startDateStr = startDate.toLocaleDateString('en', { month: 'long', day: 'numeric', timeZone: 'GMT' })
  const endDateStr = yesterday(endDate).toLocaleDateString('en', { month: 'long', day: 'numeric', timeZone: 'GMT' })

  console.log(`Generating Report #${currentReport}...`)
  console.log(`Proposals from ${startDateStr} to ${endDateStr}`)

  // Get Governance dApp Proposals
  const proposals: GovernanceProposal[] = []
  while (true) {
    const skip = proposals.length
    const url = `${governanceUrl()}/proposals?limit=100000&offset=${skip}`
    const json = await fetchURL(url)

    if (!json.data.length) break
    proposals.push(...json.data)
  }

  // Active Proposals
  const activeProposals = proposals.filter(p => p.status === Status.ACTIVE)
  const activePois = activeProposals.filter(p => p.type === GovernanceProposalType.POI)
  const activeGrants = activeProposals.filter(p => p.type === GovernanceProposalType.GRANT)
  const activeBans = activeProposals.filter(p => p.type === GovernanceProposalType.BAN_NAME)
  const activeCatalysts = activeProposals.filter(p => p.type === GovernanceProposalType.CATALYST)
  const activePolls = activeProposals.filter(p => p.type === GovernanceProposalType.POLL)

  let endedProposals: EndedProposal[] = proposals.filter(p => (
    startDate < new Date(p.finish_at) &&
    new Date(p.finish_at) < endDate &&
    [Status.FINISHED, Status.PASSED, Status.ENACTED].indexOf(p.status) != -1
  ))

  for (const prop of endedProposals) {
    const data = await fetchURL(`${governanceUrl()}/proposals/${prop.id}/votes`)

    const votes: Votes[] = Object.values(data.data)
    prop.totalVP = votes.reduce((total, vote) => total + vote.vp, 0)
    prop.choices = prop.configuration.choices.map((name, index) => {
      const choiceVP = votes.filter(v => v.choice === index + 1).reduce((total, vote) => total + vote.vp, 0)
      const choiceVotes = votes.filter(v => v.choice === index + 1).length
      const choiceWeight = choiceVP / prop.totalVP * 100
      const choiceName = name[0].toUpperCase() + name.slice(1)
      return [choiceName, choiceWeight, choiceVP.toLocaleString('en-us'), choiceVotes]
    })
  }

  endedProposals = endedProposals.filter(p => p.totalVP >= 500000)
  const newPois = endedProposals.filter(p => p.type === GovernanceProposalType.POI)
  const newGrants = endedProposals.filter(p => p.type === GovernanceProposalType.GRANT)
  const newBans = endedProposals.filter(p => p.type === GovernanceProposalType.BAN_NAME)
  const newCatalysts = endedProposals.filter(p => p.type === GovernanceProposalType.CATALYST)
  const newPolls = endedProposals.filter(p => p.type === GovernanceProposalType.POLL)

  await getPoisNames(newPois)
  await getPoisNames(activePois)

  const report = await renderFile('report.md', {
    'number': currentReport,
    'startDateStr': startDateStr,
    'endDateStr': endDateStr,
    'newPois': newPois,
    'newGrants': newGrants,
    'newBans': newBans,
    'newPolls': newPolls,
    'newCatalysts': newCatalysts,
    'activePolls': activePolls,
    'activePois': activePois,
    'activeGrants': activeGrants,
    'activeBans': activeBans,
    'activeCatalysts': activeCatalysts
  }, {})

  saveToFile(`report-${currentReport}.md`, report)
  console.log('✅ The markdown file has been saved.')
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))