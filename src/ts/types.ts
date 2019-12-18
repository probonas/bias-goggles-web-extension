import { extension } from "./storage";

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

export interface UserSettingsMap {
    [key: string]: UserSettings;
}

export interface UserSettings {
    method: string;
    goggles: string;
    forceRefreshLimit: number;
    syncEnabled: boolean;
    enabled: boolean;
    scoreIndex: number;
}

export type AppData = {
    [key: string]: DomainData | Score;
}

export type DomainData = {
    limit: number;
    scoreIndex: number;
}

export type Score = {
    date: Date;
    scores: Scores;
};

type Scores = {
    [key: string]: ScoreValue
}

export type ScoreValue = {
    bias_score: number;
    rank: number;
    support_score: number;
    vector: string[]
};
