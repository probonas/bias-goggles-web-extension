import { UserSettings, UserSettingsMap, Goggle } from "./types";

export namespace userSettings {

    export let settingsKey: string = 'settings';

    export let scoreIndex: number = null;

    export function initScoreIndex(callback?: () => void) {
        get((settings) => {
            scoreIndex = settings.scoreIndex;
            if (callback)
                callback();
        });
    }

    /**
     * Updates and returns the new score index
     */
    export function updateScoreIndex(): number {

        scoreIndex++;

        get((settings) => {
            settings.scoreIndex = scoreIndex;
            update(settings);
        });

        return scoreIndex;
    }

    export function update(settings: UserSettings, callback?: () => void) {
        save(settings.method, settings.goggles, settings.syncEnabled,
            settings.enabled, settings.pagePopoverEnabled,
            settings.scoreIndex, settings.gogglesList, callback);
    }

    export function save(method: string, googlesToUse: string,
        syncEnabled: boolean, enabled: boolean,
        pagePopoverEnabled: boolean, scoreIndex: number,
        gogglesList: Goggle[], callback?: () => void) {

        let settings = {} as UserSettingsMap;

        settings[settingsKey] = {
            method: method,
            goggles: googlesToUse,
            syncEnabled: syncEnabled,
            enabled: enabled,
            scoreIndex: scoreIndex,
            forceOn: false,
            pagePopoverEnabled: pagePopoverEnabled,
            gogglesList: gogglesList
        };

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