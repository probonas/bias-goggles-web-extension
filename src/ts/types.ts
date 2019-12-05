export enum BiasGogglesAvailable {
    politicalParties = "political-parties",
    footballTeams = "sport-teams"
}

export const MethodsAndNames: { [index: string]: string } = {
    'ic': 'Independent Cascade',
    'lt': 'Linear Threshold',
    'pr': 'Page Rank',

    'Independent Cascade': 'ic',
    'Linear Threshold': 'lt',
    'Page Rank': 'pr'
};

export interface UserSettings {
    [key: string]: UserData;
}

export interface UserData {
    method: string;
    goggles: string;
    forceRefreshLimit: number;
    deleteAfter: number; //in days
    badgeColor: string;
    syncEnabled: boolean;
}

export interface AppData {
    [key: string]: DomainData;
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