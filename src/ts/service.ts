import { get as httpGet, IncomingMessage } from "http";
import { userSettings } from "./usersettings";
import { AppData, Goggle } from "./types";
import { utils } from "./utils";
import { RequestOptions } from "https";

export namespace service {

    const enum ROUTES {
        "USERS" = "/bias-goggles-api/users/",
        "ALGORITHMS" = "/bias-goggles-api/algs/",
        "DOMAINS" = "/bias-goggles-api/domains/",
        "ASPECT_OF_BIAS" = "/bias-goggles-api/abs/",
        "BIAS_CONCEPT" = "/bias-goggles-api/bsc/",
        "BIAS" = "/bias-goggles-api/bias/", //dummy, keep out!
        "SEARCH" = "/bias-goggles-api/search/"
    }

    function getRequestOptions(route: ROUTES, slug: string): RequestOptions {
        return {
            host: "pangaia.ics.forth.gr",
            port: 4567,
            path: route + slug,
            headers: {
                'Accept': 'application/json'
            }
        };
    }

    export function search(key: string, callback: (data: Array<Goggle>) => void) {
        let reqOptions = getRequestOptions(ROUTES.SEARCH, key);
        requestFromService(reqOptions, (data, res) => {
            data = new Array<Goggle>(JSON.parse(data));

            //console.log(data);
            //console.log(res.statusCode);

            callback(data);
        });
    }

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

    function requestFromService(targetURL: string | RequestOptions, callback: (data: any, res: IncomingMessage) => void) {
        let data: any = '';

        console.log('requesting : ' + targetURL);

        httpGet(targetURL, res => {

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('close', () => {
                callback(data, res);
            });
        });
    }

    export function query(url: string, goggles: string, callback?: (domainData: AppData, scoreData: AppData) => void): void {
        //console.log('requesting: ' + goggles + ' ' + url);

        let targetURL = getRequestURL(url, goggles);

        requestFromService(targetURL, (data, res) => {
            if (res.statusCode === 200 || res.statusCode === 304) {
                parseDataFromService(data, goggles, (domainData, scoreData) => {
                    callback(domainData, scoreData);
                });
            }
            else {
                callback(null, null);
            }
        });
    }
}