import { PopoverAnalytics } from "./types";
import { extension } from "./storage";

export namespace popoverAnalytics {

    export let setSourceScoreIndex: (srcIndex: number) => void;
    export let setDestScoreIndex: (destIndex: number) => void;
    export let hoverStarted: () => void;
    export let hoverEnded: () => void;
    export let popoverShown: () => void;
    export let popoverClosed: () => void;
    export let userClickedLink: () => void;
    export let userFollowedLink: () => void;
    export let save: () => void;

    export function initialize() {
        extension.storage.set({ 'analytics': { total: 0, data: {} } });
    }

    /**
     * @param callback an initialized analytics object and the index 
     * this object will have upon save. The latter comes handy when we need to update
     * stored value,e.g. the user hovers on the popover and after the popover closes
     * and we save that information, he also clicks on the link
     */
    export function createNew(callback: () => void) {
        let analytics = {} as PopoverAnalytics;

        analytics.userFollowedLink = false;
        analytics.userHoveredPopover = false;

        analytics.sourceScoreIndex = -1;
        analytics.destScoreIndedx = -1;

        analytics.totalTimeShown = 0;
        analytics.totalTimeUserHovered = 0;

        let entered = 0;

        let advanceIndex = (callback: (index: number) => void) => {
            extension.storage.getAnalytics(item => {
                let storeIndex = item.total++;

                extension.storage.set({ 'analytics': item }, () => {
                    callback(storeIndex);
                });
            });
        }
        advanceIndex((index) => {

            setSourceScoreIndex = (srcIndex: number) => {
                analytics.sourceScoreIndex = srcIndex;
            };

            setDestScoreIndex = (destIndex: number) => {
                analytics.destScoreIndedx = destIndex;
            };

            hoverStarted = () => {
                analytics.userHoveredPopover = true;
                entered = (+ Date.now());
            };

            hoverEnded = () => {
                analytics.totalTimeUserHovered += (+ Date.now()) - entered;
            };

            popoverShown = () => {
                analytics.totalTimeShown = (+ Date.now());
            };

            popoverClosed = () => {
                analytics.totalTimeShown = (+ Date.now()) - analytics.totalTimeShown;
            };

            userClickedLink = () => {
                analytics.userFollowedLink = true;
            };

            save = () => {
                console.log('analytics store');
                extension.storage.getAnalytics(item => {
                    item.data[index] = analytics;
                    extension.storage.set({ 'analytics': item });
                });

            };

            callback();
        });
    }

}