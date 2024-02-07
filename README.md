<div align="center">
    <img src="icon.svg" height="100" alt="Logo"><br/>
    <strong>A set of tools to collect and process Decentraland's data into actionable insights.</strong>
</div>

### How it works:
* All data is collected from public sources (e.g. blockchain or indexing services).
* The scripts run on daily bases and publish the raw data in CSV and JSON formats.
* The data also funneled into Google Sheet and Google DataStudio for further analysis.

### Design Principles
* Accessible: Publish the data in many formats.
* Auditable: Open source code and public workflow logs.
* Simple: Easy to understand, easy to contribute.

### Third Party Providers
* Infura: Blockchain provider.
* Snapshot: Off-chain voting.
* Catalyst's API: POIs and members Names.
* CovalentHQ: Transfers and balances.

### Data Sources
- Proposals
- Members
- Votes
- Projects
- Balances
- Transactions
- Curations
- API

### Outputs Formats
* [Transparency Page](https://governance.decentraland.org/transparency/)
* [Google Data Studio](https://datastudio.google.com/u/3/reporting/fca13118-c18d-4e68-9582-ad46d2dd5ce9/page/p_hc6ik7jerc)
* [Google Sheets](https://docs.google.com/spreadsheets/d/1FoV7TdMTVnqVOZoV4bvVdHWkeu4sMH5JEhp8L0Shjlo/edit?usp=sharing)
* [Raw Data in CSV and JSON](https://github.com/Decentraland-DAO/transparency/tree/gh-pages)
* [Run Logs](https://github.com/Decentraland-DAO/transparency/actions)

## Contributing

Feel free to create a Github issue with your suggestions or find us at [the DAO's Discord Server](https://discord.gg/amkcFrqPBh)

The commands you need to setup and use the environment are:

```
# Install dependencies
npm install
npm link typescript

# Set up your environment variables
cp .env.example .env
pico .env

# Run script that exports files to ./public/
npx ts-node export-xxxxx.ts

# Upload CSV to spreadsheet
npx ts-node upload.ts SHEET_NAME ./public/xxxxx.csv

# Add a job the daily process that collects and publishes data
pico .github/workflows/pull-data.yml

# Run tests
npm run test
```

## Copyright & License

This repository is protected with a standard Apache 2 license. See the terms and conditions in the [LICENSE](LICENSE) file.
