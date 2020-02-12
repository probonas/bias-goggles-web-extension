import { AppData, DomainData, UserSettings, Score, OffOptions, MinMaxAvgScores, INVALID_URL, EXTENSION_DISABLED } from './types';
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

    export function unwrapAppDataObject(obj: AppData): null | any {
        if (obj === null)
            return null;
        else {
            let key = Object.keys(obj)[0];
            return obj[key];
        }
    }

    export function areScoreDataObsolete(score: Score): boolean {
        let now = new Date();
        let scoreDate = new Date(score.date);

        if (now > scoreDate)
            return true;
        else
            return false;
    }

    export function queryServiceAndSet(domain: string, goggles: string, callback: (data?: DomainData, score?: Score) => void) {
        service.query(domain, goggles, (domainDataObj, scoreDataObj) => {
            extension.storage.set(domainDataObj, () => {
                extension.storage.set(scoreDataObj, () => {
                    callback(unwrapAppDataObject(domainDataObj), unwrapAppDataObject(scoreDataObj));
                });
            });
        });
    }

    export function updateHitCounter(domainData: DomainData, scoreData: Score, callback: (updatedData: Score) => void) {
        scoreData.hits++;
        let appdata = {} as AppData;
        appdata[domainData.scoreIndex] = scoreData;

        extension.storage.set(appdata, () => {
            callback(scoreData);
        });
    }

    export function updateScoreIndices(dataKey: string, domainData: DomainData, newIndices: Array<number>, callback: (updatedData: DomainData) => void) {
        let updated = {} as AppData;
        domainData.prevIndices = newIndices;

        updated[dataKey] = domainData;

        extension.storage.set(updated, () => {
            callback(domainData);
        });

    }

    export function savePrevScoreIndices(domainData: DomainData, callback: (savedIndices: Array<number>) => void) {
        domainData.prevIndices.push(domainData.scoreIndex);
        callback(domainData.prevIndices);
    }

    export function getBiasDataForGoggles(url: string, goggles: string, callback?: (data: Score, scoreIndex: number) => void) {
        userSettings.get(settings => {
            if (settings.enabled) {
                if (url) {
                    extension.storage.getLatestScoreData(url, goggles, callback);
                } else {
                    callback(null, INVALID_URL);
                }
            } else {
                callback(null, EXTENSION_DISABLED);
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

    export function filterScoreData(heystack: Map<number, Score>, from: Date, to: Date): Map<number, Score> | null {

        for (let k of heystack.keys())
            if (heystack.get(k).date < from.getTime() || heystack.get(k).date > to.getTime())
                heystack.delete(k);

        if (heystack.size === 0) {
            return null;
        } else {
            return heystack;
        }

    }

    export function filterDomainData(needles: Map<number, Score>, heystack: Map<number, string>): Map<number, string> | null {

        for (let k of heystack.keys())
            if (!needles.has(k))
                heystack.delete(k);

        if (heystack.size === 0) {
            return null;
        } else {
            return heystack;
        }
    }

    export function calculateMinMaxAvgScores(scores: Map<number, Score>, goggle: string, method: string): MinMaxAvgScores {
        let minMaxAvgData: MinMaxAvgScores = {};

        if (scores === null)
            return null;

        scores.forEach((scoreObj) => {

            if (minMaxAvgData[scoreObj.date] !== undefined &&
                minMaxAvgData[scoreObj.date][goggle] !== undefined) {

                let entry = minMaxAvgData[scoreObj.date][goggle];

                if (entry[method].maxBias < scoreObj.scores[method].bias_score)
                    entry[method].maxBias = scoreObj.scores[method].bias_score;

                if (entry[method].minBias > scoreObj.scores[method].bias_score)
                    entry[method].minBias = scoreObj.scores[method].bias_score;

                entry[method].avgBias += scoreObj.scores[method].bias_score;

                if (entry[method].maxSupport < scoreObj.scores[method].support_score)
                    entry[method].maxSupport = scoreObj.scores[method].support_score;

                if (entry[method].minSupport > scoreObj.scores[method].support_score)
                    entry[method].minSupport = scoreObj.scores[method].support_score;

                entry[method].avgSupport += scoreObj.scores[method].support_score;
                entry[method].totalEntries++;
            } else {
                minMaxAvgData[scoreObj.date] = {};
                minMaxAvgData[scoreObj.date][goggle] = {};

                let newEntry = minMaxAvgData[scoreObj.date][goggle];

                newEntry[method] = {
                    maxBias: scoreObj.scores[method].bias_score,
                    minBias: scoreObj.scores[method].bias_score,
                    avgBias: scoreObj.scores[method].bias_score,

                    maxSupport: scoreObj.scores[method].support_score,
                    minSupport: scoreObj.scores[method].support_score,
                    avgSupport: scoreObj.scores[method].support_score,

                    totalEntries: 1
                }

            }

        });

        let dateKeys = Object.keys(minMaxAvgData);

        for (let date in dateKeys) {
            let d = Number.parseInt(dateKeys[date]);
            let entry = minMaxAvgData[d][goggle][method];

            entry.avgBias = entry.avgBias / entry.totalEntries;
            entry.avgSupport = entry.avgSupport / entry.totalEntries;
        }

        return minMaxAvgData;
    }

    export function getTopSupportive(scores: Map<number, Score>, goggle: string, method: string): Array<Map<number, Score>> {

        let splittedPerDay = new Array<Map<number, Score>>();
        let perDayMap = new Map<number, Score>();

        let date: number = null;

        scores.forEach((value, key) => {
            if (date === null)
                date = value.date;

            if (date === value.date) {
                perDayMap.set(key, value);
            } else {
                date = value.date;
                splittedPerDay.push(perDayMap);
                perDayMap = new Map<number, Score>();
            }
        });

        splittedPerDay = splittedPerDay.map((perDayScoreMap) => {
            return new Map([...perDayScoreMap].sort((a, b) => {
                return b[1].scores[method].support_score - a[1].scores[method].support_score;
            }));
        });

        splittedPerDay = splittedPerDay.map((perDayScoreMap) => {
            return new Map([...perDayScoreMap].slice(0,10));
        });

        splittedPerDay = splittedPerDay.map((perDayScoreMap) => {
            return new Map([...perDayScoreMap].sort((a, b) => {
                return b[1].scores[method].bias_score - a[1].scores[method].bias_score;
            }));
        });

        return splittedPerDay;
    }

    export function makeKey(domain: string, goggles: string): string {
        return goggles + ' ' + domain;
    }
}

