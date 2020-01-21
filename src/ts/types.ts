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

export type ContextBtnMsg = {
    url: string;
    windowID: number;
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
    gogglesList: Goggle[];
    forceRefreshLimit: number;
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
    vector: string[];
};

export type PopoverAnalytics = {
    userFollowedLink: boolean;
    userHoveredPopover: boolean;
    sourceScoreIndex: number;
    destScoreIndedx: number;
    totalTimeShown: number; //ms
    totalTimeUserHovered: number; //ms
    goggles: string;
}

export type Analytics = {
    [key: string]: AnalyticsData
}

export type AnalyticsData = {
    total: number;
    data: {
        [key: number]: PopoverAnalytics
    };
}
