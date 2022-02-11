const Utils = require('./utils.js');

const Web3 = require('web3');
const web3 = new Web3(process.env.INFURA_URL);
const VESTING_ABI = [{"constant":true,"inputs":[],"name":"duration","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cliff","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"initialized","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"beneficiary","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"vestedAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"releasableAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"revoked","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"},{"name":"_beneficiary","type":"address"},{"name":"_start","type":"uint256"},{"name":"_cliff","type":"uint256"},{"name":"_duration","type":"uint256"},{"name":"_revocable","type":"bool"},{"name":"_token","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"release","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"revocable","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"released","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_token","type":"address"},{"name":"amount","type":"uint256"}],"name":"releaseForeignToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"revoke","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"start","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"target","type":"address"}],"name":"releaseTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"target","type":"address"}],"name":"changeBeneficiary","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Released","type":"event"},{"anonymous":false,"inputs":[],"name":"Revoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}];

async function main() {
    let contract = new web3.eth.Contract(VESTING_ABI, '0xfF06369c25CCBea0d22E480B38F59e23e77D1F9C');

    // Fetch Snapshot Proposals
    const url = 'https://hub.snapshot.org/graphql';
    const where = 'space_in: ["snapshot.dcl.eth"]';
    let proposals = await Utils.fetchGraphQL(url, 'proposals', where, 'created', 'id scores_total');

    // Index by Id
    const proposalVotes = {};
    proposals.forEach(p => proposalVotes[p.id] = p);

    // Get Gobernance dApp Proposals
    proposals = [];
    while(true) {
        let skip = proposals.length
        const url = `https://governance.decentraland.org/api/proposals?limit=100000&offset=${skip}&type=grant`;
        const json = await Utils.fetchURL(url);

        if (!json.data.length) break;
        proposals.push(...json.data);
    }

    proposals.forEach(p => {
        pv = proposalVotes[p.snapshot_id];
        p.scores_total = parseInt(pv.scores_total);
        p.grant_category = p.configuration.category;
        p.grant_tier = p.configuration.tier.split(':')[0];
        p.grant_size = p.configuration.size;
        p.grant_beneficiary = p.configuration.beneficiary;
    });

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
    ]);
}

main();
