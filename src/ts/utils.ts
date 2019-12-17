import { AppDataMap, DomainData, UserSettings } from './types';
import { extension } from "./storage";
import { service } from './service';
import { userSettings } from './usersettings';

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

        userSettings.get(settings => {
            if (settings.enabled) {
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
                                        if (callback !== undefined)
                                            callback(item);
                                    });
                                });
                            } else {
                                item.limit--;
                                extension.storage.set({ domain: item }, () => {
                                    if (callback !== undefined)
                                        callback(item);
                                });
                            }
                        }
                    });
                }
                return true;
            } else {
                return false;
            }
        });
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

    export function removeExpiredDomains(except?: string[]): void {

        userSettings.get((settings) => {
            extension.storage.getAll((items: AppDataMap) => {

                let keys = Object.keys(items);
                let now = new Date();

                for (let i = 0; i < keys.length; i++) {

                    let key = keys[i];
                    if (key in except)
                        continue;

                    let todel = false;

                    if (now.getFullYear() - items[key].date.getFullYear() > 1) {
                        todel = true;
                    } else if (now.getMonth() - items[key].date.getMonth() > 1) {
                        todel = true;
                    } else if (now.getDay() - items[key].date.getDay() > settings.deleteAfter) {
                        todel = true;
                    }

                    if (todel)
                        extension.storage.remove(key);
                }
            });
        });
    }

    function disableExtension(settings: UserSettings) {
        settings.enabled = false;
        chrome.browserAction.setIcon({
            path: {
                "32": "icons/icon-disabled-32.png"
            }
        });
        userSettings.update(settings);
    }

    function enableExtension(settings: UserSettings) {
        settings.enabled = true;
        chrome.browserAction.setIcon({
            path: {
                "32": "icons/icon-32.png"
            }
        });
        userSettings.update(settings);
    }

    export function toggle() {
        userSettings.get((settings) => {
            if (settings.enabled) {
                disableExtension(settings);
            } else {
                enableExtension(settings);
            }
        });
    }
}

