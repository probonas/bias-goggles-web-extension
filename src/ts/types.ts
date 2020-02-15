export let PoliticalParties: Goggle = {
    description: 'A goggle about political parties in Greece',
    name: 'Political Parties [GR]',
    id: 'political-parties'
}

export let SportsTeams: Goggle = {
    description: 'A goggle about sports teams in Greece',
    name: 'Sports Teams [GR]',
    id: 'sport-teams'
}

export type Goggle = {
    description: string,
    name: string,
    id: string //tag as used by service
};

export enum OffOptions {
    ONE_HOUR,
    TWO_HOURS,
    SESSION_ONLY,
    PERMA
};

export const EXTENSION_DISABLED = -1;
export const UNCRAWLED_URL = -2
export const INVALID_URL = -3;

export type ContextBtnMsg = {
    url: string;
    closeLast: boolean;
    senderWindowID: number;
    updateWindowID: number;
}

export interface UserSettingsMap {
    [key: string]: UserSettings;
}

export interface UserSettings {
    method: string;
    goggles: string;
    gogglesList: Goggle[];
    syncEnabled: boolean;
    enabled: boolean;
    scoreIndex: number;
    forceOn: boolean;
    pagePopoverEnabled: boolean;
}

export type AppData = {
    [key: string]: DomainData | Score;
}

export type Dictionary = {
    [key: string]: any;
}

export type DomainData = {
    scoreIndex: number;
    prevIndices: Array<number>
}

export type Score = {
    date: number; //ms since UTC epoch
    scores: Scores;
    goggle: string;
    hits: number;
};

type Scores = {
    [key: string]: ScoreValue
}

export type ScoreValue = {
    bias_score: number;
    support_score: number;
    vector: string[];
};

export type MinMaxAvgScores = {
    [key: number]: PerGoggle
}

type PerGoggle = {
    [key: string]: PerMethodValue
}

type PerMethodValue = {
    [key: string]: MinMaxAvgScoreValue
}

type MinMaxAvgScoreValue = {
    maxBias: number,
    minBias: number,
    avgBias: number,

    maxSupport: number,
    minSupport: number,
    avgSupport: number,

    totalEntries: number
}