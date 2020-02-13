import {
    UserSettings, UserSettingsMap, Goggle,
    PoliticalParties, SportsTeams
} from "./types";

export namespace userSettings {

    export const INITIAL_SCORE_INDEX = 0;
    export const settingsKey = 'settings';

    let scoreIndex: number = null;

    /**
     * Updates and returns the new score index
     */
    export function updateScoreIndex(): number {

        get((settings) => {
            settings.scoreIndex = scoreIndex;
            update(settings);
        });

        return scoreIndex++;
    }

    export function update(settings: UserSettings, callback?: () => void) {
        save(settings.method, settings.goggles, settings.syncEnabled,
            settings.enabled, settings.pagePopoverEnabled,
            settings.scoreIndex, settings.gogglesList, callback);
    }

    export function initialize(callback?: () => void) {
        let defaultSettings = {
            method: 'pr',
            goggles: PoliticalParties.id,
            gogglesList: [PoliticalParties, SportsTeams],
            syncEnabled: false,
            scoreIndex: INITIAL_SCORE_INDEX,
            enabled: true,
            forceOn: false,
            pagePopoverEnabled: false
        };

        update(defaultSettings, callback);
    }

    export function load(callback?: () => void) {
        userSettings.get((settings) => {
            scoreIndex = settings.scoreIndex;
            if (callback)
                callback();
        });
    }

    function save(method: string, googlesToUse: string,
        syncEnabled: boolean, enabled: boolean,
        pagePopoverEnabled: boolean, scoreIndex_: number,
        gogglesList: Goggle[], callback?: () => void) {

        let settings = {} as UserSettingsMap;

        settings[settingsKey] = {
            method: method,
            goggles: googlesToUse,
            syncEnabled: syncEnabled,
            enabled: enabled,
            scoreIndex: scoreIndex_,
            forceOn: false,
            pagePopoverEnabled: pagePopoverEnabled,
            gogglesList: gogglesList
        };

        scoreIndex = scoreIndex_;

        if (syncEnabled) {
            chrome.storage.sync.set(settings, callback);
        } else {
            chrome.storage.local.set(settings, callback);
        }

    }

    export function get(callback: (item: UserSettings) => void) {
        chrome.storage.local.get(settingsKey, (settings: UserSettingsMap) => {
            callback(settings[settingsKey]);
        });
    };

}