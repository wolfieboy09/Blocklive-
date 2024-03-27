import { blocklivePath } from './filesave.js'
import fs from 'fs'
import cron from 'node-cron'
import { sep } from 'path';

export function installCleaningJob(sessionManager, userManager) {
    removeOldProjectsAsync(sessionManager,userManager);
    cron.schedule(CRON_EXPRESSION,()=>removeOldProjectsAsync(sessionManager,userManager))
}

const HOW_OLD_DAYS = 60; // delete projects with no new edits in the last this number of days
const CRON_EXPRESSION = '0 2 * * *'; // every night at 2am

function removeOldProjectsAsync(sessionManager, userManager) {
    fs.readdir(blocklivePath,(err,files)=>{
        console.log('removal test started', files)
        for (let id of files) {
            console.log('probing project with id ' + id)
            let project = sessionManager.getProject(id)
            if(!project) { sessionManager.deleteProjectFile(id); return;} //todo check if project not existing messes up delete function
            id=project.id; // since we know that project.id exists
            
            if(Object.keys(project.session.connectedClients).length == 0) {
                if(Date.now()-new Date(project.project.lastTime) > HOW_OLD_DAYS * 24 * 60 * 60 * 1000){

                    [project.owner,...project.sharedWith].forEach(username=>{
                        userManager.unShare(username,id);
                        sessionManager.unshareProject(id,username)
                    })

                    sessionManager.deleteProjectFile(id);
                } else {
                    project.project.trimChanges(20)
                    this.offloadProjectAsync(id)
                }
            }

        }
    })
}