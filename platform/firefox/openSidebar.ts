import { contexBtn } from "../../src/ts/contextMenu";

function open() {
    browser.sidebarAction.open();
    browser.browserAction.onClicked.removeListener(open);
    browser.browserAction.onClicked.addListener(close);
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
chrome.contextMenus.create(contexBtn);

/* add on click handler for previous btn */
browser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case contexBtn.id:
            open();
            break;
    }
});