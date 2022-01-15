const fetch = require('isomorphic-fetch');
const snapshot = require('@snapshot-labs/snapshot.js')
const CSVWritter = require('csv-writer');
var ENS = require('ethereum-ens');
var Web3 = require('web3');
let provider = new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/8a9a382f3c664a1294aea0ab7172858e`)
var ens = new ENS(provider);

const members = require('./members.json');
const info = [];

const space = 'snapshot.dcl.eth';
const strategies = [
    {
        "name": "erc20-balance-of",
        "params": {
          "symbol": "WMANA",
          "address": "0xfd09cf7cfffa9932e33668311c4777cb9db3c9be",
          "decimals": 18
        }
      },
      {
        "name": "multichain",
        "params": {
          "name": "multichain",
          "graphs": {
            "137": "https://api.thegraph.com/subgraphs/name/decentraland/blocks-matic-mainnet"
          },
          "symbol": "MANA",
          "strategies": [
            {
              "name": "erc20-balance-of",
              "params": {
                "address": "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
                "decimals": 18
              },
              "network": "1"
            },
            {
              "name": "erc20-balance-of",
              "params": {
                "address": "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4",
                "decimals": 18
              },
              "network": "137"
            }
          ]
        }
      },
      {
        "name": "erc721-with-multiplier",
        "params": {
          "symbol": "LAND",
          "address": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
          "multiplier": 2000
        }
      },
      {
        "name": "decentraland-estate-size",
        "params": {
          "symbol": "ESTATE",
          "address": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
          "multiplier": 2000
        }
      },
      {
        "name": "erc721-with-multiplier",
        "params": {
          "symbol": "NAMES",
          "address": "0x2a187453064356c898cae034eaed119e1663acb8",
          "multiplier": 100
        }
      },
      {
        "name": "delegation",
        "params": {
          "symbol": "VP (delegated)",
          "strategies": [
            {
              "name": "erc20-balance-of",
              "params": {
                "symbol": "WMANA",
                "address": "0xfd09cf7cfffa9932e33668311c4777cb9db3c9be",
                "decimals": 18
              }
            },
            {
              "name": "erc721-with-multiplier",
              "params": {
                "symbol": "LAND",
                "address": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
                "multiplier": 2000
              }
            },
            {
              "name": "decentraland-estate-size",
              "params": {
                "symbol": "ESTATE",
                "address": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
                "multiplier": 2000
              }
            },
            {
              "name": "multichain",
              "params": {
                "name": "multichain",
                "graphs": {
                  "137": "https://api.thegraph.com/subgraphs/name/decentraland/blocks-matic-mainnet"
                },
                "symbol": "MANA",
                "strategies": [
                  {
                    "name": "erc20-balance-of",
                    "params": {
                      "address": "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
                      "decimals": 18
                    },
                    "network": "1"
                  },
                  {
                    "name": "erc20-balance-of",
                    "params": {
                      "address": "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4",
                      "decimals": 18
                    },
                    "network": "137"
                  }
                ]
              }
            },
            {
              "name": "erc721-with-multiplier",
              "params": {
                "symbol": "NAMES",
                "address": "0x2a187453064356c898cae034eaed119e1663acb8",
                "multiplier": 100
              }
            }
          ]
        }
      }
    ];

const network = '1';
const blockNumber = 'latest';

const catalysts = [
    'peer-ec1.decentraland.org',
    'peer-wc1.decentraland.org',
    'eer-eu1.decentraland.org',
    'peer-ap1.decentraland.org',
    'interconnected.online',
    'peer.decentral.io',
    'peer.melonwave.com',
    'peer.kyllian.me',
    'peer.uadevops.com',
    'peer.dclnodes.io',
];

async function main() {
    for(var i = 0 ; i < members.length ; i++) {
        const address = members[i];
        
        let json = {"avatars":[]}
        try {
            console.log('fetching profile')
            const domain = catalysts[i % catalysts.length];
            const res = await fetch(`https://${domain}/lambdas/profile/${address}`);
            json = await res.json();
        } catch {}
        
        // Fetch Name
        let ensName = '';
        try {
            console.log('fetching ens')
            ensName = await ens.reverse(address).name();
        } catch {}

        let scores = [0, 0, 0, 0, 0];
        try {
            console.log('fetching scores')
            scores = await snapshot.utils.getScores(space, strategies, network, [address], blockNumber);
            scores = scores.map(a => parseInt(a[address] || 0));
        } catch {}

        info.push({
            'address': address,
            'dclName': json.avatars[0] ? json.avatars[0].name : '',
            'totalVP': scores.reduce((a, b) => a + b),
            'manaVP': scores[0] + scores[1],
            'landVP': scores[2] + scores[3],
            'namesVP': scores[4],
            'delegatedVP': scores[5],
            'ensName': ensName,
        });
        console.log(i, members.length, parseInt(i / members.length * 100));
    }

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'members.csv',
        header: [
          {id: 'address', title: 'Member'},
          {id: 'dclName', title: 'DCL Name'},
          {id: 'ensName', title: 'ENS Name'},
          {id: 'totalVP', title: 'Total VP'},
          {id: 'manaVP', title: 'MANA VP'},
          {id: 'landVP', title: 'LAND VP'},
          {id: 'namesVP', title: 'NAMES VP'},
          {id: 'delegatedVP', title: 'Delegated VP'},
        ]
      });

    csvWriter.writeRecords(info).then(()=> console.log('The CSV file was written successfully'));
}

main();