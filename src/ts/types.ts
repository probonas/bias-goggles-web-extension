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

export interface AppDataMap {
    [key: string]: DomainData;
}

interface DomainDataMap {
    [key: string]: ScoreData;
}

export type DomainData = DomainDataMap & {
    limit: number;
    date: Date;
}

interface ScoreDataMap {
    [key: string]: ScoreData;
}

export type ScoreData = ScoreDataMap & {
    bias_score: number;
    rank: number;
    support_score: number;
    vector: string[]
}