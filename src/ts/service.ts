import { get as httpGet } from "http";
import { userSettings } from "./usersettings";
import { AppData, DomainData } from "./types";
import { extension } from "./storage";

export namespace service {

    function parseDataFromService(data: string, callback: () => void) {
        let ret = JSON.parse(data);

        let scoreData = {} as AppData;
        let domainData = {} as AppData;

        userSettings.getScoreIndex((settings) => {

            //the following are as returned from service
            //if anything changes in service
            //the following should be updated as well

            //@ts-ignore
            domainData[settings.goggles + ' ' + ret.doc.domain] = {
                limit: settings.forceRefreshLimit,
                scoreIndex: settings.scoreIndex
            };

            scoreData[settings.scoreIndex] = {
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

            extension.storage.set(domainData, () => {
                extension.storage.set(scoreData, callback);
            });

        });
    };

    function getRequestURL(domain: string, goggles: string): string {

        const prefix = 'http://139.91.183.23:3000/results?domain=';

        const suffix = '&bc=' + goggles;

        return prefix + encodeURIComponent(domain) + suffix;
    }

    export function query(activeTab: string, callback?: (data: DomainData) => void): void {

        let data: any = '';

        console.log('requesting: ' + activeTab);

        userSettings.get((settings) => {
            let targetURL = getRequestURL(activeTab, settings.goggles);

            httpGet(targetURL, res => {

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('close', () => {
                    if (res.statusCode === 200 || res.statusCode === 304) {
                        parseDataFromService(data, () => {
                            callback(data);
                        });
                    }
                    else {
                        callback(null);
                    }
                });
            });
        });

    }
}