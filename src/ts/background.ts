import { get } from "http";

function getUrl(target : string) : string{
    const prefix = 'http://139.91.183.23:3000/results?domain=';

    const suffix = '&bc=political-parties';
    
    target = target.split("/")[2];
    target = target.startsWith('www') ? target.substring(4) : target;
            
    return prefix + encodeURIComponent(target) + suffix;
}

function query(){
    let activeTab : string = '';
    let data : any = '';

    chrome.browserAction.setBadgeBackgroundColor({color: '#0000FF'});

    chrome.tabs.query({'active' : true}, 
        tabs => {

            if(typeof tabs[0].url === 'string' )
                activeTab = tabs[0].url;
            else
               activeTab = 'no-active-tab-found';
        
            console.log('requesting.....');
            console.log(getUrl(activeTab));
    
            get(getUrl(activeTab), res => {
    
                console.log('Status code: ' + res.statusCode);
            
                res.on('data',chunk => {
                    data += chunk;
                });
    
                res.on('close', () =>{
                    data = JSON.parse(data);
                    console.log(data);
                    console.log('end of request....');
                    
                    //@ts-ignore
                    chrome.browserAction.setBadgeText({text: (parseFloat(data.doc.pr.bias_score) * 100).toString()});
                });
            });
    });
    
}

chrome.browserAction.onClicked.addListener(query);

console.log('installed.....');
