import fsp from 'fs/promises'
import fs from 'fs'
import cron from 'node-cron'

const recentPath = 'storage/recent.json'

//load from file
let {recent,recentShared} = fs.existsSync(recentPath) ? JSON.parse(fs.readFileSync(recentPath)) : {recent:{},recentShared:{}}

const CRON_EXPRESSION = '0 1 * * *'; // every night at 1am
cron.schedule(CRON_EXPRESSION, async () => {
    trimRecent()
},{
    scheduled: true,
    timezone: "America/Los_Angeles"
})

setInterval(saveRecent,1000)


// save to file
export async function saveRecent() {
    await fsp.writeFile(recentPath,JSON.stringify({recent,recentShared}))
}

export function addRecent(username,shared) {
    recent[username] = Date.now()
    if(shared) {
        recentShared[username] = Date.now()
    }
}

// remove older than 30 days
function trimRecent() {
    const DAYS = 30;

    let namesToDelete = Object.entries(recent).filter(entry=>(Date.now()-entry[1]>1000*60*60*24*DAYS)).map(entry=>entry[0]);
    namesToDelete.forEach(name=>{delete recent[name]})
    
    let namesToDeleteShared = Object.entries(recentShared).filter(entry=>(Date.now()-entry[1]>1000*60*60*24*DAYS)).map(entry=>entry[0]);
    namesToDeleteShared.forEach(name=>{delete recentShared[name]})
}

export function countRecentShared(days) {
    const DAYS = days;
    return Object.entries(recentShared).filter(entry=>(Date.now()-entry[1]<1000*60*60*24*DAYS)).length;
}
export function countRecent(days) {
    const DAYS = days;
    return Object.entries(recent).filter(entry=>(Date.now()-entry[1]<1000*60*60*24*DAYS)).length;
}
export function countRecentBoth(days) {
    return {
        all:countRecent(),
        shared:countRecentShared(),
    }
}

