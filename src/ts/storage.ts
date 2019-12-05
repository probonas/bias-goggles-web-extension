
import { AppDataMap, DomainData } from "./types";
import { userSettings } from "./usersettings";

export namespace extension {

    export namespace storage {

        export function set(data: string | AppDataMap, callback?: () => void): void {

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
                    let dataObj = parseDataFromService(data, limit);
                    st.set(dataObj, callback);
                } else {
                    st.set(data, callback);
                }
            });
        };

        function nullIfKeyDoesNotExist(item: AppDataMap, key: string): DomainData | null {
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

        export function get(key: string, callback?: (item: DomainData) => void): void {
            getStorageObj((storage) => {
                storage.get(key, (item) => {
                    if (callback !== undefined)
                        callback(nullIfKeyDoesNotExist(item, key));
                });
            });
        }

        export function getAll(callback: (item: AppDataMap) => void): void {
            getStorageObj((storage) => {
                storage.get(null, (items: AppDataMap) => {
                    callback(items);
                });
            });
        }

        export function remove(key: string, callback?: () => void): void {
            getStorageObj((storage) => {
                storage.remove(key, callback);
            });
        }

    }

    function parseDataFromService(data: string, limit: number): AppDataMap {
        let ret = JSON.parse(data);

        //the following are as returned from service
        //if anything changes in service
        //the following should be updated as well

        let obj = {} as AppDataMap;

        //@ts-ignore
        obj[ret.doc.domain] = {
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
            },
            limit: limit,
            date: new Date()
        };

        return obj;
    };

}
