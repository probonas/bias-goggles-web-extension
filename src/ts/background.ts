import { get as httpGet } from "http";
import { BiasScoresMethods, BiasGoggles, AppData, ExtRequest, RequestMessage, ExtResponse } from "./types"

class UserSettings {
    private method: string;
    private goggles: string;
    private limit: number;
    private badgeColor: string;

    private key = "userSettings";

    private static instance: UserSettings;

    private constructor(method: BiasScoresMethods, goggles: BiasGoggles, limit: number, badgeColor: string) {

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

    public static getInstance(method: BiasScoresMethods, goggles: BiasGoggles, limit: number, badgeColor: string): UserSettings {
        if (!UserSettings.instance) {
            UserSettings.instance = new UserSettings(method, goggles, limit, badgeColor);
        }

        return UserSettings.instance;
    }

    public saveToLocalStorage(): void {
        window.localStorage.setItem(this.key, this.settingsToString());
    }

    public updateMethod(method: string) {
        this.method = method;
        this.saveToLocalStorage();
    }

    public updateGoggles(goggles: string) {
        this.goggles = goggles;
        this.saveToLocalStorage();
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

let userSetttings = UserSettings.getInstance(BiasScoresMethods.pagerank, BiasGoggles.politicalParties, 10, '#0000FF');

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
            if (res.statusCode !== 200)
                throw new Error('HTTP Status code' + res.statusCode);

            LocalStorage.save(data);
            updateBadge(getDomainFromURL(activeTab), userSetttings.getMethod());
        });
    });
}


function getBiasData() {

    chrome.browserAction.setBadgeBackgroundColor({ color: userSetttings.getBadgeColor() });

    chrome.tabs.query({ 'active': true },
        tabs => {

            let activeTab: string = '';

            if (typeof tabs[0].url === 'string')
                activeTab = tabs[0].url;
            else {
                throw new Error('no-active-tab-found');
            }

            let localEntry = LocalStorage.get(getDomainFromURL(activeTab));

            if (!localEntry.appdata) {
                console.log(activeTab + " not found.");
                queryService(activeTab);
            } else {
                console.log(activeTab + " found.");

                if (localEntry.appdata.limit === 0) {
                    LocalStorage.delete(activeTab);
                    queryService(activeTab);
                } else {
                    localEntry.appdata.limit--;
                    LocalStorage.update(localEntry);
                }
            }
        });
}

function requestHandler(request: ExtRequest, sender: chrome.runtime.MessageSender, sendResponse: any) {

    chrome.tabs.query({ 'active': true },
        (tabs) => {
            console.log('received request');

            request.messages.forEach((message) => {

                switch (message) {
                    case RequestMessage.GET_STATS:
                        sendResponse(new ExtResponse(LocalStorage.get(getDomainFromURL(tabs[0].url)), request.extra));
                        break;
                    case RequestMessage.SET_AS_DEFAULT:
                        userSetttings.updateMethod(request.extra);
                        break;
                }
            });
        }
    );

    return true;
}

try {
    chrome.runtime.onMessage.addListener(requestHandler);
    chrome.webRequest.onCompleted.addListener(getBiasData, { urls: ["<all_urls>"], types: ["main_frame"] });
} catch (e) {
    console.log(e);
}

console.log('installed.....');