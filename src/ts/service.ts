import { get as httpGet } from "http";
import { userSettings } from "./usersettings";
import { AppData } from "./types";
import { utils } from "./utils";

export namespace service {

    function parseDataFromService(data: string, goggles: string, callback: (domainData: AppData, scoreData: AppData) => void) {
        let ret = JSON.parse(data);

        let scoreData = {} as AppData;
        let domainData = {} as AppData;

        let scoreIndex = userSettings.updateScoreIndex();
       
        //the following are as returned from service
        //if anything changes in service
        //the following should be updated as well
        //rank data are omitted
        
        domainData[utils.makeKey(ret.doc.domain, goggles)] = {
            scoreIndex: scoreIndex,
            prevIndices: new Array<number>()
        };

        scoreData[scoreIndex] = {
            scores: {
                'ic': {
                    //@ts-ignore
                    bias_score: ret.doc.ic.bias_score,
                    support_score: ret.doc.ic.support_score,
                    vector: ret.doc.ic.vector
                },
                'lt': {
                    bias_score: ret.doc.lt.bias_score,
                    support_score: ret.doc.lt.support_score,
                    vector: ret.doc.lt.vector
                },
                'pr': {
                    bias_score: ret.doc.pr.bias_score,
                    support_score: ret.doc.pr.support_score,
                    vector: ret.doc.pr.vector
                }
            },
            hits: 1,
            date: new Date().valueOf(),
            goggle: goggles
        };

        callback(domainData, scoreData);

    };

    function getRequestURL(domain: string, goggles: string): string {

        const prefix = 'http://139.91.183.23:3000/results?domain=';

        const suffix = '&bc=' + goggles;

        return prefix + encodeURIComponent(domain) + suffix;
    }

    export function query(url: string, goggles: string, callback?: (domainData: AppData, scoreData: AppData) => void): void {

        let data: any = '';

        console.log('requesting: ' + goggles + ' ' + url);

        let targetURL = getRequestURL(url, goggles);

        httpGet(targetURL, res => {

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('close', () => {
                if (res.statusCode === 200 || res.statusCode === 304) {
                    parseDataFromService(data, goggles, (domainData, scoreData) => {
                        callback(domainData, scoreData);
                    });
                }
                else {
                    callback(null, null);
                }
            });
        });

    }
}