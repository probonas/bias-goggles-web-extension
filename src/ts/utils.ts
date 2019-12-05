import { AppDataMap, DomainData } from './types';
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

    export function getBiasData(url: string, callback?: (data: DomainData) => void) {

        //chrome.browserAction.setBadgeBackgroundColor({ color: userSettings.data.badgeColor });

        if (url.startsWith('http') || url.startsWith('https')) {
            let domain = getDomainFromURL(url);

            extension.storage.get(domain, (item: DomainData) => {

                if (item === null) {
                    console.log(url + " not found.");
                    service.query(domain, (data: any) => {
                        extension.storage.set(data, () => {
                            extension.storage.get(domain, callback);
                        });
                    });
                } else {
                    console.log(url + " found.");

                    if (item.limit === 0) {
                        extension.storage.remove(domain, () => {
                            extension.storage.set({ domain: item }, () => {
                                callback(item);
                            });
                        });
                    } else {
                        item.limit--;
                        extension.storage.set({ domain: item }, () => {
                            callback(item);
                        });
                    }
                }
            });
        }
    }

    export function getDataForActiveTab(callback: (domain: string, data: DomainData) => void): void {
        chrome.tabs.query({ 'active': true, 'currentWindow': true, 'lastFocusedWindow': true },
            (tabs) => {
                extension.storage.get(utils.getDomainFromURL(tabs[0].url), (items) => {

                    if (items === null) {
                        callback(tabs[0].url, null);
                    } else {
                        let domain = utils.getDomainFromURL(tabs[0].url);
                        callback(domain, items);
                    }
                });
            });
    }
}

