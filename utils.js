const fs = require('fs');
const CSVWritter = require('csv-writer');
const fetch = require('isomorphic-fetch');

function toISOString(date) {
    return date && new Date(date * 1000).toISOString();
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchURL(url, options, retry) {
    retry = retry === undefined ? 3 : retry;
    let res = await fetch(url, options);
    try {
        return await res.json();
    } catch (err) {
        if (retry == 0) throw err;
        await delay(2000);
        return await fetchURL(url, options, retry-1);
    }
}

async function fetchGraphQL(url, collection, where, orderBy, fields, first) {
    const elements = [];
    first = first || 10000;
    while(true) {
        let skip = elements.length
        const query = `query {  ${collection} (first: ${first}, skip: ${skip}, where: { ${where} }, orderBy: "${orderBy}", orderDirection: desc) { ${fields} }}`;

        const json = await fetchURL(url, {
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({"query": query, "variables": null}),
            method: 'POST'
        });
        
        if(json.errors) throw Error('Fetch Error' + json.errors[0].message);
        if (!json.data[collection].length) break;
        elements.push(...json.data[collection]);
    }
    return elements;
}

function saveToFile(name, data) {
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    const path = './public/' + name;
    fs.writeFileSync(path, data, 'utf8');
}

function saveToJSON(name, data) {
    saveToFile(name, JSON.stringify(data));
    console.log("The JSON file has been saved.");
}

async function saveToCSV(name, data, header)  {
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    const path = './public/' + name;
    const csvWriter = CSVWritter.createObjectCsvWriter({path, header});
    await csvWriter.writeRecords(data);
    console.log('The CSV file has been saved.');
}

exports.saveToFile = saveToFile;
exports.saveToJSON = saveToJSON;
exports.saveToCSV = saveToCSV;
exports.fetchURL = fetchURL;
exports.fetchGraphQL = fetchGraphQL;
exports.toISOString = toISOString;
