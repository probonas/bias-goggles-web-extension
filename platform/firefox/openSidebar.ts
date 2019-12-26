import { contexBtn } from "../../src/ts/contextMenu";
import { MessageType } from "../../src/ts/types";

/* https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/User_actions */
function open(){
    browser.sidebarAction.open();
    browser.browserAction.onClicked.addListener(close);    
}

function close(){
    browser.sidebarAction.close();
    browser.browserAction.onClicked.addListener(open);
}

browser.browserAction.onClicked.addListener(close);
/* */

chrome.contextMenus.create(contexBtn);

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case contexBtn.id:
            chrome.runtime.sendMessage({ type: MessageType.SHOW_DATA_FOR_LINK, data: info.linkUrl });
            browser.sidebarAction.open();
            console.log('sent event for ' + info.linkUrl);
            break;
    }
});