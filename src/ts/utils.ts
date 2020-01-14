import { AppData, DomainData, UserSettings, Score, OffOptions } from './types';
import { extension } from "./storage";
import { service } from './service';
import { userSettings } from './usersettings';

export namespace utils {

    export function getDomainFromURL(target: string): string {

        target = target.split("/")[2];
        target = target.startsWith('www') ? target.substring(4) : target;

        return target;
    }

    export function refreshDataForDomain(domain: string, goggles: string, domainData: DomainData, callback: (domainData: DomainData) => void) {

        if (domainData === null) {
            console.log(goggles + '-' + domain + " not found.");

            service.query(domain, goggles, (data: any) => {
                extension.storage.set(data, () => {
                    callback(domainData);
                });
            });
        } else if (domainData.limit === 0) {
            console.log(goggles + '-' + domain + " found. But data is considered obsolete. Updating scoreIndex!");

            service.query(domain, goggles, (data: any) => {
                extension.storage.set(data, () => {
                    callback(domainData);
                });
            });
        } else {
            console.log(goggles + '-' + domain + " found.");
            domainData.limit--;
            let appdata = {} as AppData;
            appdata[goggles + ' ' + domain] = domainData;

            extension.storage.set(appdata, () => {
                callback(domainData);
            });
        }

    }

    export function getBiasDataForGoggles(url: string, goggles: string, callback?: (data: Score, scoreIndex: number) => void) {
        userSettings.get(settings => {
            if (settings.enabled) {
                if (url.startsWith('http') || url.startsWith('https')) {
                    let domain = getDomainFromURL(url);

                    extension.storage.getScoresForDomain(domain, goggles, callback);
                }
            } else {
                //-1 if disabled
                callback(null, -1);
            }
        });
    }

    export function getActiveTab(callback: (domain: string) => void) {
        chrome.tabs.query({ 'active': true, 'currentWindow': true, 'lastFocusedWindow': true },
            (tabs) => {
                callback(tabs[0].url);
            });
    };

    export function disableExtension(option: OffOptions, callback?: () => void,
        reEnableCallback?: () => void) {
        userSettings.get((settings) => {
            settings.enabled = false;
            chrome.browserAction.setIcon({
                path: {
                    "32": "icons/icon-disabled-32.png"
                }
            });

            if (option === OffOptions.ONE_HOUR) {
                chrome.alarms.clear('turn-on-bg');

                chrome.alarms.create('turn-on-bg', {
                    delayInMinutes: 60
                });
                settings.forceOn = true;

                chrome.alarms.onAlarm.addListener((alarm) => {
                    if (alarm.name == 'turn-on-bg') {
                        reEnableCallback();
                    }
                });
            } else if (option === OffOptions.TWO_HOURS) {
                chrome.alarms.clear('turn-on-bg');

                chrome.alarms.create('turn-on-bg', {
                    delayInMinutes: 120
                });
                settings.forceOn = true;
                chrome.alarms.onAlarm.addListener((alarm) => {
                    if (alarm.name == 'turn-on-bg')
                        reEnableCallback();
                });
            } else if (option === OffOptions.SESSION_ONLY) {
                chrome.alarms.clear('turn-on-bg');

                settings.forceOn = true;
            }

            userSettings.update(settings, () => {
                updateBadge(settings);
                callback();
            });
        });
    }

    export function enableExtension(callback?: () => void) {
        userSettings.get((settings) => {
            settings.enabled = true;
            chrome.browserAction.setIcon({
                path: {
                    "32": "icons/icon-32.png"
                }
            });
            chrome.alarms.clear('tun-on-bg');
            userSettings.update(settings, () => {
                updateBadge(settings);
                callback();
            });
        });
    }

    function updateBadge(settings: UserSettings) {
        if (settings.enabled) {
            chrome.browserAction.setBadgeBackgroundColor({ color: '#3CB371' });
            chrome.browserAction.setBadgeText({ text: 'on' });
        } else {
            chrome.browserAction.setBadgeBackgroundColor({ color: '#f08080' });
            chrome.browserAction.setBadgeText({ text: 'off' });
        }
    }

    export function showCorrectBadge() {
        userSettings.get((settings) => {
            updateBadge(settings);
        });
    }

}

