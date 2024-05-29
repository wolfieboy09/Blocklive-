console.log('mystuff inject started')

// get exId
const exId = document.querySelector(".blocklive-ext").dataset.exId

////////// INJECT UTILS //////////

let queryList = []
function mutationCallback() {
    let toDelete = []
    queryList.forEach(query=>{
        let elem = document.querySelector(query.query)
        if(elem && !elem.blSeen) {
            if(query.once){toDelete.push(query)}
            else {elem.blSeen = true}
            query.callback(elem)
        }
    })
    toDelete.forEach(query=>{queryList.splice(queryList.indexOf(query),1)})
}
let observer = new MutationObserver(mutationCallback)
observer.observe(document.documentElement,{ subtree: true, childList: true })
function getObj(query) {
    let obj = document.querySelector(query)
    if(obj) {return new Promise(res=>{res(obj)})}
    return new Promise(res=>{
        queryList.push({query,callback:res,once:true})
    })
}
function listenForObj(query,callback) {
    let obj = document.querySelector(query)
    if(obj) {obj.blSeen = true; callback(obj)}
    queryList.push({query,callback,once:false})
}




// BLM!!!!
function getBlMyStuff() {
    return new Promise((promRes)=>{
    chrome.runtime.sendMessage(exId,{meta:'myStuff'},promRes)
    })
}

function leaveId(id, div) {
  console.log(id,blProjectDivs)
  if(id in blProjectDivs) {
    document.querySelector("#main-content > div.media-list > ul").insertBefore(blProjectDivs[id],div)
  }
  div.remove()
}

function sendLeave(scratchId,blId) {
  blMySTuff.splice(blMySTuff.findIndex(item=>(item.scratchId==scratchId)),1)
  if(blId) {
    chrome.runtime.sendMessage(exId,{meta:'leaveBlId',blId})
  } else {
    chrome.runtime.sendMessage(exId,{meta:'leaveScratchId',scratchId})
  }
}

function sanitize(string) {
  string = String(string)
  // if(!(_.isString(string))) {return ''}
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match)=>(map[match]));
}

function getbox(blId,title,scratchId,lastModified,lastModBy,projectExists) {
  scratchId=sanitize(scratchId);
  title=sanitize(title);
  blId=sanitize(blId);
  lastModBy=sanitize(lastModBy);

    return`
    <div class="media-item-content not-shared">
      <div class="media-thumb">
        <a href="/projects/${scratchId}/">
          <img src="//cdn2.scratch.mit.edu/get_image/project/${scratchId}_100x80.png">
        </a>
      </div>
      <div class="media-info">
        <span class="media-info-item title"><a style="color:#ff4ad5" href="/projects/${scratchId}/">${title}</a></span>
      	<span class="media-info-item date shortDateFormat">
        
          Last modified: ${timeSince(new Date(lastModified))} ago by ${lastModBy}
          
        </span>
      <a href="/projects/${scratchId}/#editor" data-control="edit" class="media-control-edit small button grey">
	      <span>See inside</span>
      </a>
      </div>
      <div class="media-action">
	      <div><a class="media-trash" style="color:#ff4ad5" onclick="leaveId(${scratchId},this.parentElement.parentElement.parentElement.parentElement);sendLeave(${scratchId},${blId})">${projectExists ? "Unlink" : "Leave"}</a></div>
      </div>
    </div>`
}

https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);
    if(seconds < 0) {return 'zero seconds'}
  
    var interval = seconds / 31536000;
  
    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }

function getId(listItem) {
    return listItem.children[0].children[0].children[0].getAttribute('href').split('/')[2]
}


let oldAttrs = {}
function convertToBlocklive(listItem,projectObj) {
  let atts = {}
    atts.color = listItem.children[0].children[1].children[0].children[0].style.color
    listItem.children[0].children[1].children[0].children[0].style.color = '#ff4ad5'
    listItem.children[0].children[2].children[0].children[0].style.color = '#ff4ad5'
    
    atts.buttonText = listItem.children[0].children[2].children[0].children[0].innerText
    listItem.children[0].children[2].children[0].children[0].innerText = 'Unlink'
    listItem.children[0].children[2].children[0].children[0].onclick = ()=>{cleanseOfBlockliveness(projectObj.scratchId,listItem); sendLeave(projectObj.scratchId,projectObj.blId)}
    atts.title = listItem.children[0].children[1].children[0].children[0].innerText
    listItem.children[0].children[1].children[0].children[0].innerText = projectObj.title

    atts.modified = listItem.children[0].children[1].children[1].innerText
    listItem.children[0].children[1].children[1].innerText = `Last modified: ${timeSince(new Date(projectObj.lastTime))} ago by ${projectObj.lastUser}`

    oldAttrs[projectObj.scratchId] = atts

  }
function cleanseOfBlockliveness(scratchId, listItem) {
  let atts = oldAttrs[scratchId]
  if(!atts) {return}
  listItem.children[0].children[1].children[0].children[0].style.color = atts.color
  listItem.children[0].children[2].children[0].children[0].style.color = atts.color
  listItem.children[0].children[2].children[0].children[0].innerText = atts.buttonText
  // listItem.children[0].children[2].children[0].children[0].onclick = ()=>{alert('yi')}
  listItem.children[0].children[1].children[0].children[0].innerText = atts.title
  listItem.children[0].children[1].children[1].innerText = atts.modified
}

function addProject(projectObj, projectExists) {
    let newBox = document.createElement('li')
    newBox.innerHTML = getbox(projectObj.blId,projectObj.title,projectObj.scratchId,projectObj.lastTime,projectObj.lastUser,projectExists)
    document.querySelector('ul.media-list').insertBefore(newBox,document.querySelector('ul.media-list').firstChild)
}


////////// RUN ON START! ///////////

let blMySTuff
let blMyStuffMap = {}
let blProjectDivs = {}
let projectLoadFailed = false;
async function onTabLoad() {
    blMySTuff = await getBlMyStuff()
    if(blMySTuff?.noauth) {projectLoadFailed=true; return false}
    listenForObj('ul.media-list',(list)=>{
        if(!document.querySelector("#tabs > li.first.active")) {return} // return if "all projects" not selected
        blMyStuffMap = {}
        blMySTuff.forEach(projObj=>{blMyStuffMap[projObj.scratchId] = projObj})
        let toDelete = []
        for(let child of list.children) {
            let scratchId = getId(child)
            let blockliveProject = blMyStuffMap[scratchId]
            if(blockliveProject) {
                if(Date.now() - blockliveProject.lastTime < 1000 * 60 * 60 * 2) { // if project was edited less than 2 hours ago
                    toDelete.push(child)
                    blProjectDivs[scratchId] = child
                } else {
                    convertToBlocklive(child,blockliveProject)
                    delete blMyStuffMap[scratchId]
                }
            }
        }
        toDelete.forEach(elem=>{elem.remove()})
        let leftOver = Object.values(blMyStuffMap)
        leftOver.sort((a,b)=>{b.lastTime - a.lastTime})
        for(let projObj of leftOver) {
          console.log(projObj.scratchId)
            addProject(projObj, projObj.scratchId in blProjectDivs)
        }
    })
}


chrome.runtime.sendMessage(exId,{meta:'getUsernamePlus'},async (userData)=>{
  if(!userData.currentBlToken) {

    let newVerified=false;
addStartVerificationCallback(()=>{
  document.querySelector('#verifying')?.remove()
  document.querySelector('#unverified')?.remove()
  document.querySelector('.box-head').insertAdjacentHTML('afterend',`<div id="verifying" style="background:#ea47ff; color:white;"><img height=15 src="https://upload.wikimedia.org/wikipedia/commons/a/ad/YouTube_loading_symbol_3_%28transparent%29.gif"/> Blocklive is verifying your account ...<div>`)
})
addEndVerificationCallback((success)=>{
  document.querySelector('#verifying')?.remove()
  document.querySelector('#unverified')?.remove()
  if(success) {
    newVerified=true;
    document.querySelector('.box-head').insertAdjacentHTML('afterend',`<div id="blSuccess" style="background:#77da77; color:white;"> ✅ You're verified! <div>`)
    if(projectLoadFailed){onTabLoad()}
    setTimeout(()=>{document.querySelector('#blSuccess').remove()},1000*2)
  } else { 
    document.querySelector('.box-head').insertAdjacentHTML('afterend',`<div id="unverified" style="background:red; color:white;">⚠️ Blocklive could not verify your account. Reload the tab in a few seconds. If this issue continues, contact @ilhp10 or @rgantzos<div>`)
  }
})




    // test if they have social perms
    let socialPerms = (await (await fetch("https://scratch.mit.edu/session/?blreferer", {headers: {"X-Requested-With": "XMLHttpRequest",},})).json()).permissions.social
    if(!socialPerms) {
      document.querySelector('.box-head').insertAdjacentHTML('afterend',`<div id="unverified" style="background:red; color:white;">⚠️ Blocklive Unverified: You must verify your scratch email to use Blocklive<div>`)
    } else {
      chrome.runtime.sendMessage(exId,{meta:'verifying'}, (verifying)=>{
        if(verifying) {
  document.querySelector('#verifying')?.remove()
          document.querySelector('.box-head').insertAdjacentHTML('afterend',`<div id="verifying" style="background:#ea47ff; color:white;"><img height=15 src="https://upload.wikimedia.org/wikipedia/commons/a/ad/YouTube_loading_symbol_3_%28transparent%29.gif"/> Blocklive is verifying your account ...<div>`)
        } else {
          if(newVerified) {return}
          document.querySelector('.box-head').insertAdjacentHTML('afterend',`<div id="unverified" style="background:red; color:white;">⚠️ Blocklive could not verify your account. Reload the tab in a few seconds. If this issue continues, contact @ilhp10 or @rgantzos<div>`)
        }
      })
  }

  }
})


function addStartVerificationCallback(cb) {
  chrome.runtime.sendMessage(exId,{meta:'startVerifyCallback'},cb)
}
function addEndVerificationCallback(cb) {
  chrome.runtime.sendMessage(exId,{meta:'endVerifyCallback'},cb)
}

onTabLoad()
