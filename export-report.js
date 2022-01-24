const fs = require('fs');
const ejs = require('ejs');
const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer')

function lastReport(now) {
    let lastReport = (new Date(now));
    lastReport.setUTCDate(now.getUTCDate() < 16 ? 1 : 16);
    return lastReport;
}

function yesterday(now) {
    return new Date(now - (1000 * 3600 * 24));
}

async function main() {
    let now = new Date(new Date().toISOString().slice(0, 10));

    let currentReport = 14 + (now.getUTCFullYear() - 2022) * 24 + (now.getUTCMonth() * 2);
    currentReport += now.getUTCDate() < 16 ? 0 : 1;
    
    let endDate = lastReport(now);
    let startDate = lastReport(yesterday(endDate));

    const startDateStr = startDate.toLocaleDateString('en', { month: 'long', day: 'numeric', timeZone: 'GMT' });
    const endDateStr = yesterday(endDate).toLocaleDateString('en', { month: 'long', day: 'numeric', timeZone: 'GMT' });

    console.log(`Generating Report #${currentReport}...`);
    console.log(`Today: ${now.toISOString()}`);
    console.log(`Proposals from ${startDateStr} to ${endDateStr}`);

    // Get Gobernance dApp Proposals
    let proposals = [];
    while(true) {
        let skip = proposals.length
        const url = `https://governance.decentraland.org/api/proposals?limit=100000&offset=${skip}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json.data.length) break;
        proposals.push(...json.data);
    }

    const pois = proposals.filter(p => p.type == 'poi');
    for(var i = 0 ; i < pois.length ; i++) {
        const x = pois[i].configuration.x;
        const y = pois[i].configuration.y;
        const res = await fetch(`https://api.decentraland.org/v2/tiles?x1=${x}&y1=${y}&x2=${x}&y2=${y}`)
        const json = await res.json();
        pois[i].name = json.data[`${x},${y}`].name || 'No Name';
    }

    // Active Proposals
    aproposals = proposals.filter(p => p.status == 'active');
    activePois = aproposals.filter(p => p.type == 'poi');
    activeGrants = aproposals.filter(p => p.type == 'grant');
    activeBans = aproposals.filter(p => p.type == 'ban_name');
    activeCatalysts = aproposals.filter(p => p.type == 'catalyst');
    activePolls = aproposals.filter(p => p.type == 'poll');

    // Finished Proposals
    fproposals = proposals.filter(p => (
        startDate < new Date(p.finish_at) &&
        new Date(p.finish_at) < endDate &&
        ['finished', 'passed', 'enacted'].indexOf(p.status) != -1
    ));

    for(var i = 0; i < fproposals.length; i++) {
        const prop = fproposals[i];
        const res = await fetch(`https://governance.decentraland.org/api/proposals/${prop.id}/votes`);
        const data = await res.json();
        const votes = Object.values(data.data);
        prop.totalVP = votes.reduce((total, vote) => total + vote.vp, 0);
        prop.choices = prop.configuration.choices.map((name, index) => {
            const choiceVP = votes.filter(v => v.choice == index+1).reduce((total, vote) => total + vote.vp, 0);
            const choiceVotes = votes.filter(v => v.choice == index+1).length;
            const choiceWeight = parseInt(choiceVP/prop.totalVP*100);
            const choiceName = name[0].toUpperCase() + name.slice(1);
            return [choiceName, choiceWeight, choiceVP.toLocaleString('en-us'), choiceVotes]; 
        });
    }
    fproposals = fproposals.filter(p => p.totalVP >= 500000);
    newPois = fproposals.filter(p => p.type == 'poi');
    newGrants = fproposals.filter(p => p.type == 'grant');
    newBans = fproposals.filter(p => p.type == 'ban_name');
    newCatalysts = fproposals.filter(p => p.type == 'catalyst');
    newPolls = fproposals.filter(p => p.type == 'poll');

    report = await ejs.renderFile('report.md', {
        'number': currentReport,
        'startDateStr': startDateStr,
        'endDateStr': endDateStr,
        'newPois': newPois,
        'newGrants': newGrants,
        'newBans': newBans,
        'newCatalysts': newCatalysts,
        'activePolls': activePolls,
        'activePois': activePois,
        'activeGrants': activeGrants,
        'activeBans': activeBans,
        'activeCatalysts': activeCatalysts,
        'activePolls': activePolls,
    }, {});

    fs.writeFile(`public/report-${currentReport}.md`, report, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("✅ The markdown file has been saved.");
    });
}

main();
