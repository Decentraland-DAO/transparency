require('dotenv').config();

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { GoogleSpreadsheet } = require('google-spreadsheet');

async function main() {
    console.log('Client id', process.env.SHEET_ID.length);
    console.log('Client email', process.env.SHEET_CLIENT_EMAIL.length);
    console.log('Client secret', process.env.SHEET_PRIVATE_KEY.slice(0,500));

    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.SHEET_CLIENT_EMAIL,
      private_key: process.env.SHEET_PRIVATE_KEY,
    });

    
    const title = process.argv[2];
    const path = process.argv[3];

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[title];
    await sheet.clear();
    
    const proposals = parse(fs.readFileSync(path));
    await sheet.setHeaderRow(proposals[0]);

    const batchSize = 20000;
    let uploadProposals = proposals.slice(1);
    while(uploadProposals.length > 0) {
      const batch = uploadProposals.slice(0, batchSize);
      uploadProposals = uploadProposals.slice(batchSize);
      await sheet.addRows(batch);
    }
    sheet.gridProperties['rowCount'] = proposals.length;
    sheet.gridProperties['columnCount'] = proposals[0].length;
    await sheet.updateGridProperties(sheet.gridProperties);

    console.log(`✅ The ${title} sheet has been updated with ${proposals.length-1} elemets`);
}

main();


