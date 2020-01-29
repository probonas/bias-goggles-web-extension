import { AppData, DomainData, UserSettings, Score, OffOptions } from './types';
import { extension } from "./storage";
import { service } from './service';
import { userSettings } from './usersettings';

export namespace utils {

    export function getDomainFromURL(target: string): string {

        let prefixes = ['https://www.', 'http://www.', 'https://', 'http://', 'www.'];

        for (let i = 0; i < prefixes.length; i++) {

            while (target.endsWith('/'))
                target = target.substr(0, target.length - 1);

            if (target.startsWith(prefixes[i])) {
                target = target.substring(prefixes[i].length);

                if (target.includes('/')) {
                    return target.split('/')[0];
                } else {
                    return target;
                }
            }
        }

        return null;
    }

    export function refreshDataForDomain(domain: string, goggles: string, domainData: DomainData, callback: () => void) {

        if (domainData === null) {
            console.log(goggles + ' ' + domain + " not found.");

            service.query(domain, goggles, (domainData, scoreData) => {
                extension.storage.set(domainData, () => {
                    extension.storage.set(scoreData, () => {
                        callback();
                    });
                });
            });
        } else if (domainData.limit === 0) {
            console.log(goggles + ' ' + domain + " found. But data is considered obsolete. Updating scoreIndex!");

            service.query(domain, goggles, (domainData, scoreData) => {
                extension.storage.set(domainData, () => {
                    extension.storage.set(scoreData, () => {
                        callback();
                    });
                });
            });
        } else {
            console.log(goggles + '-' + domain + " found.");
            domainData.limit--;
            let appdata = {} as AppData;
            appdata[goggles + ' ' + domain] = domainData;

            extension.storage.set(appdata, () => {
                callback();
            });
        }

    }

    export function getBiasDataForGoggles(url: string, goggles: string, callback?: (data: Score, scoreIndex: number) => void) {
        userSettings.get(settings => {
            if (settings.enabled) {
                if (url) {
                    extension.storage.getScoresForDomain(url, goggles, callback);
                } else {
                    callback(null, -2);
                }
            } else {
                //-1 if disabled
                callback(null, -1);
            }
        });
    }

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

    export function getScoreData(from: Date, to: Date, callback: (data: Score[] | null) => void) {

        extension.storage.getAllDomainData((data) => {

            let keys = Object.keys(data);
            let scores = new Array<Score>();

            for (let key in keys) {
                let score: Score;

                if ((<Score>data[key]).scores !== undefined) {
                    score = <Score>data[key];

                    if (score.date >= from.getTime() && score.date <= to.getTime()) {
                        scores.push(score);
                    }

                    if (score.date > to.getTime()) {
                        break;
                    }

                }
            }

            if (scores.length === 0) {
                callback(null);
            } else {
                callback(scores);
            }

        });
    }

}

