import { AppData, DomainData, UserSettings, Score } from './types';
import { extension } from "./storage";
import { service } from './service';
import { userSettings } from './usersettings';

export namespace utils {

    export function getDomainFromURL(target: string): string {

        target = target.split("/")[2];
        target = target.startsWith('www') ? target.substring(4) : target;

        return target;
    }

    export function refreshDataForDomain(domain: string, domainData: DomainData, callback: (domainData: DomainData) => void) {

        if (domainData === null) {
            console.log(domain + " not found.");

            service.query(domain, (data: any) => {
                extension.storage.set(data, () => {
                    callback(domainData);
                });
            });
        } else if (domainData.limit === 0) {
            console.log(domain + " found. But data is considered obsolete. Updating scoreIndex!");

            service.query(domain, (data: any) => {
                extension.storage.set(data, () => {
                    callback(domainData);
                });
            });
        } else {
            console.log(domain + " found.");

            domainData.limit--;
            let appdata = {} as AppData;
            appdata[domain] = domainData;

            extension.storage.set(appdata, () => {
                callback(domainData);
            });
        }

    }

    export function getBiasData(url: string, callback?: (data: Score, scoreIndex: number) => void) {
        userSettings.get(settings => {
            if (settings.enabled) {
                if (url.startsWith('http') || url.startsWith('https')) {
                    let domain = getDomainFromURL(url)

                    extension.storage.getScoresForDomain(domain, callback);
                }
            }
        });
    }

    export function getDataForActiveTab(callback: (domain: string, data: DomainData) => void): void {
        chrome.tabs.query({ 'active': true, 'currentWindow': true, 'lastFocusedWindow': true },
            (tabs) => {
                extension.storage.getDomainData(utils.getDomainFromURL(tabs[0].url), (items) => {
                    if (callback === undefined)
                        return;

                    if (items === null) {
                        callback(tabs[0].url, null);
                    } else {
                        let domain = utils.getDomainFromURL(tabs[0].url);
                        callback(domain, items);
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
        userSettings.update(settings, updateBadge);
    }

    function enableExtension(settings: UserSettings) {
        settings.enabled = true;
        chrome.browserAction.setIcon({
            path: {
                "32": "icons/icon-32.png"
            }
        });
        userSettings.update(settings, updateBadge);
    }

    export function updateBadge() {
        userSettings.get((settings) => {
            if (settings.enabled) {
                chrome.browserAction.setBadgeBackgroundColor({ color: '#3CB371' });
                chrome.browserAction.setBadgeText({ text: 'on' });
            } else {
                chrome.browserAction.setBadgeBackgroundColor({ color: '#f08080' });
                chrome.browserAction.setBadgeText({ text: 'off' });
            }
        });
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

