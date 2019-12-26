export enum BiasGogglesAvailable {
    politicalParties = "political-parties",
    footballTeams = "sport-teams"
}

export enum OffOptions {
    ONE_HOUR,
    TWO_HOURS,
    SESSION_ONLY,
    PERMA
};

export enum MessageType {
    WAITING_SERVICE,
    SHOW_DATA,
    SHOW_DATA_FOR_LINK,
    EXT_DISABLED
}

export type Message = {
    type: MessageType;
    data: string;
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
    forceOn: boolean;
    pagePopoverEnabled: boolean;
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
