import { get as httpGet } from "http";
import { extension } from "./storage"
import { userSettings } from "./usersettings";

export namespace service {

    function getRequestURL(domain: string, goggles: string): string {

        const prefix = 'http://139.91.183.23:3000/results?domain=';

        const suffix = '&bc=' + goggles;

        return prefix + encodeURIComponent(domain) + suffix;
    }

    export function query(activeTab: string, callback?: (data: any) => void): void {

        let data: any = '';

        console.log('requesting: ' + activeTab);

        userSettings.get((settings) => {
            let targetURL = getRequestURL(activeTab, settings[userSettings.settingsKey].goggles);

            httpGet(targetURL, res => {

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('close', () => {
                    if (res.statusCode !== 200) {
                        console.log('HTTP Status code ' + res.statusCode);
                        callback(null);
                        return;
                    }

                    callback(data);

                    //updateBadge(getDomainFromURL(activeTab), userSetttings.getMethod());
                });
            });
        });

    }
}