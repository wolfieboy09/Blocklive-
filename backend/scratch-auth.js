
import { bypassAuth } from "./index.js";
import { ids } from "./secrets/secrets.js";


let pendingMap = {} // publicAuthCode : clientSecret 

function sleep(millis) {
    return new Promise(res=>setTimeout(res,millis))
}


let idIndex = 0;
export function getAuthProjStats() {
    return {idIndex,info:getAuthProjectInfo()}
}

function generateAuthCode() {
    return Math.random().toString(36).substring(2);
}

function getAuthProjectInfo() {
    return ids.projects[idIndex]
}

let userManager
let sessionManager
export function setPaths(app,userManagerr,sessionManagerr) {
    userManager=userManagerr
    sessionManager=sessionManagerr
    app.get('/verify/start',(req,res)=>{ // ?code=000000
        console.log('starting to authenticate a user')

        let clientCode = req.query.code;
        let verifyCode = generateAuthCode();
        pendingMap[clientCode] = verifyCode;
        res.send({code:verifyCode,project:getAuthProjectInfo()})
    })

    const COMMENT_WAIT = 1000 * 5;
    app.get('/verify/userToken',async (req,res)=>{ // ?code=000000&method=cloud|comments
        
        try{
            let clientCode = req.query.code
            let tempCode = pendingMap[clientCode];
            if(!tempCode) {
                res.send({err:'client code not found',clientCode});
                return;
            }
            let comment = await getVerificationComment(tempCode)
            if(!comment || comment?.err) {
                await sleep(COMMENT_WAIT)
                comment = await getVerificationComment()
            }
            if(comment?.code =='nocon') {
                grantFreePass(req.headers.uname)
                res.send({freepass:true})
                return;
            }
            if(!comment) {
                res.send({err:'no comment'})
                return;
            }
            console.log('comment',comment)
            delete pendingMap[tempCode];

            let username = comment.user;
            let token = userManagerr.getUser(username)?.token
            if(!token) {
                res.send({err:'user not found',username});
                return;
            }

            deleteFreePass(username)
            res.send({token,username})
            return;
        } catch(err) {
            next(err);
        }
    })
}

let cachedComments = []
let cachedTime = 0;
let COMMENT_CHECK_RATELIMIT = 1000*2; // every 2 seconds

async function checkComments() {
    try{
    let projectInfo = ids.projects[idIndex];
    let projectId = projectInfo.id
    let projectUsername = projectInfo.user

    cachedComments = await (await fetch(`https://api.scratch.mit.edu/users/${projectUsername}/projects/${projectId}/comments?offset=0&limit=40&rand=${Math.random()}`)).json()
    cachedTime = Date.now()

    // test if project is missing or comments turned off
    let projectJson = await (await fetch(`https://api.scratch.mit.edu/users/${projectUsername}/projects/${projectId}?rand=${Math.random()}`)).json();
    if(projectJson.code || projectJson.comments_allowed===false || projectJson.response=="Too many requests") {
        cachedComments = {code:'nocon'}
        console.log('project failed, info:',projectInfo)
        idIndex=(idIndex+1)%ids.projects.length  
        return cachedComments
    }

    return cachedComments
    } catch (e) {
        cachedComments = {code:'nocon'}
        idIndex=(idIndex+1)%ids.projects.length
        return cachedComments
    }
}
let checkCommentPromise = null;
async function queueCommentCheck() {
    if(checkCommentPromise) {return checkCommentPromise}
    return checkCommentPromise = new Promise(res=>setTimeout(async()=>{
        await checkComments();
        checkCommentPromise = null;
        res(cachedComments);
    },COMMENT_CHECK_RATELIMIT))
}
async function checkCommentsRatelimited() {
    if(Date.now() - cachedTime < COMMENT_CHECK_RATELIMIT) {
        return await queueCommentCheck()
    } else {
        return await checkComments()
    }
}

async function getVerificationComment(tempCode) {
    let comments = await checkCommentsRatelimited()
    if(comments?.code) {return {code:'nocon'}};
    let comment = comments?.map(commentObj=>({content:commentObj?.content,user:commentObj?.author.username})).filter(com=>String(com.content)==String(tempCode)).reverse()[0]
    return comment;
}


let freePasses = {} // username : passtime
// grant temporary free verification to users if the blocklive server fails to verify
export function grantFreePass(username) {
    console.error('granted free pass to user ' + username)
    username=username?.toLowerCase?.()
    freePasses[username] = Date.now()
}
export function hasFreePass(username) {
    username=username?.toLowerCase?.()
    return username in freePasses
}
export function deleteFreePass(username) {
    username=username?.toLowerCase?.()
    if(username in freePasses) {
        console.error('removing free pass from user ' + username)
        delete freePasses[username];
    }
}


export function authenticate(username,token) {
    if(bypassAuth) {return true}
    let success = hasFreePass(username) || userManager.getUser(username).token == token
    if(!success) {
        console.error(`🟪 User Authentication failed for user: ${username}, bltoken: ${token}`)
    }
    return success
}