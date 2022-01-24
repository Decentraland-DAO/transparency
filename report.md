---
layout: post
title: "Guest Post: DAO Committee Report #<%= number %>"
description: "A review of the proposals and polls passed in the DAO from <%= startDateStr %> through <%= endDateStr %>".
date: 2022-01-07 00:00:01 -0300
tags: [announcement, dao, dao-committee-report]
category: 'project-updates'
author: 'decentraland'
image: /images/banners/governance.png
---

In the two weeks since the last DAO Committee report, <%= newPois.length %> points of interest (POI) have been added to the Decentraland map, <%= newGrants.length %> grant proposals were approved, <%= newBans.length %> names were banned, <%= newCatalysts.length %> catalysts have been added to the network, and <%= newPolls.length %> community polls have passed.

(INTRO: TO BE COMPLETED BY DAO FACILITATOR)


## Points of Interest
<%= newPois.length %> points of interest have been added to Decentraland’s map since the last report.

<% newPois.forEach(function(poi){ %>
#### <%= poi.configuration.x %>, <%= poi.configuration.y %>: [<%= poi.name %>](https://governance.decentraland.org/proposal/?id=<%= poi.id %>)
<% poi.choices.forEach(function(choice){ %>
* <%= choice[0] %> <%= choice[1] %>% <%= choice[2] %> VP (<%= choice[3] %> votes)<% });%>

<% }); %>
## Name Bans
<% if (newBans.length == 0){ %>
No names have been banned since the previous report.
<% } else { %>
<%= newBans.length %> names have been banned since the previous report. To see the recently banned names, visit [governance.decentraland.org](https://governance.decentraland.org/) and filter proposals by “Name Ban”.
<% } %>
## Catalyst Nodes
<%= newCatalysts.length == 0 ? 'No' : newCatalysts.length %> Catalyst nodes have been added since the previous report.

<% newCatalysts.forEach(function(cat){ %>
#### [<%= cat.title %>](https://governance.decentraland.org/proposal/?id=<%= cat.id %>)
<% cat.choices.forEach(function(choice){ %>
* <%= choice[0] %> <%= choice[1] %>% <%= choice[2] %> VP (<%= choice[3] %> votes)<% });%>

<% }); %>
## Grant requests
Since <%= startDateStr %>, <%= newGrants.length %> grants have been approved and the vesting contract(s) will be established within 7-10 days.

<% newGrants.forEach(function(grant){ %>
#### [<%= grant.title %>](https://governance.decentraland.org/proposal/?id=<%= grant.id %>) (<%= grant.configuration.tier.split(':')[0] %>)
<% grant.choices.forEach(function(choice){ %>
* <%= choice[0] %> <%= choice[1] %>% <%= choice[2] %> VP (<%= choice[3] %> votes)<% });%>

<% }); %>
## Polls
<% newPolls.forEach(function(poll){ %>
#### [<%= poll.title %>](https://governance.decentraland.org/proposal/?id=<%= poll.id %>)
<% poll.choices.forEach(function(choice){ %>
* <%= choice[0] %> <%= choice[1] %>% <%= choice[2] %> VP (<%= choice[3] %> votes)<% });%>

<% }); %>

# Active Proposals

## Points of Interest
<% activePois.forEach(function(poi){ %>
* <%= poi.configuration.x %>, <%= poi.configuration.y %>: [<%= poi.name %>](https://governance.decentraland.org/proposal/?id=<%= poi.id %>)<% }); %>

## Grants
<% activeGrants.forEach(function(grant){ %>
* [<%= grant.title %>](https://governance.decentraland.org/proposal/?id=<%= grant.id %>) (<%= grant.configuration.tier.split(':')[0] %>)<% }); %>

## Names Bans
<% activeBans.forEach(function(ban){ %>
* [<%= ban.title %>](https://governance.decentraland.org/proposal/?id=<%= ban.id %>)<% }); %>

## Catalysts
<% activeCatalysts.forEach(function(cat){ %>
* [<%= cat.title %>](https://governance.decentraland.org/proposal/?id=<%= cat.id %>)<% }); %>

## Polls
<% activePolls.forEach(function(poll){ %>
* [<%= poll.title %>](https://governance.decentraland.org/proposal/?id=<%= poll.id %>)<% }); %>


*For questions or comments please contact the DAO Facilitator, Matimio (Discord: Matimio#4673; Email: [Matimio@decentraland.org](mailto:Matimio@decentraland.org))*