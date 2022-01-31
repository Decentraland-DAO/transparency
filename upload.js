const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { GoogleSpreadsheet } = require('google-spreadsheet');

async function main() {
    const doc = new GoogleSpreadsheet('1FoV7TdMTVnqVOZoV4bvVdHWkeu4sMH5JEhp8L0Shjlo');
    await doc.useServiceAccountAuth({
      client_email: 'dao-transparency@poetic-palace-338620.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTCyq0ncf4S0v0\nDb49nopsNTfjlBu0kxIO1f+pk6OBZeqw3klgJnbrioek7sH0QKJpTi8vdMLClbLc\nwR/ZRkCJEEsVJwWsuEHGj7ybt0uiSBvCNuHq5vHnicd3ILH4e9wiK4gWAAla51aS\nRc1b4tiMP8v84o8MU9W+Pf+o5Y2WJPP442PvGKUhWlhidblE4zNXv7ZvFwuzUqtN\nHunJOPLjjbv29XvjY/UHIUYAWjToVrXG/RU4Ee9lzPS5RokEHov6+j473Up1LADP\nsa+cxtOQIvpsp9ttgcLc4MAUi9f22tQ5o5lhUrkNw/Zh+qqzscWXJ8vsk6ntwyen\nQrN9RuFrAgMBAAECggEAFg9kQuX9SaiBQ30ORj2kxYPYmDranIkFCbT32P98R2Hi\nYuORcvICW0OrQyPL9V6uO2i3SPQhCZsBS88KJ7mOtGUWHBtsne3SvlE3C2XhC5ET\nCb2X5uiGH8hIp9ysjcdQruey/W26jJyC8Z5HRZQUQ7DFf2UlQ8odnRm4+CwqnSeG\nGx+N5niPKiwbZROXOS6vM1TectSY5Tgsc+u24VMPE+Pex25OBcsaK/+pUlG3jrGB\nsN2Qu/TC2lz+WE5pwlU0znmjbDh5d3UC2s68EFYmn/y9WggWpfR3GcnGx9cGiZsZ\nmlcK2hMArVXisGzhsW/EyoImbxCbescCkRzSE/BJLQKBgQDpF2TUbVRf2vxI99a6\n34+OgV6rfZch4Ra6AtagDJqBgjuSENB8PzvKFexE7m0dUTiIBLkCmqEhubGb/BiY\nUTIqUEbOKeGZUW5yAiBXqKRZmgF0pzTOOrXdSn7FL/EyS72b6vFOhe6cd1Dfshwp\nJZTQmjDMfAUOW0xk/oAIcRI8DwKBgQDnyQx4cu63orwZIC52fcUVYAu8f0vxTU7h\n6LkTpJezi3nJqUQ0MqRsORf0weqhYAhliaQ4ho1OCDDrdZHdKgV4TlNTv9lJSs+m\n1qBjvbdzlbQ0OIf4xjvVytpJ6BFpf6Ep+nqROC9ftZ0I9fP9N7wfv0nitpE9l5Cz\nXtkCDY5Y5QKBgF6slNS/b2TbslsE51/RzCJKo6QuB8PIBA4bdwdc9yihOAb082lz\n2ZoUW3oICaO9yKNen7LSEZ58KQq9U1QSrriHEKtOUYaPj7eY64APTGnkZrD19TnK\nmPG//0uiVGpkXyhEPizxs2A0ClJBqrR/wjkUV7vGp9sT9CyVPnWvT4O7AoGBAMbA\nol3iiAqVk9+jtdPLUyVaH5Y6Pd+joAGdcp6CY8cE0aD38VElH9LhPkaVxeEtHOYc\nmeISlraT1YcCYNqZ/ujDmTZWazcq3Fa+8fe1JcsKUuT4mLfdHE/eS0JWqh+h3ovF\nijZeTFkwvYCCjv7SPRGoEO5ECNUc02rL6R+Wijp1AoGAAmBEDBzWc8T1lBqCVp7m\n5xYIKuLmeb5vv7sRj8J6MnH2JKq8VtmpJulWCs97weyFqSMoAz4MBFDQsbayDWKI\nxKgnaWJZXjQFL9VWK9cSX0HA41Z3ahzHxeTjcQkU5JL8is8gTIr9B6gAYhjnlnBw\nIyVdCVydgRmz/vMEiGOq2kM=\n-----END PRIVATE KEY-----\n"',
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


