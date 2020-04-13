import {
    UserSettings, UserSettingsMap, Goggle, Algorithm
} from "./types";
import { service } from "./service"

export namespace userSettings {

    export const INITIAL_SCORE_INDEX = 0;
    export const settingsKey = 'settings';
    export let DEFAULT_ALG = '';

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
        save(settings.userID, settings.method, settings.syncEnabled, settings.enabled,
            settings.scoreIndex, settings.googlesUsing, settings.gogglesList, settings.algs, callback);
    }

    export function initialize(callback?: () => void) {
        service.getUserID((userID) => {
            service.getDefaultGoggles((goggles) => {
                service.getAvailablesAlgorithms((algs) => {
                    //DEFAULT_ALG = algs.filter(arg => arg.name.toLowerCase().includes('pagerank'))[0].id;
                    DEFAULT_ALG = '3a16ca06-3525-417f-b743-06f9845dfe1b';
                    update({
                        userID: userID,
                        method: DEFAULT_ALG,
                        gogglesList: goggles,
                        googlesUsing: new Array<Goggle>(),
                        algs: algs,
                        syncEnabled: false,
                        scoreIndex: INITIAL_SCORE_INDEX,
                        enabled: true,
                        forceOn: false
                    }, callback);
                })
            });
        });
    }

    export function load(callback?: () => void) {
        service.getAvailablesAlgorithms((algs) => {
            userSettings.get((settings) => {
                if (algs)
                    settings.algs = algs;

                userSettings.update(settings, () => {
                    scoreIndex = settings.scoreIndex;
                    DEFAULT_ALG = settings.method;

                    if (callback)
                        callback();
                });
            });
        });
    }

    function save(userID: string, method: string, syncEnabled: boolean,
        enabled: boolean, scoreIndex_: number, gogglesUsing: Array<Goggle>,
        gogglesList: Goggle[], algs: Algorithm[], callback?: () => void) {

        let settings = {} as UserSettingsMap;

        settings[settingsKey] = {
            userID: userID,
            method: method,
            syncEnabled: syncEnabled,
            enabled: enabled,
            scoreIndex: scoreIndex_,
            forceOn: false,
            gogglesList: gogglesList,
            googlesUsing: gogglesUsing,
            algs: algs
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

    export function addToSelectedGoggles(goggle: Goggle, callback: () => void) {
        userSettings.get((item) => {
            let found = item.googlesUsing.find((value) => { return value.id === goggle.id });
            if (!found) {
                item.googlesUsing.push(goggle);
                userSettings.update(item, callback);
            } else {
                callback();
            }
        });
    }

    export function removeFromSelectedGoggles(goggle: Goggle, callback: () => void) {
        userSettings.get((item) => {
            item.googlesUsing = item.googlesUsing.filter((value) => { return value.id !== goggle.id });
            userSettings.update(item, callback);
        });
    }
}