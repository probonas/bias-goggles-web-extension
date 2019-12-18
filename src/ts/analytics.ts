import { PopoverAnalytics } from "./types";
import { extension } from "./storage";

export namespace popoverAnalytics {

    export function initialize() {
        extension.storage.set({ 'analytics': { total: 0, data: {} } });
    }

    /**
     * @param callback an initialized analytics object and the index 
     * this object will have upon save. The latter comes handy when we need to update
     * stored value,e.g. the user hovers on the popover and after the popover closes
     * and we save that information, he also clicks on the link
     */
    export function createNew(callback: (analyticsObj: PopoverAnalytics, index: number) => void) {
        let analytics = {} as PopoverAnalytics;

        analytics.userFollowedLink = false;
        analytics.userHoveredPopover = false;
        analytics.sourceScoreIndex = -1;
        analytics.destScoreIndedx = -1;
        analytics.totalTimeShown = -1;
        analytics.totalTimeUserHovered = -1;

        extension.storage.getAnalytics(items => {
            let oldIndex = items.total;
            advanceIndex(() => {
                callback(analytics, oldIndex)
            });
        });
    }

    function advanceIndex(callback: () => void) {
        extension.storage.getAnalytics(item => {
            item.total++;
            extension.storage.set({ 'analytics': item }, callback);
        });
    }

    export function update(analytics: PopoverAnalytics, currentIndex: number) {
        console.log('analytics store');
        console.log(analytics);
        extension.storage.getAnalytics(item => {
            item.data[currentIndex] = analytics;
            extension.storage.set({ 'analytics': item });
        });
    }
}