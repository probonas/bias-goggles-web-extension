import * as http from "http";
import { userSettings } from "./usersettings";
import { AppData, Goggle, UserCreatedGoggle, Algorithm, Bias, Scores } from "./types";
import { utils } from "./utils";
import { RequestOptions } from "https";
import { stringify } from "querystringify"
export namespace service {
    const REQUEST_TIMEOUT = 3000; //ms

    const enum ROUTES {
        "USERS" = "/bias-goggles-api/users/",
        "ALGORITHMS" = "/bias-goggles-api/algs/",
        "DOMAINS" = "/bias-goggles-api/domains/",
        "ASPECT_OF_BIAS" = "/bias-goggles-api/abs/",
        "BIAS_CONCEPT" = "/bias-goggles-api/bcs/",
        "BIAS" = "/bias-goggles-api/bias/",
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

    export function postAB(seeds: Array<string>, callback: (AbId: string | null) => void) {
        let postData = JSON.stringify({ seeds: seeds });

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

    export function getAvailablesAlgorithms(callback: (algs: Array<Algorithm>) => void) {
        requestFromService(
            getRequestOptions(ROUTES.ALGORITHMS),
            (data, res) => {
                let algs = new Array<Algorithm>();

                for (let i = 0; i < data.length; i++) {
                    algs.push({
                        id: data[i].ID,
                        name: data[i].NAME,
                        description: data[i].DESCRIPTION
                    });
                }

                callback((res.statusCode === 200) ? algs : null);
            }
        )
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

    function parseDataFromService(data: Array<Bias>, callback: (domainData: AppData, scoreData: AppData) => void) {
        let scoreData = {} as AppData;
        let domainData = {} as AppData;
        let scores = {} as Scores;
        let vector: { [key: string]: number } = {};
    
        if(data.includes(null))
            callback(null,null);

        let scoreIndex = userSettings.updateScoreIndex();

        //console.log('before');
        //console.log(data);

        domainData[utils.makeKey(data[0].domain, data[0].bcID)] = {
            scoreIndex: scoreIndex,
            prevIndices: Array<number>()
        };

        for (let i = 0; i < data[0].abs.length; i++)
            vector[data[0].abs[i].seeds.join()] = data[0].abs[i].support;


        data.forEach(dataForAlg => {
            scores[dataForAlg.algID] = {
                support_score: dataForAlg.support_score,
                bias_score: dataForAlg.bias_score,
                vector: vector
            };
        });

        scoreData[scoreIndex] = {
            scores: scores,
            hits: 1,
            date: new Date().valueOf(),
            goggle: data[0].bcID
        };

        //console.log('here');
        //console.log(domainData);
        //console.log(scoreData);

        callback(domainData, scoreData);
    };

    function postToService(targetURL: string | http.RequestOptions, postData: string, callback: (data: any, res: http.IncomingMessage) => void) {
        let data: any = '';

        //console.log('requesting : ' + targetURL);
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

        //console.log('requesting : ' + targetURL);
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

        console.log('requesting :' + url + ' ' + goggles);

        userSettings.get((items) => {
            let retrieved = new Array<Bias>();

            for (let i = 0; i < items.algs.length; i++) {
                requestFromService(
                    getRequestOptions(ROUTES.BIAS, stringify({
                        bcID: goggles,
                        algID: items.algs[i].id
                    }, url + '?')),
                    (data, res) => {
                        if (res.statusCode === 200 || res.statusCode === 304)
                            retrieved.push(data);
                        else
                            retrieved.push(null);

                        if (retrieved.length === items.algs.length) {
                            //console.log('retrieved');
                            //console.log(data);

                            parseDataFromService(retrieved, (domainData, scoreData) => {
                                callback(domainData, scoreData);
                            });
                        }
                    });
            }
        })
    }
}