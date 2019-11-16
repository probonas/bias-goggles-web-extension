
export enum BiasScoresMethods {
    independentCascade = "ic",
    linearThreshold = "lt",
    pagerank = "pr"
}

export enum BiasGoggles {
    politicalParties = "political-parties",
    footballTeams = "sport-teams"
}

export interface BiasData {
    domain: string;
    ic: string;
    lt: string;
    pr: string;
}

export interface ServiceResponse {
    doc: BiasData;
}

export interface SerializableValue {
    ic: string; //string represantation of JSON data
    lt: string; //string represantation of JSON data
    pr: string; //string represantation of JSON data
    limit: number;
}

export interface Serializable {
    key: string;
    value: SerializableValue;
}

export interface ReqBias {
    method: string,
    set_as_default: boolean,
}

export class Message {
    data: any
    constructor(data?: any ) {
        this.data = data;
    }
}

export class BiasStatsResponse extends Message {
    data: Serializable;

    constructor(data: Serializable) {
        super(data);
    }
}

export class BiasStatsRequest extends Message {
    data: ReqBias;

    constructor(data: ReqBias) {
        super(data);
    }
}