
import { AppData, DomainData, Score } from "./types";
import { userSettings } from "./usersettings";
import { utils } from "./utils";

export namespace extension {

    export namespace storage {

        /**
         * Saves data to browser storage.
         * Data are stored as javascript objects.
         * 
         * @param data data to be stored
         * @param callback passed to browser.storage.{local|sync}.set
         * 
         * @covered
         */
        export function set(data: AppData, callback?: () => void): void {
            if (data === null) {
                callback();
            }

            getStorageObj((storage) => {
                storage.set(data, callback);
            });
        }

        /**
         * Browser.storage.{local|sync}.get returns an empty object when key is not present in storage.
         * Used to return object keys or null.
         *  
         * @see get
         * 
         * @param item as returned from storage.{local|sync}.get
         * @param key key passed to storage.{local|sync}.get
         */
        function nullIfKeyDoesNotExist(item: AppData, key: string): AppData | DomainData | Score | null {
            if (Object.keys(item).length === 0) {
                return null;
            } else if (key === null) {
                return item; //return all in storage
            } else {
                return item[key];
            }
        }

        /**
         * Extension supports browser.storage.sync API, if user specifically opts in.
         * 
         * @param callback 
         */
        function getStorageObj(callback: (storage: chrome.storage.StorageArea) => void) {
            userSettings.get(settings => {
                if (settings.syncEnabled)
                    callback(chrome.storage.sync);
                else
                    callback(chrome.storage.local);
            });
        }

        /**
         * Retrieve an object from storage using either storage.sync or storage.local
         * 
         * @param key single key or array of keys to use
         * @param callback if proviced, callback is called after storage retrieval
         */
        function get(key: string | string[], callback?: (item: any) => void): void {
            getStorageObj((storage) => {
                storage.get(key, (item) => {
                    if (callback !== undefined) {
                        if (Array.isArray(key)) {
                            let checked = new Array<any>();
                            for (let i = 0; i < key.length; i++)
                                checked.push(nullIfKeyDoesNotExist(item, key[i]));
                            callback(checked);
                        } else {
                            callback(nullIfKeyDoesNotExist(item, key));
                        }
                    }
                });
            });
        }

        /**
         * Checks if data for this pair of domain and goggle exist in storage
         * 
         * @param key to look for
         * @param callback called with true if found, false else
         * 
         * @covered
         */

        export function dataExist(key: string, callback: (exist: boolean, data: DomainData) => void) {
            get(key, (item) => {
                callback(item === null ? false : true, <DomainData>item);
            });
        }

        /**
         * Retrieves only the latest score data stored for a pair of domain and goggles.
         * If no data is stored, it communicates with Bias-Goggle service to retrieve them.
         * Updates scoreIndex accordingly.
         * 
         * @param domain to look for
         * @param goggle being used
         * @param callback score data of the above and their score index
         * 
         * @covered
         */
        export function getLatestScoreData(domain: string, goggle: string, callback: (score: Score, index: number) => void) {
            let key = utils.makeKey(domain, goggle);

            dataExist(key, (exist, data) => {
                if (exist) {
                    getScoreDataWithIndex(data.scoreIndex, (score) => {
                        if (utils.areScoreDataObsolete(score)) {
                            console.info(key + ' found, but they\'re considered obsolete');
                            utils.savePrevScoreIndices(data, (savedIndices) => {
                                utils.queryServiceAndSet(domain, goggle, (newDomainData, newScoreData) => {
                                    utils.updateScoreIndices(key, newDomainData, savedIndices, (updated) => {
                                        callback(newScoreData, updated.scoreIndex);
                                    });
                                });
                            });
                        } else {
                            utils.updateHitCounter(data, score, (newScoreData) => {
                                console.info(key + ' found, updating hit counter ' + newScoreData.hits);
                                callback(newScoreData, data.scoreIndex);
                            });
                        }
                    });
                } else {
                    console.info(key + ' not found');
                    utils.queryServiceAndSet(domain, goggle, (domainData, scoreData) => {
                        callback(scoreData, domainData.scoreIndex);
                    });
                }
            });
        }

        /**
         * Return score data for index
         * 
         * @param index to search for
         * @param callback 
         * 
         * @covered
         */
        export function getScoreDataWithIndex(index: number, callback: (score: Score) => void) {
            get(String(index), (item) => {
                callback(<Score>item);
            });
        };

        /**
         * Retrieves all scores associated with a domain and a goggle
         * If no data exists, callback is called with null parameters
         * 
         * @param domain to look for
         * @param goggle being used
         * @param callback an array of all scores associated with the above and their corresponding indices
         * 
         * @covered
         */
        export function getScoresForDomain(domain: string, goggle: string, callback: (scores: Score[], indices: number[]) => void) {
            dataExist(utils.makeKey(domain, goggle), (exist, data: DomainData) => {
                if (exist) {
                    let searchKeys = new Array<string>();

                    searchKeys.push(String(data.scoreIndex));
                    data.prevIndices.forEach((value) => {
                        searchKeys.push(String(value));
                    });

                    get(searchKeys, (item) => {
                        let scores = new Array<Score>();
                        let indices = new Array<number>();

                        searchKeys.forEach((value) => {
                            indices.push(parseInt(value));
                        });

                        let itemKeys = Object.keys(item);

                        itemKeys.forEach((key) => {
                            scores.push(item[key]);
                        });

                        callback(scores, indices);
                    });
                }
                else {
                    callback(null, null);
                }
            });
        }

        /**
         * Returns all data in storage (DomainData and Scores) in key-value pairs,
         * expect the settings.
         * 
         * @see userSettings.get
         * 
         * @param callback all the above items as a single object
         */
        function getAllData(callback: (items: AppData) => void): void {
            get(null, (items: AppData) => {
                //exclude user settings data
                delete items['settings'];

                //all that is left are domain data and their indices
                callback(items);
            });
        }

        /**
         * Returns all score data stored
         * 
         * @param sortted should data in callback be explicitly sorted by date or not.
         * @param callback a map containing the retrieved data in key-value pairs
         * 
         * @covered
         */
        export function getAllScoreData(callback: (scores: Map<number, Score>) => void, sorted?: boolean) {
            let scores = new Map<number, Score>();

            if (sorted === undefined)
                sorted = true;

            getAllData((items) => {
                let keys = Object.keys(items);

                for (let key in keys) {
                    let k = keys[key];

                    if ((<Score>items[k]).date !== undefined) {
                        scores.set(parseInt(key), <Score>items[k]);
                    }
                }

                if (scores.size === 0) {
                    callback(null);
                } else {
                    if (sorted) {
                        callback(scores);
                    } else {
                        let sorted = new Map([...scores].sort((a, b) => {
                            return a[1].date - b[1].date;
                        }));
                        callback(sorted);
                    }
                }
            });
        }

        /**
         * Returns all domain data stored
         * 
         * @param callback a map containing all retrived data in key-value pairs
         * 
         * @covered
         */
        export function getAllDomainData(callback: (domainData: Map<string, DomainData>) => void) {
            let datamap = new Map<string, DomainData>();

            getAllData((items) => {
                let keys = Object.keys(items);

                for (let key in keys) {
                    let k = keys[key];

                    if ((<DomainData>items[k]).scoreIndex !== undefined)
                        datamap.set(k, (<DomainData>items[k]));
                }

                if (datamap.size === 0)
                    callback(null);
                else
                    callback(datamap);

            });
        };

        /**
         * Returns and inverted index map of all domain data an their indices.
         * Useful when we need to connect indices to their domain data.
         * 
         * This function performs the following iteratively for all all domain 
         * data in storage.
         *  
         * For a domain data object in storage e.g.
         * {
         *      political-parties example.com : {
         *          scoreIndex: 15,
         *          prevScoreIndices : [2, 4 , 8, 12]
         * },
         * the resulting records in the map will be
         * {
         *      15 : political-parties example.com,
         *      2 : political-parties example.com,
         *      4 : political-parties example.com,
         *      8 : political-parties example.com,
         *      12 : political-parties example.com  
         * }
         * 
         * @param callback a map like the one described above
         */
        export function getAllDomainDataInverse(callback: (inverseDomainData: Map<number, string>) => void) {
            let inversedata = new Map<number, string>()

            getAllData((items) => {
                let keys = Object.keys(items);

                for (let key in keys) {
                    let k = keys[key];

                    let entry = (<DomainData>items[k]);
                    if (entry.scoreIndex !== undefined) {
                        inversedata.set(entry.scoreIndex, k);

                        entry.prevIndices.forEach((value) => {
                            inversedata.set(value, k);
                        });
                    }
                }

                if (inversedata.size === 0)
                    callback(null);
                else
                    callback(inversedata);
            });
        }

        /**
         * Removes object with key 'key' from storage
         * 
         * @param key of object to be removed
         * @param callback
         */
        export function remove(key: string, callback?: () => void): void {
            getStorageObj((storage) => {
                storage.remove(key, callback);
            });
        }

        /**
         * Delete all user data except settings
         * 
         * @param callback 
         */
        export function clear(callback?: () => void) {
            get(null, (items) => {
                //keep settings
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