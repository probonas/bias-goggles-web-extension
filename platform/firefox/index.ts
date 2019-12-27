import "./openSidebar";
import "../../src/ts/background";

let panel = browser.runtime.getURL("/popup.html");

chrome.tabs.onActivated.addListener((activeTabInfo) => {
    browser.sidebarAction.setPanel({tabId: activeTabInfo.tabId, panel: panel});
});