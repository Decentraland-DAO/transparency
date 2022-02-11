require('dotenv').config();

const BigNumber = require('bignumber.js');
const Utils = require('./utils.js');

const Web3 = require('web3');
const web3 = new Web3(process.env.INFURA_URL);

const VESTING_ABI = [{"constant":true,"inputs":[],"name":"duration","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cliff","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"initialized","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"beneficiary","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"vestedAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"releasableAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"revoked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"},{"name":"_beneficiary","type":"address"},{"name":"_start","type":"uint256"},{"name":"_cliff","type":"uint256"},{"name":"_duration","type":"uint256"},{"name":"_revocable","type":"bool"},{"name":"_token","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"release","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"revocable","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"released","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"},{"name":"amount","type":"uint256"}],"name":"releaseForeignToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"revoke","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"start","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"target","type":"address"}],"name":"releaseTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"target","type":"address"}],"name":"changeBeneficiary","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Released","type":"event"},{"anonymous":false,"inputs":[],"name":"Revoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}];
const DECIMALS = {
    "0x0f5d2fb29fb7d3cfee444a200298f468908cc942": ['MANA', 18],
    "0x6b175474e89094c44da98b954eedeac495271d0f": ['DAI', 18],
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": ['USDC', 6],
    "0xdac17f958d2ee523a2206206994597c13d831ec7": ['USDT', 6],
};

async function main() {
    // Get Gobernance dApp Proposals
    let proposals = require('./public/proposals.json');
    proposals = proposals.filter(p => p.type == 'grant');

    for (var i = 0; i < proposals.length ; i++) {
        let p = proposals[i];
        p.grant_category = p.configuration.category;
        p.grant_tier = p.configuration.tier.split(':')[0];
        p.grant_size = p.configuration.size;
        p.grant_beneficiary = p.configuration.beneficiary;

        if (p.vesting_address) {
            const contract = new web3.eth.Contract(VESTING_ABI, p.vesting_address);
            const token = (await contract.methods.token().call()).toLowerCase();
            const decimals = DECIMALS[token][1];
            p.token = DECIMALS[token][0];

            p.released = await contract.methods.released().call();
            p.released = BigNumber(p.released).dividedBy(10 ** decimals).toNumber();

            p.releasable = await contract.methods.releasableAmount().call();
            p.releasable = BigNumber(p.releasable).dividedBy(10 ** decimals).toNumber();
        }
    }

    console.log(proposals.length, 'grants found.');
    
    Utils.saveToJSON('grants.json', proposals);
    Utils.saveToCSV('grants.csv', proposals, [
        {id: 'id', title: 'Proposal ID'},
        {id: 'snapshot_id', title: 'Snapshot ID'},
        {id: 'user', title: 'Author'},
        
        {id: 'title', title: 'Title'},
        {id: 'status', title: 'Status'},
        {id: 'start_at', title: 'Started'},
        {id: 'finish_at', title: 'Ended'},
        {id: 'required_to_pass', title: 'Threshold'},
        {id: 'scores_total', title: 'Total VP'},
        
        {id: 'grant_category', title: 'Category'},
        {id: 'grant_tier', title: 'Tier'},
        {id: 'grant_size', title: 'Amount USD'},
        {id: 'grant_beneficiary', title: 'Beneficiary'},
        {id: 'vesting_address', title: 'Vesting Contract'},

        {id: 'token', title: 'Token'},
        {id: 'released', title: 'Released Amount'},
        {id: 'releasable', title: 'Releasable Amount'},
    ]);
}

main();
