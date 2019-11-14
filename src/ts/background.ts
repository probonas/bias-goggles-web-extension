import { get as httpGet } from "http";

enum BiasScores {
    independentCascade = "ic",
    linearThreshold = "lt",
    pagerank = "pr"
}

enum BiasGoggles {
    politicalParties = "political-parties",
    footballTeams = "sport-teams"
}

let selectedScore = BiasScores.pagerank;            //default
let selectedGoggles = BiasGoggles.politicalParties; //default
let lifespan = 10; 

function getDomainFromURL(target : string) : string{
    
    target = target.split("/")[2];
    target = target.startsWith('www') ? target.substring(4) : target;
    
    return target;
}

function getRequestURL(target : string){

    const prefix = 'http://139.91.183.23:3000/results?domain=';

    const suffix = '&bc=' + selectedGoggles;

    //may be reduntant at this point
    target = getDomainFromURL(target);

    return prefix + target + suffix;
}

function queryService(activeTab : string) {
    let data : any = '';
    console.log('requesting: ' + activeTab);

    httpGet(getRequestURL(activeTab), res => {

        console.log('Status code: ' + res.statusCode);
    
        res.on('data',chunk => {
            data += chunk;
        });

        res.on('close', () =>{
            data = JSON.parse(data);
            //TODO: if data is not defined => error
            let toStorage: Object = {
                "ic" : data.doc.ic,
                "lt" : data.doc.lt,
                "pr" : data.doc.pr,
                "life" : lifespan
            };

            console.log(data.doc.domain);
            console.log(toStorage);
            console.log('end of request....');
            
            //@ts-ignore
            chrome.browserAction.setBadgeText({text: (parseFloat(data.doc.pr.bias_score) * 100).toFixed(2)});
            //@ts-ignore
            let domain : string =  data.doc.domain;
            window.localStorage.setItem(domain, JSON.stringify(toStorage));          
        });
    });
}


function getBiasData(){

    chrome.browserAction.setBadgeBackgroundColor({color: '#0000FF'});

    chrome.tabs.query({'active' : true}, 
        tabs => {

            let activeTab : string = '';

            if(typeof tabs[0].url === 'string' )
                activeTab = tabs[0].url;
            else{
                throw new Error('no-active-tab-found');
            }

            let  domain = getDomainFromURL(activeTab);
            let entry = window.localStorage.getItem(domain);

            if( !entry ) {
                console.log(activeTab + " not found.");
                queryService(activeTab);
            }else{
                console.log(activeTab + " found.");
                
                entry = JSON.parse(entry);
                //@ts-ignore
                if( entry['life'] === 0 ){
                    //data considered too old.
                    window.localStorage.removeItem(domain);
                    //new request
                    queryService(activeTab);
                }else{
                    //@ts-ignore
                    entry['life']--;
                    window.localStorage.setItem(domain,JSON.stringify(entry));
                }

                //console.log(entry);
            }
    });
}

try{
    
    chrome.runtime.onMessage.addListener(
        (request, sender, sendRespone) => {
            chrome.tabs.query({'active' : true}, 
                (tabs) => {
                    //@ts-ignore
                    if( request.response_content === "bias-stats" ){
                        //@ts-ignore
                        let entry = window.localStorage.getItem(getDomainFromURL(tabs[0].url));
                        sendRespone(entry);
                    }
                }
            );
            return true;
        }
    );

    //@ts-ignore
    chrome.webRequest.onCompleted.addListener(getBiasData, {urls: ["<all_urls>"] ,types: ["main_frame"]});
}catch(e){
    console.log(e);
}

window.localStorage.setItem("score", selectedScore);
console.log('Default bias score is set to ' + selectedScore);

window.localStorage.setItem("goggles", selectedGoggles);
console.log('Default bias goggles are set to ' + selectedGoggles);

console.log('installed.....');