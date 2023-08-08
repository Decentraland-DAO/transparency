import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { parseKPIs, reportToRollbarAndThrow } from './utils'

require('dotenv').config()

async function main() {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID)
    await doc.useServiceAccountAuth({
      client_email: process.env.SHEET_CLIENT_EMAIL,
      private_key: process.env.SHEET_PRIVATE_KEY
    })

    const title = process.argv[2]
    const path = process.argv[3]
    const append = process.argv[4] == '--append'

    await doc.loadInfo()
    let sheet = doc.sheetsByTitle[title]
    if(!sheet) {
      sheet = await doc.addSheet({ title })
    }
    const rows = title === 'KPIs' ? parseKPIs(require('../public/kpis.json')) : parse(readFileSync(path))

    if (!append) {
      await sheet.clear()
      sheet.gridProperties['rowCount'] = rows.length
      sheet.gridProperties['columnCount'] = rows[0].length
      await sheet.updateGridProperties(sheet.gridProperties)
      await sheet.setHeaderRow(rows[0])
    }

    const batchSize = 20000
    let uploadRows = rows.slice(1)
    while (uploadRows.length > 0) {
      const batch = uploadRows.slice(0, batchSize)
      uploadRows = uploadRows.slice(batchSize)
      await sheet.addRows(batch)
    }

    console.log(`✅ The ${title} sheet has been updated with ${rows.length - 1} elements`)
  } catch (error) {
    console.error(error)
    process.exit(-1)
  }
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))