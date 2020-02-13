import { ContextBtnMsg } from "./types";
const hoverTimeout = 800; //ms

function elementMouseOver(event: FocusEvent): void {

    if (event.target instanceof HTMLAreaElement || event.target instanceof HTMLAnchorElement) {

        if (event.target.href[0] === '#' || event.target.href[0] === '/'
            || event.target.href.startsWith(window.location.origin)) {
            console.log('skipped for this link....');
            return;
        }

        let stop = 0;
        let sent = false;

        event.target.addEventListener('mouseout', () => {
            stop = 1;
                        
            if(sent)
                chrome.runtime.sendMessage({closeLast: true} as ContextBtnMsg);
        });

        let hasWaited = function (event: FocusEvent) {
            let e = event;

            return function () {

                if (stop) {
                    return;
                }

                //@ts-ignore
                let domain = event.target.href;
                sent = true;
                chrome.runtime.sendMessage({ url: domain } as ContextBtnMsg);
            }
        }

        setTimeout(hasWaited(event), hoverTimeout);
    }

}

//bubble down event
document.body.addEventListener("mouseover", elementMouseOver);