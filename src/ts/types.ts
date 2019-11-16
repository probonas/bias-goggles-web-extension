
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

export interface Serializable {
    key: string;
    value: {
        ic: string;
        lt: string;
        pr: string;
        limit: number;
    }
}

export enum ExtRequestTypes {
    bias_stats = "bias-stats"
}

export interface ExtRespose {
    data: JSON,
    method: BiasScoresMethods
}

export interface ExtRequest {
    type: ExtRequestTypes
}