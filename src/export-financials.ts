import { FinancialRecord } from './interfaces/Financial'
import { fetchURL, governanceUrl, reportToRollbarAndThrow, saveToCSV, saveToJSON } from './utils'

async function main() {
    // Get Governance dApp financial records
    const financialRecords: FinancialRecord[] = []
    let pageNumber = 0
    while (true) {
      const url = `${governanceUrl()}/updates/financials?page_size=100&page_number=${pageNumber++}`
      const json = await fetchURL(url)
  
      if (!json.data.length) break
      financialRecords.push(...json.data)
    }

    console.log(financialRecords.length, 'financial records found.')

    saveToJSON('financials.json', financialRecords)
    await saveToCSV('financials.csv', financialRecords, [
      { id: 'id', title: 'Record ID' },
      { id: 'update_id', title: 'Update ID' },
      { id: 'proposal_id', title: 'Proposal ID' },
      { id: 'proposal_type', title: 'Proposal type' },
      { id: 'proposal_category', title: 'Proposal category' },
      { id: 'category', title: 'Financial category' },
      { id: 'description', title: 'Description' },
      { id: 'amount', title: 'Amount' },
      { id: 'token', title: 'Token' },
      { id: 'receiver', title: 'Receiver' },
      { id: 'link', title: 'Link' },
    ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
