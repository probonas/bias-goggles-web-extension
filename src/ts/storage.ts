
import { AppData, DomainData, Score, Analytics, AnalyticsData, UserSettings } from "./types";
import { userSettings } from "./usersettings";
import { utils } from "./utils";

export namespace extension {

    export namespace storage {

        export function set(data: string | AppData | Analytics, callback?: () => void): void {

            if (data === null) {
                callback();
                return;
            }

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
                    parseDataFromService(data, limit, settings.scoreIndex, domainData, scoreData, settings.goggles);
                    userSettings.update(settings, () => {
                        st.set(domainData, () => {
                            st.set(scoreData, callback)
                        });
                    });
                } else {
                    st.set(data, callback);
                }
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

        /* default goggle */
        export function getDomainData(domain: string, callback: (item: DomainData) => void) {
            userSettings.get((settings) => {
                get(settings.goggles + ' ' + domain, (data) => {
                    utils.refreshDataForDomain(domain, data, callback);
                });
            });
        }

        export function getScoreData(scoreIndex: number, callback: (item: Score, index: number) => void) {
            get(String(scoreIndex), (item) => {
                if (callback !== undefined)
                    callback(<Score>item, scoreIndex);
            });
        }

        /* for current goggle */
        export function getScoresForDomain(domain: string, callback: (item: Score, index: number) => void) {
            extension.storage.getDomainData(domain, (item) => {
                if (item != null)
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
                getStorageObj((storage)=>{
                    for(let key in Object.keys(items)){
                        storage.remove(Object.keys(items)[key],callback);
                    }
                });
            });
        }
    }

    function parseDataFromService(data: string, limit: number, scoreIndex: number, domainData: AppData, scoreData: AppData, goggles: string) {
        let ret = JSON.parse(data);

        //the following are as returned from service
        //if anything changes in service
        //the following should be updated as well

        //@ts-ignore
        domainData[goggles + ' ' + ret.doc.domain] = {
            limit: limit,
            scoreIndex: scoreIndex
        };

        scoreData[scoreIndex] = {
            scores: {
                'ic': {
                    //@ts-ignore
                    bias_score: ret.doc.ic.bias_score,
                    rank: ret.doc.ic.rank,
                    support_score: ret.doc.ic.support_score,
                    vector: ret.doc.ic.vector
                },
                'lt': {
                    bias_score: ret.doc.lt.bias_score,
                    rank: ret.doc.lt.rank,
                    support_score: ret.doc.lt.support_score,
                    vector: ret.doc.lt.vector
                },
                'pr': {
                    bias_score: ret.doc.pr.bias_score,
                    rank: ret.doc.pr.rank,
                    support_score: ret.doc.pr.support_score,
                    vector: ret.doc.pr.vector
                }
            },
            date: new Date()
        };
    };

}
