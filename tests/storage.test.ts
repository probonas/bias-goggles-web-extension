import { extension } from "../src/ts/storage";
import { userSettings } from "../src/ts/usersettings";
import { alexatop300gr } from "./domains";
import { DomainData, Score, AppData, Goggle } from "../src/ts/types";
import { utils } from "../src/ts/utils";

const VERY_LONG_TIMEOUT = 1000 * 1000;
const LONG_TIMEOUT = 1000 * 60;
const MEDIUM_TIMEOUT = 4000;

//be careful not to the spam XHR handler of your browser
let totalDomains = 10;
let totalMonths = 2;
let totalDays = 28;


let singleDomain = 'kathimerini.gr';
let singleGoggle: Goggle;
let goggles: Goggle[];

let domains = [
    'kathimerini.gr',
    'enikos.gr',
    'in.gr',
    'nd.gr',
    'syriza.gr',
    'google.com',
    'youtube.com'
];

let month: number;
let day: number;
let year: number;

function resetEnvironment(callback: () => void) {
    chrome.storage.local.clear(() => {
        userSettings.initialize(callback);
        userSettings.get((items) => {
            goggles = items.gogglesList;
            singleGoggle = items.gogglesList[0];
        })
    });
}

describe('storage', () => {

    beforeAll((done) => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;
        done();
    });

    beforeEach((done) => {
        for (let i = 0; i < 1000; i++);
        resetEnvironment(() => {
            month = 0;
            day = 1;
            year = 2020;
            jasmine.clock().install();
            jasmine.clock().mockDate(new Date(year, month, day));
            done();
        });
    });

    afterEach((done) => {
        jasmine.clock().uninstall();
        chrome.storage.local.clear(done);
    });

    it('set', (done) => {
        let key = 'test key';
        let obj = {} as AppData;

        obj[key] = {
            prevIndices: null,
            scoreIndex: - 1
        };

        extension.storage.set(obj, () => {
            chrome.storage.local.get(key, (item) => {
                expect(Object.keys(item).length).not.toBe(0);
                expect((<DomainData>item[key]).prevIndices).toBeNull();
                expect((<DomainData>item[key]).scoreIndex).toEqual(-1);
                done();
            });
        });
    });

    it('dataExist: check existing', (done) => {
        let key = 'test key';
        let obj = {} as AppData;

        obj[key] = {
            prevIndices: null,
            scoreIndex: - 1
        };

        chrome.storage.local.set(obj, () => {
            extension.storage.dataExist(key, (exist, data) => {
                expect(exist).toBe(true);

                expect(data.prevIndices).toBeNull();
                expect(data.scoreIndex).toBe(-1);
                done();
            });
        });
    });

    it('dataExist: check non-existing', (done) => {
        extension.storage.dataExist('does-not-exist-in-storage', (exists, data) => {
            expect(exists).toBe(false);
            expect(data).toBeNull();
            done();
        });
    });

    it('getLatestScoreData: single domain + single goggle', (done) => {

        extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {
            expect(score).not.toBeNull();
            expect(score.date).toEqual(new Date().getTime());
            expect(score.goggle).toEqual(singleGoggle.id);
            expect(score.hits).toBe(1);
            expect(Object.keys(score.scores).length).not.toBe(0);

            expect(index).toBe(userSettings.INITIAL_SCORE_INDEX);

            let key = utils.makeKey(singleDomain, singleGoggle.id);

            chrome.storage.local.get(key, (item) => {
                expect(Object.keys(item).length).not.toBe(0);
                expect((<DomainData>item[key])).not.toBeUndefined();
                expect((<DomainData>item[key]).scoreIndex).toBe(userSettings.INITIAL_SCORE_INDEX);
                expect((<DomainData>item[key]).prevIndices.length).toBe(0);
                done();
            });
        });
    });

    it('getLatestScoreData: single domain + multiple goggles', (done) => {
        let completed = new Array<number>();

        for (let g = 0; g < goggles.length; g++) {
            let goggle = goggles[g].id;

            extension.storage.getLatestScoreData(singleDomain, goggle, (score, index) => {
                completed.push(index);

                expect(score).not.toBeNull();
                expect(score.date).toEqual(new Date().getTime());
                expect(score.goggle).toEqual(goggles[index].id);
                expect(score.hits).toBe(1);
                expect(Object.keys(score.scores).length).not.toBe(0);

                let key = utils.makeKey(singleDomain, goggle);

                chrome.storage.local.get(key, (item) => {
                    expect(Object.keys(item).length).not.toBe(0);
                    expect((<DomainData>item[key])).not.toBeUndefined();
                    expect((<DomainData>item[key]).scoreIndex).toBe(index);
                    expect((<DomainData>item[key]).prevIndices.length).toBe(0);

                    if (completed.length === goggles.length)
                        done();

                });
            });
        }
    });

    it('getLatestScoreData: multiple domains + single goggle', (done) => {
        let completed = new Array<number>();

        for (let i = 0; i < domains.length; i++) {
            let domain = domains[i];

            extension.storage.getLatestScoreData(domain, singleGoggle.id, (score, index) => {

                expect(score).not.toBeNull();
                expect(score.date).toEqual(new Date().getTime());
                expect(score.goggle).toEqual(singleGoggle.id);
                expect(score.hits).toBe(1);
                expect(Object.keys(score.scores).length).not.toBe(0);

                let key = utils.makeKey(domain, singleGoggle.id);

                chrome.storage.local.get(key, (item) => {
                    completed.push(index);

                    expect((<DomainData>item[key])).not.toBeUndefined();
                    expect((<DomainData>item[key]).scoreIndex).toBe(index);
                    expect((<DomainData>item[key]).prevIndices).not.toBeNull();
                    expect((<DomainData>item[key]).prevIndices).not.toBeUndefined();
                    expect((<DomainData>item[key]).prevIndices.length).toBe(0);

                    if (completed.length === domains.length) {
                        done();
                    }
                });
            });
        }
    });

    it('getLatestScoreData: multiple domains + multiple goggles', (done) => {
        let completed = new Array<number>();

        for (let g = 0; g < goggles.length; g++) {
            for (let d = 0; d < domains.length; d++) {
                let goggle = goggles[g].id;
                let domain = domains[d];

                extension.storage.getLatestScoreData(domain, goggle, (score, index) => {
                    completed.push(index);

                    expect(score).not.toBeNull();
                    expect(score.date).toEqual(new Date().getTime());
                    expect(score.goggle).toEqual(goggle);
                    expect(score.hits).toBe(1);
                    expect(Object.keys(score.scores).length).not.toBe(0);

                    let key = utils.makeKey(domain, goggle);

                    chrome.storage.local.get(key, (item) => {

                        expect((<DomainData>item[key])).not.toBeUndefined();
                        expect((<DomainData>item[key]).scoreIndex).toBe(index);

                        expect((<DomainData>item[key]).prevIndices).not.toBeNull();
                        expect((<DomainData>item[key]).prevIndices.length).toBe(0);

                        if (completed.length === goggles.length * domains.length) {
                            done();
                        }
                    });
                });
            }
        }
    });

    it('getLatestScoreData: check unique indices', (done) => {
        let indices = new Array<number>();
        for (let d = 0; d < domains.length; d++) {
            extension.storage.getLatestScoreData(domains[d], singleGoggle.id, (score, index) => {
                indices.push(index);
                expect(score.hits).toBe(1);
                if (indices.length === domains.length) {
                    for (let i = userSettings.INITIAL_SCORE_INDEX; i < userSettings.INITIAL_SCORE_INDEX + domains.length; i++)
                        expect(indices).toContain(i);

                    done();
                }
            });
        }
    });

    it('getScoreDateWithIndex: single domain', (done) => {
        extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {
            extension.storage.getScoreDataWithIndex(index, (newscore) => {
                expect(newscore).not.toBeNull();

                expect(score.date).toBe(newscore.date);
                expect(score.goggle).toBe(newscore.goggle);
                expect(score.hits).toBe(newscore.hits);

                expect(Object.keys(score.scores).length).toBe(Object.keys(newscore.scores).length);

                expect(score.scores['pr'].bias_score).toBe(newscore.scores['pr'].bias_score);
                expect(score.scores['lt'].support_score).toBe(newscore.scores['lt'].support_score);
                expect(score.scores['ic'].vector).toEqual(newscore.scores['ic'].vector);

                done();
            });
        });
    });

    it('getScoreDataWithIndex: null if index doesn\'t exist', (done) => {
        extension.storage.getScoreDataWithIndex(0, (score) => {
            expect(score).toBeNull();
            done();
        });
    });

    it('getLatestScoreData: single domain + single goggles one day away', (done) => {
        let date = new Date(year, month, day);
        jasmine.clock().mockDate(date);

        extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score1, index) => {
            expect(score1.date).toBe(date.getTime());

            date = new Date(year, month, ++day);
            jasmine.clock().mockDate(date);

            extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score2, index) => {
                chrome.storage.local.get(utils.makeKey(singleDomain, singleGoggle.id), (item: AppData) => {
                    let domainData = <DomainData>item[utils.makeKey(singleDomain, singleGoggle.id)];

                    expect(score2.date).toBe(date.getTime());

                    expect(domainData.scoreIndex).toBe(userSettings.INITIAL_SCORE_INDEX + 1);
                    expect(domainData.prevIndices.length).toBe(1);
                    expect(domainData.prevIndices[0]).toBe(userSettings.INITIAL_SCORE_INDEX);

                    done();
                });
            });
        });
    }, MEDIUM_TIMEOUT);

    it('getLatestScoreData: single domain + single goggles five days away', (done) => {
        //day 1
        jasmine.clock().mockDate(new Date(year, month, ++day));
        extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {
            //day 2
            jasmine.clock().mockDate(new Date(year, month, ++day));
            extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {

                //day 3
                jasmine.clock().mockDate(new Date(year, month, ++day));
                extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {

                    //day 4
                    jasmine.clock().mockDate(new Date(year, month, ++day));
                    extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {

                        //day 5
                        jasmine.clock().mockDate(new Date(year, month, ++day));
                        extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {

                            chrome.storage.local.get(utils.makeKey(singleDomain, singleGoggle.id), (item: AppData) => {
                                let domainData = <DomainData>item[utils.makeKey(singleDomain, singleGoggle.id)];
                                expect(domainData.scoreIndex).toBe(userSettings.INITIAL_SCORE_INDEX + 4);
                                expect(domainData.prevIndices.length).toBe(4);
                                done();
                            });

                        });
                    });
                });
            });
        });

    }, LONG_TIMEOUT);

    it('getScoresForDomain: single domain + single goggle', (done) => {
        //day 1
        jasmine.clock().mockDate(new Date(year, month, ++day));
        extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {
            //day 2
            jasmine.clock().mockDate(new Date(year, month, ++day));
            extension.storage.getLatestScoreData(singleDomain, singleGoggle.id, (score, index) => {

                extension.storage.getScoresForDomain(singleDomain, singleGoggle.id, (scores, indices) => {
                    expect(scores.length).toBe(2);
                    expect(indices.length).toBe(2);
                    expect(indices).toContain(userSettings.INITIAL_SCORE_INDEX);
                    expect(indices).toContain(userSettings.INITIAL_SCORE_INDEX + 1);
                    done();
                });
            });
        });
    }, MEDIUM_TIMEOUT);

    //multiple domains + multple goggles is exactly the same
    it('getScoresForDomain: multiple domains + single goggles', (done) => {
        let completed = new Array<number>();

        for (let d = 0; d < domains.length; d++) {
            //day 1
            jasmine.clock().mockDate(new Date(year, month, ++day));
            extension.storage.getLatestScoreData(domains[d], singleGoggle.id, (score, index) => {
                completed.push(day);

                //day 2
                jasmine.clock().mockDate(new Date(year, month, ++day));
                extension.storage.getLatestScoreData(domains[d], singleGoggle.id, (score, index) => {

                    completed.push(day);

                    if (completed.length === 2 * domains.length) {
                        //all have completed
                        completed = new Array();
                        let usedIndices = new Array<number>();

                        for (let d = 0; d < domains.length; d++) {

                            extension.storage.getScoresForDomain(domains[d], singleGoggle.id, (scores, indices) => {
                                indices.forEach((value) => {
                                    expect(usedIndices).not.toContain(value);
                                    usedIndices.push(value);
                                });

                                expect(scores.length).toBe(2);
                                expect(indices.length).toBe(2);

                                completed.push(d);

                                if (completed.length === domains.length)
                                    done();
                            });
                        }
                    }
                });
            });
        }
    }, MEDIUM_TIMEOUT);

    it('getAllScoreData: multiple domains + multiple goggles', (done) => {
        let completed = new Array<number>();

        for (let d = 0; d < domains.length; d++) {
            for (let g = 0; g < goggles.length; g++) {

                extension.storage.getLatestScoreData(domains[d], goggles[g].id, (score, index) => {

                    completed.push(index);

                    if (completed.length === domains.length * goggles.length) {
                        extension.storage.getAllScoreData((scores) => {

                            expect(scores).not.toBeNull();

                            expect(scores.size).toBe(domains.length * goggles.length);

                            done();
                        });
                    }
                });
            }
        }
    }, LONG_TIMEOUT);

    it('getAllScoreData: multiple domains + multiple goggles + check key-values are preserved after sorting', (done) => {
        let completed = new Array<number>();

        for (let d = 0; d < domains.length; d++) {
            for (let g = 0; g < goggles.length; g++) {

                extension.storage.getLatestScoreData(domains[d], goggles[g].id, (score, index) => {
                    completed.push(index);

                    if (completed.length === domains.length * goggles.length)
                        extension.storage.getAllScoreData((unsorted) => {
                            expect(unsorted).not.toBeNull();

                            extension.storage.getAllScoreData((sorted) => {
                                expect(sorted).not.toBeNull();

                                sorted.forEach((value, key) => {
                                    let valueFromUnsorted = unsorted.get(key);

                                    expect(valueFromUnsorted).not.toBeUndefined();

                                    expect(valueFromUnsorted.date).toEqual(value.date);
                                    expect(valueFromUnsorted.goggle).toEqual(value.goggle);
                                    expect(valueFromUnsorted.hits).toEqual(value.hits);
                                    expect(valueFromUnsorted.scores).toEqual(value.scores);
                                });

                                expect(sorted.size).toEqual(unsorted.size);
                                done();

                            }, true);
                        }, false);
                });
            }
        }
    }, LONG_TIMEOUT);

    it('getAllDomainData: multiple domains + multiple goggles', (done) => {
        let completed = new Array<number>();
        let keys = new Array<string>();

        for (let d = 0; d < domains.length; d++) {
            for (let g = 0; g < goggles.length; g++) {

                extension.storage.getLatestScoreData(domains[d], goggles[g].id, (score, index) => {
                    completed.push(index);
                    keys.push(utils.makeKey(domains[g], goggles[g].id));

                    if (completed.length == domains.length * goggles.length)
                        extension.storage.getAllDomainData((domainDataMap) => {
                            expect(domainDataMap).not.toBeNull();
                            expect(domainDataMap.size).toBe(domains.length * goggles.length);

                            keys.forEach((key) => {
                                expect(domainDataMap.has(key)).toBeTrue();
                            });

                            done();
                        });
                });
            }
        }
    });

    it('getAllDomainDataInverse: multiple domains + single goggle', (done) => {
        const goggle = goggles[0].id;

        let indices = Array<number>();
        let keys = Array<string>();

        extension.storage.getLatestScoreData(domains[0], goggle, (score, index) => {
            indices.push(index);
            keys.push(utils.makeKey(domains[0], goggle));

            extension.storage.getLatestScoreData(domains[1], goggle, (score, index) => {
                indices.push(index);
                keys.push(utils.makeKey(domains[1], goggle));

                extension.storage.getLatestScoreData(domains[1], goggle, (score, index) => {
                    indices.push(index);
                    keys.push(utils.makeKey(domains[1], goggle));

                    extension.storage.getLatestScoreData(domains[2], goggle, (score, index) => {
                        indices.push(index);
                        keys.push(utils.makeKey(domains[2], goggle));

                        extension.storage.getLatestScoreData(domains[0], goggle, (score, index) => {
                            indices.push(index);
                            keys.push(utils.makeKey(domains[0], goggle));

                            extension.storage.getAllDomainDataInverse((inverseMap) => {

                                expect(inverseMap).not.toBeNull();
                                indices.forEach((scoreIndex, pos) => {
                                    expect(inverseMap.has(scoreIndex)).toBeTrue();
                                    expect(inverseMap.get(scoreIndex)).toBe(keys[pos]);
                                });

                                done();
                            });
                        });
                    });
                });
            });
        });
    });

});
