import { Goggle } from "./types";
import { userSettings } from "./usersettings";
import { extension } from "./storage";

export namespace goggles {
    /**
     * Install new goggles for user
     * 
     * @param goggles goggles to add to user's goggle list
     * @param callback function to call after goggles have been installed
     */
    export function add(goggles: Goggle, callback?: () => void) {
        userSettings.get(settings => {
            settings.gogglesList.push(goggles);
            userSettings.update(settings, callback);
        });
    }

    /**
     * Removes goggles from user's goggle list and removes all relevanta data from storage
     * @param gogglesID id of goggles to delete
     * @param callback function to call after goggles have been uninstalled
     */
    export function remove(gogglesID: string, callback?: () => void) {
        userSettings.get(settings => {
            settings.gogglesList = settings.gogglesList.filter(value => value.id != gogglesID);
            extension.storage.getAllDomainDataPartialKey(gogglesID, (domainData) => {
                if (domainData)
                    domainData.forEach((value, key) => {
                        extension.storage.remove(value.scoreIndex.toString());

                        if (value.prevIndices)
                            value.prevIndices.forEach(prev => {
                                extension.storage.remove(prev.toString());
                            });

                        extension.storage.remove(key);
                    });
            });
            userSettings.update(settings, callback);
        });
    }

    /**
     * User defined goggle need some time before they are ready for use. When they become
     * available this should be called and to activate them and star using them.
     * 
     * @param goggles google to activate
     * @param callback function to call after goggles have been activated
     */
    export function activate(goggles: Goggle, callback?: () => void) {
        userSettings.get(settings => {
            settings.gogglesList.forEach(value => {
                if (value.id === goggles.id)
                    value.ready = true;
            });

            userSettings.update(settings, callback);
        });
    }
}