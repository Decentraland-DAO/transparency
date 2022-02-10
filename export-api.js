const fs = require('fs');
const balances = require('./public/balances.json');
const transactions = require('./public/transactions.json');

var VESTING_ADDRESS = '0x7a3abf8897f31b56f09c6f69d074a393a905c1ac';
var FACILITATOR_ADDRESS = '0x76fb13f00cdbdd5eac8e2664cf14be791af87cb0';
var CURATORS_ADDRESSES = [
    '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
    '0x716954738e57686a08902d9dd586e813490fee23',
    '0x7a3891acf4f3b810992c4c6388f2e37357d7d3ab',
    '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
    '0x8938d1f65abe7750b0777206ee26c974a6721194',
    '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
    '0x399a44f5821b1f859bc236e14367c4f7c36933fb',
    '0x967fb0c36e4f5288f30fb05f8b2a4d7b77eaca4b',
    '0xc958f028d1b871ab2e32c2abda54f37191efe0c2',
    '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
    '0x6cdfdb9a4d99f16b5607cab1d00c792206db554e'
];

const sumQuote = txs => txs.reduce((total, tx) => total + tx.quote, 0);

async function main() {

    var now = new Date();
    var last30 = new Date(now - (1000 * 3600 * 24 * 30)).toISOString();
    var last60 = new Date(now - (1000 * 3600 * 24 * 60)).toISOString();

    var incomeTxs = transactions.filter(tx => tx.type == 'IN');
    var incomeTxs30 = incomeTxs.filter(tx => tx.date >= last30);
    var totalIncome30 = sumQuote(incomeTxs30);

    var incomeTxs60 = incomeTxs.filter(tx => tx.date >= last60 && tx.date < last30);
    var totalIncome60 = sumQuote(incomeTxs60);
    var delta = (totalIncome30 - totalIncome60) * 100 / totalIncome60;

    var totalVesting = sumQuote(incomeTxs30.filter(tx => tx.from == VESTING_ADDRESS));
    var otherIncome = totalIncome30 - totalVesting;

    var expensesTxs = transactions.filter(tx => tx.type == 'OUT');
    var expensesTxs30 = expensesTxs.filter(tx => tx.date >= last30);
    var totalExpenses30 = sumQuote(expensesTxs30);

    var expensesTxs60 = incomeTxs.filter(tx => tx.date >= last60 && tx.date < last30);
    var totalExpenses60 = sumQuote(expensesTxs60);
    var delta = (totalExpenses30 - totalExpenses60) * 100 / totalExpenses60;

    var totalFacilitator = sumQuote(expensesTxs30.filter(tx => tx.to == FACILITATOR_ADDRESS));
    var totalCurators = sumQuote(expensesTxs30.filter(tx => CURATORS_ADDRESSES.indexOf(tx.to) != -1));
    var otherExpenses = totalExpenses30 - totalFacilitator - totalCurators;

    const data = {
        'balances': balances,
        'income': {
            'total': totalIncome30,
            'previous': delta,
            'details': [
                {'name': 'Vesting Contract', 'value': totalVesting},
                {'name': 'Marketplace', 'value': 1233333},
                {'name': 'Wearables Publication', 'value': 1233333},
                {'name': 'Other', 'value': otherIncome},
            ]
        },
        'expenses': {
            'total': totalExpenses30,
            'previous': delta,
            'details': [
                {'name': 'Curation Committee', 'value': totalCurators},
                {'name': 'DAO Facilitator', 'value': totalFacilitator},
                {'name': 'Grants', 'value': totalFacilitator},
                {'name': 'Other', 'value': otherExpenses},
            ]
        },
        'funding': {
            'total': 2370000,
            'budget': 137458464,
        },
        'teams': [
            {
                'name': 'Security Advisory Board',
                'description': "Responsable to overview the sensible operations of the DAO, with the power to halt operations initiated by the DAO Committee or the Community. They advise in the best course of action for technical operations involving the DAO's smart contracts.",
                'members': [
                    {'address': '0xbcac4dafb7e215f2f6cb3312af6d5e4f9d9e7eda', 'name': 'Nacho'},
                    {'address': '0xfc4ef0903bb924d06db9cbaba1e4bda6b71d2f82', 'name': 'Brett'},
                    {'address': '0x48850327b81D0c924Ad212891C7223c2ea5Cd426', 'name': 'HPrivakos'},
                    {'address': '0x42ebd2ab698ba74eec1d2a81c376ea2c38c05249', 'name': 'Agustin F.'},
                    {'address': '0x759605f5497c578988d167e2f66d4955d35e77af', 'name': 'Ariel B.'},
                ],
            },
            {
                'name': 'DAO Committee',
                'description': "Their principal responsibility is to enact binding proposals on-chain like listing Point of Interests, sending Grants, and any other operations involving the DAO's smart contracts.",
                'members': [
                    {'address': '0xfe91C0c482E09600f2d1DBCA10FD705BC6de60bc', 'name': 'Yemel'},
                    {'address': '0xBef99f5f55CF7cDb3a70998C57061B7e1386a9b0', 'name': 'HPrivakos'},
                    {'address': '0x3323B7264F7D5e8f98e6aFCcec73b6bA1116AE19', 'name': 'Eric'},
                ],
            },
            {
                'name': 'Wearable Curation Team',
                'description': "Responsible for reviewing new wearable submissions ensuring they are glitch-free and compliant with the design guidelines. They also rise warnings about IP infringement and violent content.",
                'members': [
                    {'address': '0x8938d1f65abe7750b0777206ee26c974a6721194', 'name': 'Shibu'},
                    {'address': '0x7a3891acf4f3b810992c4c6388f2e37357d7d3ab', 'name': 'JP'},
                    {'address': '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0', 'name': 'Lau'},
                    {'address': '0x716954738e57686a08902d9dd586e813490fee23', 'name': 'Hirotokai'},
                    {'address': '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9', 'name': 'Malloy'},
                    {'address': '0x91e222ed7598efbcfe7190481f2fd14897e168c8', 'name': 'Chestnutbruze'},
                    {'address': '0x5E382071464A6F9EA29708A045983dc265B0D86d', 'name': 'Sango'},
                    {'address': '0xc8ad6322821b51da766a4b2a82b39fb72b53d276', 'name': 'Grimey'},
                    {'address': '0xa8c7d5818A255A1856b31177E5c96E1D61c83991', 'name': 'AndreusAs'},
                    {'address': '0x336685bb3A96E13B77E909d7C52e8AfCfF1E859E', 'name': 'Mitch Todd'},
                    {'address': '0x41eb5F82af60873b3C14fEDB898A1712f5c35366', 'name': 'Kristian'},
                    {'address': '0x470c33aBD57166940095d59BD8Dd573cBae556c3', 'name': 'James Guard'},
                    {'address': '0x1DeC5f50cB1467F505BB3ddFD408805114406b10', 'name': 'Fabeeo Breen'},
                    {'address': '0x805797Df0c0d7D70E14230b72E30171d730DA55e', 'name': 'Yannakis'},
                ],
            },
            {
                'name': 'DAO Facilitator',
                'description': "Responsible for general community outreach and hosting monthly town halls. The DAO Facilitator writes the bi-weekly report based on the comments of the DAO Committee and the community.",
                'members': [
                    {'address': '0x76fb13f00CdbdD5eAC8E2664CF14be791aF87cb0', 'name': 'Matimio'},
                ],
            }
        ]
    };

    fs.writeFile(`public/api.json`, JSON.stringify(data), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("✅ The JSON file has been saved.");
    });
}

main();
