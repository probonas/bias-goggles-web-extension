import { contextBtn } from "../../src/ts/contextMenu";
import { ContextBtnMsg } from "../../src/ts/types";

function open(): Promise<void> {
    let sidebar = browser.sidebarAction.open();

    browser.browserAction.onClicked.removeListener(open);
    browser.browserAction.onClicked.addListener(close);

    return sidebar;
}

function close() {
    browser.sidebarAction.close();
    browser.browserAction.onClicked.removeListener(close);
    browser.browserAction.onClicked.addListener(open);
}

let isOpen = browser.sidebarAction.isOpen({});

isOpen.then((sideBarOpen) => {
    if (sideBarOpen)
        browser.browserAction.onClicked.addListener(close);
    else
        browser.browserAction.onClicked.addListener(open);
});

/* add context btn */
//@ts-ignore
browser.contextMenus.create(contextBtn);

/* add on click handler for previous btn */
browser.contextMenus.onClicked.addListener((info, tab) => {

    open().then(() => {
        browser.runtime.sendMessage({ url: info.linkUrl, senderWindowID: tab.windowId } as ContextBtnMsg);
    });

});