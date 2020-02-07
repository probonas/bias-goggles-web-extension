import { userSettings } from "./usersettings";
const fadein = 800; //ms

function elementMouseOver(event: FocusEvent): void {

    if (event.target instanceof HTMLAreaElement || event.target instanceof HTMLAnchorElement) {

        if (event.target.href[0] === '#' || event.target.href[0] === '/'
            || event.target.href.includes(window.location.origin)) {
            console.log('skipped for this link....');
            return;
        }

        let stop = 0;

        event.target.addEventListener('mouseout', () => {
            stop = 1;
        });

        let hasWaited = function (event: FocusEvent) {
            let e = event;

            return function () {

                if (stop) {
                    return;
                }

                //@ts-ignore
                //let domain = event.target.href;

                userSettings.get((settings) => {
                    if (settings.enabled && settings.pagePopoverEnabled) {
                        //send message to sidebar/popup to show graph for target href!
                    }

                });

            }
        }

        setTimeout(hasWaited(event), fadein);
    }

}

//bubble down event
document.body.addEventListener("mouseover", elementMouseOver);