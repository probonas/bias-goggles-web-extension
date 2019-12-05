import { AppData, DomainData } from './types';
import { extension } from "./storage";
import { service } from './service';

export namespace utils {

    export function getDomainFromURL(target: string): string {

        target = target.split("/")[2];
        target = target.startsWith('www') ? target.substring(4) : target;

        return target;
    }

    export function updateBadge(domain: string, method: string) {
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

    export function getBiasData(url: string, callback?: () => void) {

        //chrome.browserAction.setBadgeBackgroundColor({ color: userSettings.data.badgeColor });

        if (url.startsWith('http') || url.startsWith('https')) {
            let domain = getDomainFromURL(url);

            extension.storage.get(domain, (items) => {
                console.error('storage get returned ' + items.length + ' number of items!');
                console.error(items);

                if (Object.keys(items).length === 0) {
                    console.log(url + " not found.");
                    service.query(domain);
                } else {
                    console.log(url + " found.");
                    let data: AppData = <AppData>items;

                    if (data[domain].limit === 0) {
                        extension.storage.remove(domain);
                        service.query(domain);
                    } else {
                        data[domain].limit--;
                        extension.storage.set(data);
                    }
                }
            });
        }
    }

    export function getDataForActiveTab(method: string, callback: (domain: string, data: DomainData) => void): void {
        chrome.tabs.query({ 'active': true, 'currentWindow': true, 'lastFocusedWindow': true },
            (tabs) => {
                extension.storage.get(utils.getDomainFromURL(tabs[0].url), (items) => {

                    if (Object.keys(items).length === 0) {
                        callback(tabs[0].url, null);
                    } else {
                        let domain = utils.getDomainFromURL(tabs[0].url);
                        //@ts-ignore
                        callback(domain, items[domain][method]);
                    }
                });
            });
    }
}

