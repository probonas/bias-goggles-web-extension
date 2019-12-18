
import { AppData, DomainData, Score, Analytics, AnalyticsData } from "./types";
import { userSettings } from "./usersettings";
import { utils } from "./utils";

export namespace extension {

    export namespace storage {

        export function set(data: string | AppData | Analytics, callback?: () => void): void {

            userSettings.get((settings) => {
                let syncEnabled = settings.syncEnabled;
                let limit = settings.forceRefreshLimit;

                let st: chrome.storage.StorageArea;

                if (syncEnabled) {
                    st = chrome.storage.sync;
                } else {
                    st = chrome.storage.local;
                }

                if (typeof data === 'string') {
                    let domainData = {} as AppData;
                    let scoreData = {} as AppData;
                    settings.scoreIndex++;
                    parseDataFromService(data, limit, settings.scoreIndex, domainData, scoreData);
                    userSettings.update(settings, () => {
                        st.set(domainData, () => {
                            st.set(scoreData, callback)
                        });
                    });
                } else {
                    st.set(data, callback);
                }
            });
        };

        function nullIfKeyDoesNotExist(item: AppData, key: string): DomainData | Score | null {
            if (Object.keys(item).length === 0) {
                return null;
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

        export function getDomainData(domain: string, callback: (item: DomainData) => void) {
            get(domain, (data) => {
                utils.refreshDataForDomain(domain, data, callback);
            });
        }

        export function getScoreData(scoreIndex: number, callback: (item: Score, index: number) => void) {
            get(String(scoreIndex), (item) => {
                callback(<Score>item, scoreIndex);
            });
        }

        export function getScoresForDomain(domain: string, callback: (item: Score, index: number) => void) {
            extension.storage.getDomainData(domain, (item) => {
                if (item != null)
                    extension.storage.getScoreData(item.scoreIndex, callback);
            });
        }

        export function getAll(callback: (item: AppData) => void): void {
            getStorageObj((storage) => {
                storage.get(null, (items: AppData) => {
                    callback(items);
                });
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

    }

    function parseDataFromService(data: string, limit: number, scoreIndex: number, domainData: AppData, scoreData: AppData) {
        let ret = JSON.parse(data);

        //the following are as returned from service
        //if anything changes in service
        //the following should be updated as well

        //@ts-ignore
        domainData[ret.doc.domain] = {
            limit: limit,
            scoreIndex: scoreIndex
        };

        scoreData[scoreIndex] = {
            scores: {
                'ic': {
                    //@ts-ignore
                    bias_score: ret.doc.ic.bias_score,
                    rank: ret.doc.ic.rank,
                    support_score: ret.doc.ic.rank,
                    vector: ret.doc.ic.vector
                },
                'lt': {
                    bias_score: ret.doc.lt.bias_score,
                    rank: ret.doc.lt.rank,
                    support_score: ret.doc.lt.rank,
                    vector: ret.doc.lt.vector
                },
                'pr': {
                    bias_score: ret.doc.pr.bias_score,
                    rank: ret.doc.pr.rank,
                    support_score: ret.doc.pr.rank,
                    vector: ret.doc.pr.vector
                }
            },
            date: new Date()
        };
    };

}
