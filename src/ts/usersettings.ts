import {
    UserSettings, UserSettingsMap, Goggle
} from "./types";
import { service } from "./service"
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
        save(settings.userID, settings.method, settings.goggles, settings.syncEnabled,
            settings.enabled, settings.scoreIndex, settings.gogglesList, callback);
    }

    export function initialize(callback?: () => void) {
        service.getUserID((userID) => {
            service.getDefaultGoggles((goggles) => {
                update({
                    userID: userID,
                    method: 'pr',
                    goggles: goggles[0].id,
                    gogglesList: goggles,
                    syncEnabled: false,
                    scoreIndex: INITIAL_SCORE_INDEX,
                    enabled: true,
                    forceOn: false
                }, callback);
            })
        });
    }

    export function load(callback?: () => void) {
        userSettings.get((settings) => {
            scoreIndex = settings.scoreIndex;
            if (callback)
                callback();
        });
    }

    function save(userID: string, method: string, googlesToUse: string,
        syncEnabled: boolean, enabled: boolean, scoreIndex_: number,
        gogglesList: Goggle[], callback?: () => void) {

        let settings = {} as UserSettingsMap;

        settings[settingsKey] = {
            userID: userID,
            method: method,
            goggles: googlesToUse,
            syncEnabled: syncEnabled,
            enabled: enabled,
            scoreIndex: scoreIndex_,
            forceOn: false,
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