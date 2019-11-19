
export enum BiasScoresMethods {
    independentCascade = "ic",
    gnearThreshold = "lt",
    pagerank = "pr"
}

export enum BiasGoggles {
    politicalParties = "political-parties",
    footballTeams = "sport-teams"
}

export interface AppData {
    domain: string;
    appdata: DomainData
}

export interface DomainData {
    ic: ScoreData;
    lt: ScoreData;
    pr: ScoreData;
    limit: number;
    date: Date
}

export interface ScoreData {
    bias_score: number;
    rank: number;
    support_score: number;
    vector: string[]
}

export enum RequestMessage {
    GET_STATS = 'get-stats',
    SET_AS_DEFAULT = 'set-as-default',
}

export class ExtRequest {
    messages: RequestMessage[];
    extra: any;

    constructor(messages: RequestMessage[], extra?: any) {
        this.messages = messages;
        this.extra = extra;
    }

}

export class ExtResponse {
    data: AppData;
    extra: any;

    constructor(data: AppData, extra?: any) {
        this.data = data;
        this.extra = extra;
    }

}