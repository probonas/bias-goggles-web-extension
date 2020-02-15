import "./showNotification";
import "../../src/ts/background";
import { ContextBtnMsg } from "../../src/ts/types";

chrome.browserAction.onClicked.addListener((tab) => {
    chrome.windows.create({
        width: 550,
        height: 800,
        type: "popup",
        url: chrome.runtime.getURL("/popup.html")
    }, (window) => {
        setTimeout(() => {
            chrome.runtime.sendMessage({ updateWindowID: tab.windowId } as ContextBtnMsg);
        },500);
    });
});