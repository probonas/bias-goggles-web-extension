import { get as httpGet } from "http";
import { BiasScoresMethods, BiasGoggles, ServiceResponse, Serializable, ExtRequestTypes, ExtRequest } from "./types"
import { basename } from "path";
import { log } from "util";

class UserSettings {
    method: string;
    goggles: string;
    limit: number;
    badgeColor: string;

    private key = "userSettings";

    constructor(method: BiasScoresMethods, goggles: BiasGoggles, limit: number, badgeColor: string) {
        this.method = method;
        this.goggles = goggles;
        this.limit = limit;
        this.badgeColor = badgeColor;
    }

    public getSettings(): string {
        return JSON.stringify({
            'method': this.method,
            'goggles': this.goggles,
            'limit': this.limit,
            'badgeColor': this.badgeColor
        });
    }

    public saveToLocalStorage(): void {
        window.localStorage.setItem(this.key, this.getSettings());
    }

}

let userSetttings = new UserSettings(BiasScoresMethods.independentCascade,
    BiasGoggles.politicalParties, 10, '#0000FF');

userSetttings.saveToLocalStorage();

class LocalStorage {

    public static save(data: string) {

        let serialized = this.serialize(data);

        window.localStorage.setItem(serialized.key, JSON.stringify(serialized.value));
    }

    public static update(data: Serializable) {
        window.localStorage.setItem(data.key, JSON.stringify(data.value));
    }

    public static delete(domain: string) {
        window.localStorage.removeItem(domain);
    }

    public static get(domain: string): Serializable {
        return {
            key: domain,
            value: JSON.parse(window.localStorage.getItem(domain))
        };
    }

    private static serialize(data: string): Serializable {
        let ret: ServiceResponse = JSON.parse(data);

        return {
            key: ret.doc.domain,
            value: {
                ic: ret.doc.ic,
                lt: ret.doc.lt,
                pr: ret.doc.pr,
                limit: userSetttings.limit
            }
        };
    }

}
function getDomainFromURL(target : string) : string{
    
    target = target.split("/")[2];
    target = target.startsWith('www') ? target.substring(4) : target;
    
    return target;
}

function updateBadge(domain: string, method: string) {
    //@ts-ignore
    let score = Math.fround(parseFloat(LocalStorage.get(domain).value[method].bias_score) * 100);
    let badgeText : string = "";
    
    if( score == 100 )
        badgeText = '100';
    else if( score < 1)
        badgeText = score.toFixed(2);
    else
        badgeText = score.toFixed(1);
    
    console.log(score);

    chrome.browserAction.setBadgeText({ text: badgeText });
}

function getRequestURL(target: string) {

    const prefix = 'http://139.91.183.23:3000/results?domain=';

    const suffix = '&bc=' + userSetttings.goggles;

    return prefix + encodeURIComponent(target) + suffix;
}

function queryService(activeTab: string) {

    let data: any = '';
    console.log('requesting: ' + activeTab);

    httpGet(getRequestURL(getDomainFromURL(activeTab)), res => {

        res.on('data', chunk => {
            data += chunk;
        });

        res.on('close', () => {
            if (res.statusCode !== 200)
                throw new Error('HTTP Status code' + res.statusCode);

            LocalStorage.save(data);
            updateBadge(getDomainFromURL(activeTab), userSetttings.method);
        });
    });
}


function getBiasData() {

    chrome.browserAction.setBadgeBackgroundColor({ color: userSetttings.badgeColor });

    chrome.tabs.query({ 'active': true },
        tabs => {

            let activeTab: string = '';

            if (typeof tabs[0].url === 'string')
                activeTab = tabs[0].url;
            else {
                throw new Error('no-active-tab-found');
            }

            let localEntry = LocalStorage.get(getDomainFromURL(activeTab));

            if (!localEntry.value) {
                console.log(activeTab + " not found.");
                queryService(activeTab);
            } else {
                console.log(activeTab + " found.");

                if (localEntry.value.limit === 0) {
                    LocalStorage.delete(activeTab);
                    queryService(activeTab);
                } else {
                    localEntry.value.limit--;
                    LocalStorage.update(localEntry);
                }
            }
        });
}

function handleRequest(request: ExtRequest, sender: chrome.runtime.MessageSender, sendRespone: any) {

    chrome.tabs.query({ 'active': true },
        (tabs) => {

            if (request.type === ExtRequestTypes.bias_stats) {
                let localData = JSON.parse(window.localStorage.getItem(getDomainFromURL(tabs[0].url)));
                sendRespone({ data: localData[userSetttings.method], method: userSetttings.method });
            } else {
                throw new Error('Uknown request type ' + request.type);
            }

        }
    );

    return true;
}

try {
    chrome.runtime.onMessage.addListener(handleRequest);
    chrome.webRequest.onCompleted.addListener(getBiasData, { urls: ["<all_urls>"], types: ["main_frame"] });
} catch (e) {
    console.log(e);
}

console.log('installed.....');