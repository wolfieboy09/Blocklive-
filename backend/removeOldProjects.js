import { blocklivePath, lastIdPath, loadMapFromFolder, saveMapToFolder, saveMapToFolderAsync, scratchprojectsPath, usersPath} from './filesave.js'
import fs from 'fs'
import cron from 'node-cron'

export function installCleaningJob(sessionManager, userManager) {
    removeOldProjectsAsync(sessionManager,userManager);
    cron.schedule(CRON_EXPRESSION,()=>removeOldProjectsAsync(sessionManager,userManager))
}

const HOW_OLD_DAYS = 60; // delete projects with no new edits in the last this number of days
const CRON_EXPRESSION = '0 2 * * *'; // every night at 2am

function removeOldProjectsAsync(sessionManager, userManager) {
    fs.readdir(blocklivePath,(files=>{
        for (id in files) {
            let project = sessionManager.getProject(id)
            id=project.id;
            if(!project) { sessionManager.deleteProjectFile(id); return;} //todo check if project not existing messes up delete function
            
            if(Object.keys(project.session.connectedClients).length == 0) {
                if(Date.now()-new Date(project.project.lastTime) > HOW_OLD_DAYS * 24 * 60 * 60 * 1000){

                    console.log(`🚮 trashing project id ${id}`);

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
    }))
}