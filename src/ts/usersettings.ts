import { UserSettings, UserSettingsMap } from "./types";

export namespace userSettings {

    export let settingsKey: string = 'settings';

    export function update(settings: UserSettings, callback?: () => void) {
        return save(settings.method, settings.goggles, settings.forceRefreshLimit, settings.syncEnabled,
            settings.enabled, settings.scoreIndex, callback);
    }

    export function save(method: string, goggles: string,
        limit: number, syncEnabled: boolean, enabled: boolean, scoreIndex: number,
        callback?: () => void) {

        let settings = {} as UserSettingsMap;

        settings[settingsKey] = {
            method: method,
            goggles: goggles,
            forceRefreshLimit: limit,
            syncEnabled: syncEnabled,
            enabled: enabled,
            scoreIndex: scoreIndex
        };

        if (syncEnabled) {
            return chrome.storage.sync.set(settings, callback);
        } else {
            return chrome.storage.local.set(settings, callback);
        }

    }

    export function get(callback: (item: UserSettings) => void) {
        chrome.storage.local.get(settingsKey, (settings: UserSettingsMap) => {
            callback(settings[settingsKey]);
        });
    };

}