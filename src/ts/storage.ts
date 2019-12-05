
import { AppData } from "./types";
import { userSettings } from "./usersettings";

export namespace extension {

    let syncEnabled: boolean;

    export namespace storage {

        export function set(data: string | AppData): void {

            userSettings.get((settings) => {
                let syncEnabled = settings[userSettings.settingsKey].syncEnabled;
                let limit = settings[userSettings.settingsKey].forceRefreshLimit;

                let st: chrome.storage.StorageArea;

                if (syncEnabled) {
                    st = chrome.storage.sync;
                } else {
                    st = chrome.storage.local;
                }

                if (typeof data === 'string') {
                    let dataObj = parseDataFromService(data, limit);
                    st.set(dataObj);
                } else {
                    st.set(data);
                }
            });
        };

        export function get(key: string, callback: (item: AppData) => void): void {
            if (syncEnabled) {
                chrome.storage.sync.get(key, callback);
            } else {
                chrome.storage.local.get(key, callback);
            }
        }

        export function remove(key: string) {
            if (syncEnabled) {
                chrome.storage.sync.remove(key);
            } else {
                chrome.storage.local.remove(key);
            }
        }
    }

    function parseDataFromService(data: string, limit: number): AppData {
        let ret = JSON.parse(data);

        //the following are as returned from service
        //if anything changes in service
        //the following should be updated as well

        let obj = {} as AppData;
        obj[ret.doc.domain] = {
            ic: {
                //@ts-ignore
                bias_score: ret.doc.ic.bias_score,
                rank: ret.doc.ic.rank,
                support_score: ret.doc.ic.rank,
                vector: ret.doc.ic.vector
            },
            lt: {
                bias_score: ret.doc.lt.bias_score,
                rank: ret.doc.lt.rank,
                support_score: ret.doc.lt.rank,
                vector: ret.doc.lt.vector
            },
            pr: {
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
