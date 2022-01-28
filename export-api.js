const fs = require('fs');
const fetch = require('isomorphic-fetch');
const balances = require('./public/balances.json');

async function main() {
    const data = {
        'balances': balances,
        'income': [],
        'expenses': [],
        'funding': [],
        'members': [
            {'address': '', 'name': 'Yemel', 'team': 'DAO Committee'},
            {'address': '', 'name': 'Yemel', 'team': 'DAO Committee'},
            {'address': '', 'name': 'Yemel', 'team': 'DAO Committee'},
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
