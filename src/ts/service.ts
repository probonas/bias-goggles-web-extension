import * as http from "http";
import { userSettings } from "./usersettings";
import { AppData, Goggle, AB, UserCreatedGoggle } from "./types";
import { utils } from "./utils";
import { RequestOptions } from "https";

export namespace service {
    const REQUEST_TIMEOUT = 3000; //ms

    const enum ROUTES {
        "USERS" = "/bias-goggles-api/users/",
        "ALGORITHMS" = "/bias-goggles-api/algs/",
        "DOMAINS" = "/bias-goggles-api/domains/",
        "ASPECT_OF_BIAS" = "/bias-goggles-api/abs/",
        "BIAS_CONCEPT" = "/bias-goggles-api/bcs/",
        "BIAS" = "/bias-goggles-api/bias/", //dummy, keep out!
        "SEARCH" = "/bias-goggles-api/search/",
        "SEARCH_WITH_URL" = "/bias-goggles-api/search/bcs/",
        "CRAWL_CHECK" = "/bias-goggles-api/domains/",
        "DEFAULT_GOGGLES" = "/bias-goggles-api/bcs/defaults/",
        "DOMAIN_TYPES" = "/bias-goggles-api/bcs/domainTypes/"
    }

    function getRequestOptions(route: ROUTES, slug?: string): RequestOptions {
        return {
            method: 'GET',
            host: "pangaia.ics.forth.gr",
            port: 4567,
            path: (slug === undefined) ? route : route + slug,
            headers: {
                'Accept': 'application/json'
            },
        };
    }

    function postRequestOptions(route: ROUTES, postData?: string): RequestOptions {
        return {
            method: 'POST',
            host: "pangaia.ics.forth.gr",
            port: 4567,
            path: route,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData || null)
            },
        };
    }
    export function checkIfCrawled(domain: string, callback: (crawled: boolean) => void) {
        requestFromService(
            getRequestOptions(ROUTES.CRAWL_CHECK, encodeURI(domain)),
            (data, res) => {
                callback((res.statusCode === 200 && data.crawled) ? true : false);
            }
        );
    }

    export function postAB(seeds: AB, callback: (AbId: string | null) => void) {
        let postData = JSON.stringify(seeds);

        postToService(
            postRequestOptions(ROUTES.ASPECT_OF_BIAS, postData), postData,
            (data, res) => {
                callback((res.statusCode === 200 || res.statusCode === 201) ? data.id : null);
            }
        );
    }

    export function postCreatedGoggle(goggle: UserCreatedGoggle, callback: (goggle: Goggle) => void) {
        let postData = JSON.stringify(goggle);
        postToService(
            postRequestOptions(ROUTES.BIAS_CONCEPT, postData), postData,
            (data, res) => {
                console.log(data); 
                callback((res.statusCode === 200 || res.statusCode === 201) ? <Goggle>data : null);
            }
        )
    }

    export function getDomainTypes(callback: (domainTypes: Array<string>) => void) {
        requestFromService(
            getRequestOptions(ROUTES.DOMAIN_TYPES),
            (data, res) => {
                let types = new Array<string>();
                for (let i = 0; i < data.types.length; i++)
                    types.push(data.types[i]);

                callback((res.statusCode === 200 || res.statusCode === 201) ? types : null);
            }
        )
    }

    export function getUserID(callback: (userID: string | null) => void) {
        postToService(
            postRequestOptions(ROUTES.USERS), null,
            (data, res) => {
                callback((res.statusCode === 201) ? data.userID : null);
            }
        );
    }

    export function getDefaultGoggles(callback: (goggles: Array<Goggle> | null) => void) {
        requestFromService(
            getRequestOptions(ROUTES.DEFAULT_GOGGLES),
            (data, res) => {
                let goggles = new Array<Goggle>();

                for (let i = 0; i < data.length; i++)
                    goggles.push(data[i] as Goggle);

                callback((res.statusCode === 200) ? goggles : null);
            }
        )
    }

    export function search(key: string, callback: (data: Array<Goggle>) => void) {
        let reqOptions;

        if (key === '')
            reqOptions = getRequestOptions(ROUTES.BIAS_CONCEPT, key);
        else if (utils.isUrl(key))
            reqOptions = getRequestOptions(ROUTES.SEARCH_WITH_URL, key);
        else
            reqOptions = getRequestOptions(ROUTES.SEARCH, key);

        requestFromService(reqOptions, (data, res) => {
            if (res.statusCode === 200) {
                let arr = new Array<Goggle>();

                for (let i = 0; i < data.length; i++)
                    arr.push(data[i] as Goggle);

                callback(arr);
            } else {
                callback(null);
            }
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

    function postToService(targetURL: string | http.RequestOptions, postData: string, callback: (data: any, res: http.IncomingMessage) => void) {
        let data: any = '';

        console.log('requesting : ' + targetURL);
        let request = http.request(targetURL, res => {

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('close', () => {
                callback(JSON.parse(data), res);
            });

        });

        request.setTimeout(REQUEST_TIMEOUT, () => {
            callback(null, { statusCode: 500 } as http.IncomingMessage);
        });

        request.on('error', () => {
            callback(null, { statusCode: 500 } as http.IncomingMessage);
        });

        request.write(postData);
        request.end();
    }

    function requestFromService(targetURL: string | http.RequestOptions, callback: (data: any, res: http.IncomingMessage) => void) {
        let data: any = '';

        console.log('requesting : ' + targetURL);
        let request = http.get(targetURL, res => {

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('close', () => {
                callback(JSON.parse(data), res);
            });

        });

        request.setTimeout(REQUEST_TIMEOUT, () => {
            callback(null, { statusCode: 500 } as http.IncomingMessage);
        });

        request.on('error', () => {
            callback(null, { statusCode: 500 } as http.IncomingMessage);
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