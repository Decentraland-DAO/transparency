require('dotenv').config();

const BigNumber = require('bignumber.js');
const Utils = require('./utils.js');
const grants = require('./public/grants.json');

const wallets = [
    ["Ethereum", "0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce", "Aragon Agent"],
    ["Ethereum", "0x89214c8ca9a49e60a3bfa8e00544f384c93719b1", "DAO Committee"],
    ["Polygon", "0xb08e3e7cc815213304d884c88ca476ebc50eaab2", "DAO Committee"],
];

const walletAddresses = wallets.map(w => w[1]);

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

const GRANT_ADDRESSES = grants.filter(g => g.status == 'enacted' || g.status == 'passed').map(g => (g.vesting_address || g.grant_beneficiary).toLowerCase());
const CURATOR_ADDRESSES = [
    '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
    '0x716954738e57686a08902d9dd586e813490fee23',
    '0xc958f028d1b871ab2e32c2abda54f37191efe0c2',
    '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
    '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
    '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
    '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
    '0x6cdfdb9a4d99f16b5607cab1d00c792206db554e'
];

const FACILITATOR_ADDRESS = "0x76fb13f00cdbdd5eac8e2664cf14be791af87cb0";

async function getTopicTxs(network, startblock, topic) {
    const events = [];
    let block = startblock;
    let url = `https://api.covalenthq.com/v1/${network}/block_v2/latest/?key=${API_KEY}`;
    let json = await Utils.fetchURL(url);
    let latestBlock = json.data.items[0].height;
    console.log('Latest', network, block, latestBlock, (latestBlock - block) / 1000000);

    while(block < latestBlock) {
        url = `https://api.covalenthq.com/v1/${network}/events/topics/${topic}/?key=${API_KEY}&starting-block=${block}&ending-block=${block+1000000}&page-size=1000000000`;
        console.log('fetch', url);
        json = await Utils.fetchURL(url);
        let evs = json.data.items.map(e => e.tx_hash);
        events.push(...evs);
        block += 1000000;
    }

    return events;
}

async function main() {
    let transactions = [];

    for(var i = 0; i < wallets.length; i++) {
        const network = wallets[i][0] == "Ethereum" ? 1 : 137;
        const address = wallets[i][1];
        const name = wallets[i][2];
        const tokenAddresses = network == 1 ? ethTokens : maticTokens;

        for(var t = 0; t < tokenAddresses.length; t++) {
            var token = tokens[tokenAddresses[t]];
            const url = `https://api.covalenthq.com/v1/${network}/address/${address}/transfers_v2/?key=${API_KEY}&contract-address=${tokenAddresses[t]}&page-size=500000`;
            const json = await Utils.fetchURL(url);
            const txs = json.data.items.filter(t => t.successful);

            for(var j = 0; j < txs.length ; j++) {
                const transfers = txs[j].transfers.map(trans => {
                    var type = (
                        walletAddresses.indexOf(trans.from_address) != -1 &&
                        walletAddresses.indexOf(trans.to_address) != -1
                    ) ? 'INTERNAL' : trans.transfer_type;
                    return {
                    'wallet': name,
                    'hash': txs[j].tx_hash,
                    'date': txs[j].block_signed_at,
                    'block': txs[j].block_height,
                    'network': token[0],
                    'type': type,
                    'amount': BigNumber(trans.delta).dividedBy(10 ** trans.contract_decimals).toNumber(),
                    'symbol': trans.contract_ticker_symbol,
                    'contract': trans.contract_address,
                    'quote': trans.delta_quote,
                    'sender': trans.from_address,
                    'from': trans.from_address,
                    'to': trans.to_address,
                }});
                transactions.push(...transfers);
            }
        }
    }

    transactions = transactions.sort((a, b) => a.date > b.date ? -1 : a.date == a.b ? 0 : 1);
    console.log(transactions.length, 'transactions found.');

    Utils.saveToJSON('transactions.json', transactions);
    Utils.saveToCSV('transactions.csv', transactions, [
        {id: 'date', title: 'Date'},
        {id: 'wallet', title: 'Wallet'},
        {id: 'network', title: 'Network'},
        {id: 'type', title: 'Type'},
        {id: 'amount', title: 'Amount'},
        {id: 'symbol', title: 'Token'},
        {id: 'quote', title: 'USD Amount'},
        {id: 'sender', title: 'Sender'},
        {id: 'from', title: 'Transfer From'},
        {id: 'to', title: 'Transfer To'},
        {id: 'block', title: 'Block'},
        {id: 'hash', title: 'Hash'},
        {id: 'contract', title: 'Contract'},
    ]);

    await tagging(transactions);
}

async function tagging(txs) {
    ETH_ORDER_TOPIC = '0x695ec315e8a642a74d450a4505eeea53df699b47a7378c7d752e97d5b16eb9bb';
    MATIC_ORDER_TOPIC = '0x77cc75f8061aa168906862622e88c5b05a026a9c06c02d91ec98543e01e7ad33';
    MATIC_ORDER_TOPIC2 = '0x6869791f0a34781b29882982cc39e882768cf2c96995c2a110c577c53bc932d5';
    ONEINCH_ADDRESSES = ['0x1111111254fb6c44bac0bed2854e76f90643097d', '0x11111112542d85b3ef69ae05771c2dccff4faa26'];

    const ethTxs = txs.filter(t => t.network == "Ethereum");
    const ethStartblock = ethTxs[ethTxs.length-1].block;
    marketOrdersTxs = await getTopicTxs(1, ethStartblock, ETH_ORDER_TOPIC);
    console.log('Ethereum Orders:', marketOrdersTxs.length);

    const maticTxs = txs.filter(t => t.network == "Polygon");
    const maticStartblock = maticTxs[maticTxs.length-1].block;
    maticOrdersTxs = await getTopicTxs(137, maticStartblock, MATIC_ORDER_TOPIC);
    console.log('Matic Orders:', maticOrdersTxs.length);

    // maticOrdersTxs2 = await getTopicTxs(137, maticStartblock, MATIC_ORDER_TOPIC2);
    // console.log('Matic Orders 2:', maticOrdersTxs2.length);
    // return;

    let other = 0;
    for(var i = 0; i < txs.length; i++) {
        let tx = txs[i];
        tx.tag = '-';

        if(marketOrdersTxs.indexOf(tx.hash) != -1) {
            tx.tag = 'ETH Marketplace';
            continue;
        }

        if(maticOrdersTxs.indexOf(tx.hash) != -1) {
            tx.tag = 'MATIC Marketplace';
            continue;
        }

        // if(maticOrdersTxs2.indexOf(tx.hash) != -1) {
        //     tx.tag = 'MATIC Marketplace 2';
        //     continue;
        // }

        if(tx.type == 'OUT' && GRANT_ADDRESSES.indexOf(tx.to) != -1) {
            tx.tag = 'Grant';
            continue
        }

        if(tx.type == 'OUT' && CURATOR_ADDRESSES.indexOf(tx.to) != -1) {
            tx.tag = 'Curator';
            continue
        }

        if(tx.type == 'OUT' && tx.to == FACILITATOR_ADDRESS) {
            tx.tag = 'Facilitator';
            continue
        }

        if(tx.type == 'IN' && tx.from == '0x7a3abf8897f31b56f09c6f69d074a393a905c1ac') {
            tx.tag = 'Vesting Contract';
            continue
        }

        if(tx.type == 'IN' && tx.from == '0x2da950f79d8bd7e7f815e1bbc43ecee2c7e7f5d3') {
            tx.tag = 'EOA 0x2da95';
            continue
        }

        if(tx.type == 'IN' && tx.from == '0x9b814233894cd227f561b78cc65891aa55c62ad2') {
            tx.tag = 'OpenSea';
            continue
        }

        if(tx.type == 'IN' && tx.from == '0x6d51fdc0c57cbbff6dac4a565b35a17b88c6ceb5') {
            tx.tag = 'Swap';
            continue
        }

        if(tx.type == 'IN' && tx.from == '0x56eddb7aa87536c09ccc2793473599fd21a8b17f') {
            tx.tag = 'Swap';
            continue
        }
        
        if (tx.network == "Ethereum") {
            tx.tag = 'OTHER';

            const network = tx.network == "Ethereum" ? 1 : 137;
            const url = `https://api.covalenthq.com/v1/${network}/transaction_v2/${tx.hash}/?key=${API_KEY}`;
            const json = await Utils.fetchURL(url);
            console.log('checking', i, other, parseInt(i / txs.length * 100));
            const isLooksRare = !!json.data && json.data.items[0].log_events.filter(log => log.sender_address == '0x59728544b08ab483533076417fbbb2fd0b17ce3a').length > 0;
            const isERC721Bid = !!json.data && json.data.items[0].log_events.filter(log => log.sender_address == '0xe479dfd9664c693b2e2992300930b00bfde08233').length > 0;
            const isSushiswap = !!json.data && json.data.items[0].log_events.filter(log => log.sender_address == '0x1bec4db6c3bc499f3dbf289f5499c30d541fec97').length > 0;
            const is1nch = !!json.data && json.data.items[0].log_events.filter(log => ONEINCH_ADDRESSES.indexOf(log.sender_address) != -1).length > 0;
            if(isLooksRare) tx.tag = 'LooksRare';
            if(isERC721Bid) tx.tag = 'ETH Marketplace';
            if(isSushiswap) tx.tag = 'Swap';
            if(is1nch) tx.tag = 'Swap';
            other++;
        }
    }

    Utils.saveToJSON('transactions.json', txs);
    Utils.saveToCSV('transactions.csv', txs, [
        {id: 'date', title: 'Date'},
        {id: 'wallet', title: 'Wallet'},
        {id: 'network', title: 'Network'},
        {id: 'type', title: 'Type'},
        {id: 'tag', title: 'Tag'},
        {id: 'amount', title: 'Amount'},
        {id: 'symbol', title: 'Token'},
        {id: 'quote', title: 'USD Amount'},
        {id: 'sender', title: 'Sender'},
        {id: 'from', title: 'Transfer From'},
        {id: 'to', title: 'Transfer To'},
        {id: 'block', title: 'Block'},
        {id: 'hash', title: 'Hash'},
        {id: 'contract', title: 'Contract'},
    ]);
}

main();

// let txs = require('./public/transactions.json');
// tagging(txs);