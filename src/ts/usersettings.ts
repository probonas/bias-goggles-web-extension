import { UserSettings, UserSettingsMap, Goggle } from "./types";
import { ScoreCard } from "./infoCard";

export namespace userSettings {

    export let settingsKey: string = 'settings';

    export function update(settings: UserSettings, callback?: () => void) {
        return save(settings.method, settings.goggles, settings.forceRefreshLimit,
            settings.syncEnabled, settings.enabled, settings.pagePopoverEnabled,
            settings.scoreIndex, settings.gogglesList, callback);
    }

    export function save(method: string, googlesToUse: string,
        limit: number, syncEnabled: boolean, enabled: boolean,
        pagePopoverEnabled: boolean, scoreIndex: number,
        gogglesList: Goggle[], callback?: () => void) {

        let settings = {} as UserSettingsMap;

        settings[settingsKey] = {
            method: method,
            goggles: googlesToUse,
            forceRefreshLimit: limit,
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

    export function updateScoreIndex(callback: (settings: UserSettings) => void) {
        userSettings.get((settings) => {
            settings.scoreIndex++;
            userSettings.update(settings, () => {
                callback(settings);
            });
        });
    }
}