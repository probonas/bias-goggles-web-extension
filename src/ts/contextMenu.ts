import { MessageType } from "./types";

chrome.contextMenus.create({
    id: 'bg-show-data-for-link',
    title: 'Show Bias Data for Link',
    contexts: ['link'],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'bg-show-data-for-link':
            chrome.runtime.sendMessage({ type: MessageType.SHOW_DATA_FOR_LINK, data: info.linkUrl });
            //browser.sideBarAction.open(); 
            console.log('sent event for ' + info.linkUrl);
            break;
        default:
            console.error('No menu item with id' + info.menuItemId + ' was found!');
            break;
    }
});