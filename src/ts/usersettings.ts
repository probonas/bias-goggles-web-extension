import { UserSettings } from "./types";

export namespace userSettings {

    export let settingsKey: string = 'settings';

    export function save(method: string, goggles: string,
        limit: number, badgeColor: string, syncEnabled: boolean,
        callback?: () => void) {

        let settings = {} as UserSettings;

        settings[settingsKey] = {
            method: method,
            goggles: goggles,
            forceRefreshLimit: limit,
            deleteAfter: 7,
            badgeColor: badgeColor,
            syncEnabled: syncEnabled

        };

        if (syncEnabled) {
            chrome.storage.sync.set(settings, callback);
        } else {
            chrome.storage.local.set(settings, callback);
        }

    }

    export function get(callback: (item: UserSettings) => void) {
        chrome.storage.local.get(settingsKey, callback);
    };

}