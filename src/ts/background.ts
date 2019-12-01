import { get as httpGet } from "http";
import { BiasGoggles, AppData, ExtRequest, RequestMessage, ExtResponse } from "./types"
import { CodeNode } from "source-list-map";

class UserSettings {
    private method: string;
    private goggles: string;
    private limit: number;
    private badgeColor: string;

    private key = "userSettings";

    private static instance: UserSettings;

    private constructor(method: string, goggles: BiasGoggles, limit: number, badgeColor: string) {

        this.method = method;
        this.goggles = goggles;
        this.limit = limit;
        this.badgeColor = badgeColor;

        this.saveToLocalStorage();
    }

    private settingsToString(): string {
        return JSON.stringify({
            'method': this.method,
            'goggles': this.goggles,
            'limit': this.limit,
            'badgeColor': this.badgeColor
        });
    }

    public static getInstance(method: string, goggles: BiasGoggles, limit: number, badgeColor: string): UserSettings {
        if (!UserSettings.instance) {
            UserSettings.instance = new UserSettings(method, goggles, limit, badgeColor);
        }

        return UserSettings.instance;
    }

    public saveToLocalStorage(): void {
        try {
            window.localStorage.setItem(this.key, this.settingsToString());
        } catch (e) {
            //QuotaExceededError
            throw e;
        }
    }

    public updateMethod(method: string): boolean {
        this.method = method;
        try {
            this.saveToLocalStorage();
            return true;
        } catch (e) {
            return false;
        }
    }

    public updateGoggles(goggles: string): boolean {
        this.goggles = goggles;
        try {
            this.saveToLocalStorage();
            return true;
        } catch (e) {
            return false;
        }
    }

    public updateLimit(limit: number) {
        this.limit = limit;
        this.saveToLocalStorage();
    }

    public updateBadgeColor(badgeColor: string) {
        this.badgeColor = badgeColor;
        this.saveToLocalStorage();
    }

    public getMethod(): string {
        return this.method;
    }

    public getGoggles(): string {
        return this.goggles;
    }

    public getLimit(): number {
        return this.limit;
    }

    public getBadgeColor(): string {
        return this.badgeColor;
    }

}

let userSetttings = UserSettings.getInstance('pr', BiasGoggles.politicalParties, 10, '#0000FF');

class LocalStorage {

    public static save(data: string) {

        let serialized = this.serialize(data);

        window.localStorage.setItem(serialized.domain, JSON.stringify(serialized.appdata));
    }

    public static update(data: AppData) {
        window.localStorage.setItem(data.domain, JSON.stringify(data.appdata));
    }

    public static delete(domain: string) {
        window.localStorage.removeItem(domain);
    }

    public static get(domain: string): AppData {
        return {
            domain: domain,
            appdata: JSON.parse(window.localStorage.getItem(domain))
        };
    }

    private static serialize(data: string): AppData {
        let ret = JSON.parse(data);

        //the following are as returned from service
        //if anything changes in service
        //the following should be updated as well
        return {
            //@ts-ignore
            domain: ret.doc.domain,
            appdata: {
                ic: {
                    bias_score: ret.doc.ic.bias_score,
                    rank: ret.doc.ic.rank,
                    support_score: ret.doc.ic.rank,
                    vector: ret.doc.ic.vector
                },
                lt: {
                    bias_score: ret.doc.lt.bias_score,
                    rank: ret.doc.lt.rank,
                    support_score: ret.doc.lt.rank,
                    vector: ret.doc.lt.vector
                },
                pr: {
                    bias_score: ret.doc.pr.bias_score,
                    rank: ret.doc.pr.rank,
                    support_score: ret.doc.pr.rank,
                    vector: ret.doc.pr.vector
                },
                limit: userSetttings.getLimit(),
                date: new Date()
            }
        };
    }

}

function getDomainFromURL(target: string): string {

    target = target.split("/")[2];
    target = target.startsWith('www') ? target.substring(4) : target;

    return target;
}

function updateBadge(domain: string, method: string) {
    //@ts-ignore
    let score = Math.fround(parseFloat(LocalStorage.get(domain).data[method].bias_score) * 100);
    let badgeText: string = "";

    if (score == 100)
        badgeText = '100';
    else if (score < 1)
        badgeText = score.toFixed(2);
    else
        badgeText = score.toFixed(1);

    console.log(score);

    chrome.browserAction.setBadgeText({ text: badgeText });
}

function getRequestURL(target: string) {

    const prefix = 'http://139.91.183.23:3000/results?domain=';

    const suffix = '&bc=' + userSetttings.getGoggles();

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
            if (res.statusCode !== 200) {
                console.log('HTTP Status code ' + res.statusCode);
                return;
            }

            LocalStorage.save(data);
            //updateBadge(getDomainFromURL(activeTab), userSetttings.getMethod());
        });
    });
}


function getBiasData(url: string) {

    //chrome.browserAction.setBadgeBackgroundColor({ color: userSetttings.getBadgeColor() });

    if (url.startsWith('http') || url.startsWith('https')) {

        let localEntry = LocalStorage.get(getDomainFromURL(url));

        if (!localEntry.appdata) {
            console.log(url + " not found.");
            queryService(url);
        } else {
            console.log(url + " found.");

            if (localEntry.appdata.limit === 0) {
                LocalStorage.delete(url);
                queryService(url);
            } else {
                localEntry.appdata.limit--;
                LocalStorage.update(localEntry);
            }
        }
    }
}

function messageHandler(request: ExtRequest, sender: chrome.runtime.MessageSender, sendResponse: any) {

    chrome.tabs.query({ 'active': true, 'currentWindow': true, 'lastFocusedWindow': true },
        (tabs) => {
            console.log('received request');

            request.messages.forEach((message) => {

                switch (message) {
                    case RequestMessage.GET_STATS:
                        let domainData = LocalStorage.get(getDomainFromURL(tabs[0].url));
                        if (!domainData) {
                            sendResponse(new ExtResponse(null, getDomainFromURL(tabs[0].url)));
                        } else {
                            sendResponse(new ExtResponse(LocalStorage.get(getDomainFromURL(tabs[0].url)), request.extra));
                        }
                        break;
                    case RequestMessage.SET_AS_DEFAULT:
                        if (userSetttings.updateMethod(request.extra))
                            sendResponse(new ExtResponse(null, 1));
                        else
                            sendResponse(new ExtResponse(null, 0));
                        break;
                    case RequestMessage.GET_DEFAULT_STATS:
                        getBiasData(<string>request.extra);
                        //only on domains as for now...
                        let data = LocalStorage.get(getDomainFromURL(request.extra));
                        let method = userSetttings.getMethod();
                        sendResponse(new ExtResponse(data, method));
                        break;
                    default:
                        throw new Error('Unknown request ' + message);
                }
            });
        }
    );

    return true;
}

try {
    chrome.runtime.onMessage.addListener(messageHandler);
    chrome.webRequest.onCompleted.addListener((details) => {
        getBiasData(details.url);
    }, { urls: ["<all_urls>"], types: ["main_frame"] });
} catch (e) {
    console.log(e);
}

console.log('installed.....');