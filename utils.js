const fs = require('fs');
const CSVWritter = require('csv-writer');
const fetch = require('isomorphic-fetch');

function toISOString(date) {
    return date && new Date(date * 1000).toISOString();
}

async function fetchURL(url, options) {
    const res = await fetch(url, options);
    return await res.json();
}

async function fetchGraphQL(url, collection, where, orderBy, fields) {
    const elements = [];
    while(true) {
        let skip = elements.length
        const query = `query {  ${collection} (first: 10000, skip: ${skip}, where: { ${where} }, orderBy: "${orderBy}", orderDirection: desc) { ${fields} }}`;

        const json = await fetchURL(url, {
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({"query": query, "variables": null}),
            method: 'POST'
        });
        
        if (!json.data[collection].length) break;
        elements.push(...json.data[collection]);
    }
    return elements;
}

function saveToJSON(path, data) {
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    fs.writeFile(path, JSON.stringify(data), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("The JSON file has been saved.");
    });
}

async function saveToCSV(path, data, header)  {
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    const csvWriter = CSVWritter.createObjectCsvWriter({path, header});
    await csvWriter.writeRecords(data);
    console.log('The CSV file has been saved.');
}

exports.saveToJSON = saveToJSON;
exports.saveToCSV = saveToCSV;
exports.fetchURL = fetchURL;
exports.fetchGraphQL = fetchGraphQL;
