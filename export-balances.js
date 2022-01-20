const fs = require('fs');
const BigNumber = require('bignumber.js');
const web3 = require('@alch/alchemy-web3');
const CSVWritter = require('csv-writer');

const wallets = [
    ["Ethereum", "0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce", "Aragon Agent"],
    ["Ethereum", "0x89214c8Ca9A49E60a3bfa8e00544F384C93719b1", "DAO Committee"],
    ["Polygon", "0xB08E3e7cc815213304d884C88cA476ebC50EaAB2", "DAO Committee"],
];

const tokens = {
    "0x0f5d2fb29fb7d3cfee444a200298f468908cc942": ["Ethereum", "MANA", 18],
    "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": ["Ethereum", "MATIC", 18],
    "0x6b175474e89094c44da98b954eedeac495271d0f": ["Ethereum", "DAI", 18],
    "0xdac17f958d2ee523a2206206994597c13d831ec7": ["Ethereum", "USDT", 6],
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": ["Ethereum", "USDC", 6],
    "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4": ["Polygon", "MANA", 18],
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": ["Polygon", "DAI", 18],
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": ["Polygon", "USDT", 6],
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": ["Polygon", "USDC", 6],
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": ["Polygon", "WETH", 18],
};

const ethTokens = Object.keys(tokens).filter(a => tokens[a][0] == 'Ethereum');
const maticTokens = Object.keys(tokens).filter(a => tokens[a][0] == 'Polygon');

const eth = web3.createAlchemyWeb3('https://eth-mainnet.alchemyapi.io/v2/HcW-dJIcedLgGAB8htL7M1L8ir2Sihfe');
const matic = web3.createAlchemyWeb3('https://polygon-mainnet.g.alchemy.com/v2/HcW-dJIcedLgGAB8htL7M1L8ir2Sihfe');

async function main() {
    const balances = [];
    const timestamp = (new Date()).toISOString();

    for(var i = 0 ; i < wallets.length ; i++) {
        let wallet = wallets[i];
        let client = wallet[0] == "Ethereum" ? eth : matic;
        let contracts = wallet[0] == "Ethereum" ? ethTokens : maticTokens;

        let balance = await client.alchemy.getTokenBalances(wallet[1], contracts);
        balance.tokenBalances.forEach(balance => {
            balance.timestamp = timestamp,
            balance.network = wallet[0];
            balance.address = wallet[1];
            balance.name = wallet[2];
            balance.symbol = tokens[balance.contractAddress][1];
            let decimals = tokens[balance.contractAddress][2];
            balance.amount = BigNumber(balance.tokenBalance).dividedBy(10 ** decimals).toNumber() || 0;
        })
        balances.push(...balance.tokenBalances);

        let native = await client.eth.getBalance(wallet[1], 'latest');
        balances.push({
            'timestamp': timestamp,
            'network': wallet[0],
            'address': wallet[1],
            'name': wallet[2],
            'symbol': wallet[0] == "Ethereum" ? 'ETH' : 'MATIC',
            'contractAddress': 'native',
            'amount': parseInt(native.substring(0, native.length - 18)) || 0,
        });
    }

    console.log(balances.length, 'balances found.');

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'public/balances.csv',
        header: [
          {id: 'timestamp', title: 'Timestamp'},
          {id: 'name', title: 'Wallet'},
          {id: 'amount', title: 'Balance'},
          {id: 'symbol', title: 'Symbol'},
          {id: 'network', title: 'Network'},
          {id: 'address', title: 'Address'},
          {id: 'contractAddress', title: 'Token'},
        ]
      });

    csvWriter.writeRecords(balances).then(()=> console.log('The CSV file has been saved.'));

    fs.writeFile("public/balances.json", JSON.stringify(balances), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("The JSON file has been saved.");
    });
}

main();