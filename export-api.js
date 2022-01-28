const fs = require('fs');
const fetch = require('isomorphic-fetch');
const balances = require('./public/balances.json');

async function main() {
    const data = {
        'balances': balances,
        'income': {
            'total': 1200,
            'previous': 2.3,
            'details': [
                {'name': 'Vesting Contract', 'value': 1233333},
                {'name': 'Marketplace', 'value': 1233333},
                {'name': 'Wearables Publication', 'value': 1233333},
                {'name': 'Other', 'value': 2000},
            ]
        },
        'expenses': {
            'total': 1200,
            'previous': 2.3,
            'details': [
                {'name': 'Vesting Contract', 'value': 1233333},
                {'name': 'Curation Committee', 'value': 222233},
                {'name': 'DAO Facilitator', 'value': 2000},
                {'name': 'Other', 'value': 2000},
            ]
        },
        'funding': {
            'total': 28000,
            'budget': 40000,
        },
        'members': [
            {'address': '0xfe91C0c482E09600f2d1DBCA10FD705BC6de60bc', 'name': 'Yemel', 'team': 'DAO Committee'},
            {'address': '0xfe91C0c482E09600f2d1DBCA10FD705BC6de60bc', 'name': 'HPrivakos', 'team': 'DAO Committee'},
            {'address': '0xfe91C0c482E09600f2d1DBCA10FD705BC6de60bc', 'name': 'Eric', 'team': 'DAO Committee'},
        ],
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
