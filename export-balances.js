const web3 = require('@alch/alchemy-web3');
const CSVWritter = require('csv-writer');

ethWallets = [
    ["0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce", "Aragon Agent"],
    ["0x89214c8Ca9A49E60a3bfa8e00544F384C93719b1", "DAO Committee"],
];

maticWallets = [
    ["0xB08E3e7cc815213304d884C88cA476ebC50EaAB2", "DAO Committee"],
];

ethTokens = {
    "0x0f5d2fb29fb7d3cfee444a200298f468908cc942": ["MANA", 18],
    "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": ["MATIC", 18],
    "0x6b175474e89094c44da98b954eedeac495271d0f": ["DAI", 18],
    "0xdac17f958d2ee523a2206206994597c13d831ec7": ["USDT", 6],
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": ["USDC", 6],
};

maticTokens = {
    "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4": ["MANA", 18],
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": ["DAI", 18],
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": ["USDT", 6],
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": ["USDC", 6],
};

const eth = web3.createAlchemyWeb3('https://eth-mainnet.alchemyapi.io/v2/HcW-dJIcedLgGAB8htL7M1L8ir2Sihfe');
const matic = web3.createAlchemyWeb3('https://polygon-mainnet.g.alchemy.com/v2/HcW-dJIcedLgGAB8htL7M1L8ir2Sihfe');

async function main() {
    const balances = [];

    let ethBalance = await eth.alchemy.getTokenBalances(ethWallets[0][0], Object.keys(ethTokens));
    ethBalance.tokenBalances.forEach(balance => {
        balance.address = ethWallets[0][0];
        balance.name = ethWallets[0][1];
        balance.symbol = ethTokens[balance.contractAddress][0];
        balance.network = 'Ethereum';
        let decimals = ethTokens[balance.contractAddress][1];
        balance.amount = parseInt(balance.tokenBalance.substring(0, balance.tokenBalance.length - decimals)) || 0;
    })
    balances.push(...ethBalance.tokenBalances);

    const nativeEth = await eth.eth.getBalance(ethWallets[0][0], 'latest');
    balances.push({
        address: ethWallets[0][0],
        name: ethWallets[0][1],
        symbol: 'ETH',
        network: 'Ethereum',
        contractAddress: 'native',
        amount: parseInt(nativeEth.substring(0, nativeEth.length - 18)) || 0,
    });

    
    maticBalances = await matic.alchemy.getTokenBalances(maticWallets[0][0], Object.keys(maticTokens));
    maticBalances.tokenBalances.forEach(balance => {
        balance.address = maticWallets[0][0];
        balance.name = maticWallets[0][1];
        balance.symbol = maticTokens[balance.contractAddress][0];
        balance.network = 'Polygon';
        let decimals = maticTokens[balance.contractAddress][1];
        balance.amount = parseInt(balance.tokenBalance.substring(0, balance.tokenBalance.length - decimals)) || 0;
    })
    balances.push(...maticBalances.tokenBalances);

    const nativeMatic = await matic.eth.getBalance(maticWallets[0][0], 'latest');
    balances.push({
        address: maticWallets[0][0],
        name: maticWallets[0][1],
        symbol: 'MATIC',
        network: 'Polygon',
        contractAddress: 'native',
        amount: parseInt(nativeMatic.substring(0, nativeMatic.length - 18)) || 0,
    });

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'balances.csv',
        header: [
          {id: 'name', title: 'Wallet'},
          {id: 'amount', title: 'Balance'},
          {id: 'symbol', title: 'Symbol'},
          {id: 'network', title: 'Network'},
          {id: 'address', title: 'Address'},
          {id: 'contractAddress', title: 'Token'},
        ]
      });

    csvWriter.writeRecords(balances).then(()=> console.log('The CSV file has been saved.'));
}

main();