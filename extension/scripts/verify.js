
function askVerify() {
chrome.runtime.sendMessage({meta:'verify?'},async (response)=>{
    let ok = await commentTempCode(response.code,response.project)
    chrome.runtime.sendMessage({meta:'commented',ok})
})
}
askVerify()


async function commentTempCode(code,projectInfo) {
    let projectId = projectInfo.id;

    let token = (await (await fetch("https://scratch.mit.edu/session/?blreferer", {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      })).json()).user.token


    let response = await fetch(`https://api.scratch.mit.edu/proxy/comments/project/${projectId}`, {
    "headers": {
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-csrftoken": (await cookieStore.get("scratchcsrftoken"))?.value,
        "x-token": token
    },
    "referrer": "https://scratch.mit.edu/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": `{\"content\":\"${code}\",\"parent_id\":\"\",\"commentee_id\":\"\"}`,
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
    }).catch(console.log);

    return response?.ok;
}


/// observe login

const targetNode = document.querySelector(".registrationLink")?.parentNode?.parentNode;

if(targetNode) { // only add the listener on the logged out page
// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if(mutation.addedNodes?.[0]?.classList.contains('account-nav')) {
        console.log('bl login detected')
        askVerify()
    }
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);
}