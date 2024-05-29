

let currentBlToken = null
async function getCurrentBlToken() {
    let username = await BLOCKLIVE.refreshUsername()
    let blToken = await getBlockliveToken(username)
    currentBlToken = blToken;
    return blToken
}
async function getCurrentBLTokenAfterUsernameRefresh() {
    let username = uname
    let blToken = await getBlockliveToken(username)
    currentBlToken = blToken;
    return blToken
}

async function getBlockliveToken(username) {
    username = username?.toLowerCase?.()
    if(!username) {return null}
    let key = `blToken.${username}`;
    let token = (await chrome.storage.local.get([key]))[key]

    return token;
}

let verifying = false;
let endVerifyCallbacks = []
let startVerifyCallbacks = []
function startVerifying() {
    verifying = true;
    startVerifyCallbacks.forEach(func=>func?.())
}
function endVerifying(success) {
    verifying = false;
    endVerifyCallbacks.forEach(func=>func?.(success))
}

let clientCode = null;
const VERIFY_RATELIMIT = 1000 * 60 * 10 // wait ten minutes before trying to update again
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    ;
    (async ()=>{
    if (request.meta == 'verify?') {
        console.log('verify recieved')
        let token = await getCurrentBlToken();
        let freepassExpired = false;
        if(String(token).startsWith('freepass')) {
            passDate =parseInt(token.split(' ')[1])
            if(Date.now() - passDate > VERIFY_RATELIMIT) {freepassExpired = true}
        }
        if(!token || freepassExpired) {
            startVerifying()

            try{
                clientCode = Math.random().toString()
                console.log('client code',clientCode)

                let verifyResponse = await (await fetch(`${apiUrl}/verify/start?code=${clientCode}`)).json()
                console.log('verify response',verifyResponse)

                let code = verifyResponse.code
                let project = verifyResponse.project

                sendResponse({code,project})
            } catch (e) {console.error(e); endVerifying(false)}
        }
    } else if (request.meta == 'commented') {
        console.log('commented')
        try{
            let tokenResponse =  await (await fetch(`${apiUrl}/verify/userToken?code=${clientCode}`,{headers:{uname}})).json()
        
            console.log('tokenResponse',tokenResponse)
            if(tokenResponse.freepass) {
                storeBlockliveToken(uname,`freepass ${Date.now()}`,true)
                endVerifying(true)
            } else {
                storeBlockliveToken(tokenResponse.username,tokenResponse.token,true) 
                endVerifying(true)
            }
        } catch(e) {
            endVerifying(false)
        }
    }
})();
    return true;
})

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.meta == 'startVerifyCallback') {
        startVerifyCallbacks.push(sendResponse)
        console.log(startVerifyCallbacks)
        console.log(sendResponse)
        return true;
    }  else if (request.meta == 'endVerifyCallback') {
        endVerifyCallbacks.push(sendResponse)
        return true;
    }  else if (request.meta == 'verifying') {
        sendResponse(verifying)
    }
})

// if it could all happen in background.js, it would look like this
// async function authenticateScratch() {
//     let username = ""

//     let clientCode = Math.random().toString()

//     let verifyResponse = await (await fetch(`${apiUrl}/verify/start?code=${clientCode}`)).json()

//     let code = verifyResponse.code
//     let project = verifyResponse.project

//     await commentTempCode(code,project);

//     let tokenResponse =  await (await fetch(`${apiUrl}/verify/userToken?code=${clientCode}`)).json()
    
//     storeBlockliveToken(tokenResponse.username,tokenResponse.token)

// }
function storeBlockliveToken(username,token,current) {
    username=username?.toLowerCase()
    let toSet = {}
    toSet[`blToken.${username}`] = token
    chrome.storage.local.set(toSet)
    if(current) {currentBlToken = token}
}

async function getConfimationCode(tempCode) {
    return await (await fetch(`${apiUrl}/verify/start?code=${tempCode}`)).json();
}
