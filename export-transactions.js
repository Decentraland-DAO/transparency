require('dotenv').config();

const fs = require('fs');
const BigNumber = require('bignumber.js');
const fetch = require('isomorphic-fetch');
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
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": ["Ethereum", "WETH", 18],
    "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4": ["Polygon", "MANA", 18],
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": ["Polygon", "DAI", 18],
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": ["Polygon", "USDT", 6],
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": ["Polygon", "USDC", 6],
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": ["Polygon", "WETH", 18],
};

const ethTokens = Object.keys(tokens).filter(a => tokens[a][0] == 'Ethereum');
const maticTokens = Object.keys(tokens).filter(a => tokens[a][0] == 'Polygon');

const API_KEY = process.env.COVALENTHQ_API_KEY;

async function main() {
    const transactions = [];

    for(var i = 0; i < wallets.length; i++) {
        const network = wallets[i][0] == "Ethereum" ? 1 : 137;
        const address = wallets[i][1];
        const name = wallets[i][2];
        const tokenAddresses = network == 1 ? ethTokens : maticTokens;

        for(var t = 0; t < tokenAddresses.length; t++) {
            var token = tokens[tokenAddresses[t]];
            console.log(`- Getting ${token[1]} transactions on ${name} (${token[0]})`);
            const url = `https://api.covalenthq.com/v1/${network}/address/${address}/transfers_v2/?key=${API_KEY}&contract-address=${tokenAddresses[t]}&page-size=500000`;
            const res = await fetch(url);
            const json = await res.json();
            const txs = json.data.items.map(t => ({
                'date': t.block_signed_at,
                'wallet': name,
                'network': token[0],
                'type': t.transfers[0].transfer_type,
                'amount': BigNumber(t.transfers[0].delta).dividedBy(10 ** t.transfers[0].contract_decimals).toNumber(),
                'symbol': t.transfers[0].contract_ticker_symbol,
                'quote': t.transfers[0].delta_quote,
                'hash': t.tx_hash,
                'from': t.from_address,
                'to': t.to_address,
                'successful': t.successful,
            }));
            transactions.push(...txs);
        }
    }

    transactions.sort((a, b) => a.block_signed_at < b.block_signed_at);
    console.log(transactions.length, 'transactions found.');

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'public/transactions.csv',
        header: [
          {id: 'date', title: 'Date'},
          {id: 'wallet', title: 'Wallet'},
          {id: 'network', title: 'Network'},
          {id: 'type', title: 'Type'},
          {id: 'amount', title: 'Amount'},
          {id: 'symbol', title: 'Token'},
          {id: 'quote', title: 'USD Amount'},
          {id: 'hash', title: 'Hash'},
          {id: 'from', title: 'From'},
          {id: 'to', title: 'To'},
          {id: 'successful', title: 'Successful'},
        ]
      });

    csvWriter.writeRecords(transactions).then(()=> console.log('The CSV file has been saved.'));

    fs.writeFile("public/transactions.json", JSON.stringify(transactions), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("The JSON file has been saved.");
    });
}

main();