import { AppData, DomainData, UserSettings, Score, OffOptions, MinMaxAvgScores } from './types';
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
        } else {
            extension.storage.getScoreData(domainData.scoreIndex, (score, index) => {
                let now = new Date();
                let scoreDate = new Date(score.date);

                if (now.getFullYear() > scoreDate.getFullYear() ||
                    now.getMonth() > scoreDate.getMonth() ||
                    now.getDay() > scoreDate.getDay()) {
                    console.log(goggles + ' ' + domain + " found. But data is considered obsolete. Updating scoreIndex!");

                    domainData.prevIndices.push(domainData.scoreIndex);
                    let oldIndices = domainData.prevIndices;

                    service.query(domain, goggles, (domainData, scoreData) => {
                        (<DomainData>(Object.values(domainData)[0])).prevIndices = oldIndices;
                        extension.storage.set(domainData, () => {
                            extension.storage.set(scoreData, () => {
                                callback();
                            });
                        });
                    });
                } else {
                    console.log(goggles + ' ' + domain + " found.");
                    score.hits++;
                    let appdata = {} as AppData;
                    appdata[index] = score;

                    extension.storage.set(appdata, () => {
                        callback();
                    });
                }
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

    export function filterScoreData(data: Map<number, Score>, from: Date, to: Date): Map<number, Score> | null {
        let scores = new Map<number, Score>();

        data.forEach((value, key) => {
            if (value.date >= from.getTime() && value.date <= to.getTime())
                scores.set(key, value);
        });

        if (scores.size === 0) {
            return null;
        } else {
            return scores;
        }

    }

    export function filterDomainData(indices: Map<number, Score>, domainData: Map<string, DomainData>): Map<string, DomainData> | null {
        let domains = new Map<string, DomainData>();

        indices.forEach((value, scoreIndex) => {
            for (let [key, value] of domainData) {
                if (scoreIndex === value.scoreIndex) {
                    domains.set(key, value);
                    break;
                } else if (value.prevIndices.includes(scoreIndex)) {
                    domains.set(key, value);
                    break;
                }

            }

        });

        if (domains.size === 0) {
            return null;
        } else {
            return domains;
        }
    }

    export function calculateMinMaxAvgScoresPerGoggleAndMethod(scores: Map<number, Score>): MinMaxAvgScores {
        let minMaxAvgData: MinMaxAvgScores = {};

        if (scores === null || scores.size === 0) {
            return null;
        }

        let methods = Object.keys((<Score>scores.values().next().value).scores)

        scores.forEach((scoreObj) => {

            if (minMaxAvgData[scoreObj.date] !== undefined &&
                minMaxAvgData[scoreObj.date][scoreObj.goggle] !== undefined) {
                let entry = minMaxAvgData[scoreObj.date][scoreObj.goggle];

                for (let method in methods) {
                    let m = methods[method];

                    if (entry[m].maxBias < scoreObj.scores[m].bias_score)
                        entry[m].maxBias = scoreObj.scores[m].bias_score;

                    if (entry[m].minBias > scoreObj.scores[m].bias_score)
                        entry[m].minBias = scoreObj.scores[m].bias_score;

                    entry[m].avgBias += scoreObj.scores[m].bias_score;

                    if (entry[m].maxSupport < scoreObj.scores[m].support_score)
                        entry[m].maxSupport = scoreObj.scores[m].support_score;

                    if (entry[m].minSupport > scoreObj.scores[m].support_score)
                        entry[m].minSupport = scoreObj.scores[m].support_score;

                    entry[m].avgSupport += scoreObj.scores[m].support_score;
                    entry[m].totalEntries++;
                }

            } else {
                let entry;

                if (minMaxAvgData[scoreObj.date] === undefined) {
                    minMaxAvgData[scoreObj.date] = {}
                }

                if (minMaxAvgData[scoreObj.date][scoreObj.goggle] !== undefined) {
                    entry = minMaxAvgData[scoreObj.date][scoreObj.goggle];
                } else {
                    entry = minMaxAvgData[scoreObj.date][scoreObj.goggle] = {};
                }

                for (let method in methods) {
                    let m = methods[method];

                    entry[m] = {
                        maxBias: scoreObj.scores[m].bias_score,
                        minBias: scoreObj.scores[m].bias_score,
                        avgBias: scoreObj.scores[m].bias_score,

                        maxSupport: scoreObj.scores[m].support_score,
                        minSupport: scoreObj.scores[m].support_score,
                        avgSupport: scoreObj.scores[m].support_score,

                        totalEntries: 1
                    }
                }

            }

        });

        let dateKeys = Object.keys(minMaxAvgData);

        for (let date in dateKeys) {
            let d = Number.parseInt(dateKeys[date]);
            let goggles = Object.keys(minMaxAvgData[d]);

            for (let goggle in goggles) {
                let g = goggles[goggle];

                for (let method in methods) {
                    let m = methods[method];
                    let entry = minMaxAvgData[d][g][m];
                    entry.avgBias = entry.avgBias / entry.totalEntries;
                    entry.avgSupport = entry.avgSupport / entry.totalEntries;
                }

            }
        }

        return minMaxAvgData;
    }

    export function getTop(type: 'top bias' | 'top support', minMaxAvgData: MinMaxAvgScores,
        scores: Array<Score>, domainData: Map<string, DomainData>) {

        if (type === 'top bias') {

        } else {

        }

    }
}

