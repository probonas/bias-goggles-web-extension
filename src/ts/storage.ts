
import { AppData, DomainData, Score, Analytics, AnalyticsData } from "./types";
import { userSettings } from "./usersettings";
import { utils } from "./utils";

export namespace extension {

    export namespace storage {

        export function set(data: AppData | Analytics, callback?: () => void): void {

            if (data === null) {
                callback();
                return;
            }

            getStorageObj((storage) => {
                storage.set(data, callback);
            });
        }

        function nullIfKeyDoesNotExist(item: AppData, key: string): AppData | DomainData | Score | null {
            if (Object.keys(item).length === 0) {
                return null;
            } else if (key === null) {
                return item; //return all in storage
            } else {
                return item[key];
            }
        }

        function getStorageObj(callback: (storage: chrome.storage.StorageArea) => void) {
            userSettings.get(settings => {
                if (settings.syncEnabled) {
                    callback(chrome.storage.sync);
                } else {
                    callback(chrome.storage.local);
                }
            });
        }

        function get(key: string, callback?: (item: any) => void): void {
            getStorageObj((storage) => {
                storage.get(key, (item) => {
                    if (callback !== undefined) {
                        callback(nullIfKeyDoesNotExist(item, key));
                    }
                });
            });
        }

        export function getDomainData(domain: string, goggles: string, callback: (item: DomainData) => void) {
            get(goggles + ' ' + domain, (data) => {
                utils.refreshDataForDomain(domain, goggles, data, () =>
                    get(goggles + ' ' + domain, (data) => {
                        callback(data);
                    }));
            });
        }

        export function getScoreData(scoreIndex: number, callback: (item: Score, index: number) => void) {
            get(String(scoreIndex), (item) => {
                if (callback !== undefined)
                    callback(<Score>item, scoreIndex);
            });
        }

        export function getScoresForDomain(domain: string, goggle: string, callback: (item: Score, index: number) => void) {
            extension.storage.getDomainData(domain, goggle, (item) => {
                if (item !== null)
                    extension.storage.getScoreData(item.scoreIndex, callback);
                else
                    callback(null, -2);
            });
        }

        export function getAllDomainData(callback: (items: AppData) => void): void {
            get(null, (items: AppData) => {
                //exclude user settings data
                delete items['settings'];

                //exclude analytics data
                delete items['analytics'];

                //all that is left are domain data and their indices
                callback(items);
            });
        }

        export function getAllScoreData(callback: (scores: Array<Score>) => void) {
            let scores = Array<Score>();

            getAllDomainData((items) => {
                let keys = Object.keys(items);

                for (let key in keys) {

                    if (items[key] && (<Score>items[key]).date !== undefined) {
                        scores.push(<Score>items[key]);
                    }
                }

                if (scores.length === 0) {
                    callback(null);
                } else {
                    callback(scores);
                }

            });
        }

        export function getAnalytics(callback: (item: AnalyticsData) => void) {
            get('analytics', callback);
        }

        export function remove(key: string, callback?: () => void): void {
            getStorageObj((storage) => {
                storage.remove(key, callback);
            });
        }

        export function clear(callback?: () => void) {
            get(null, (items) => {
                delete items['settings'];
                getStorageObj((storage) => {
                    for (let key in Object.keys(items)) {
                        storage.remove(Object.keys(items)[key], callback);
                    }
                });
            });
        }
    }
}