import Popper, { PopperOptions, Data } from "popper.js";
import { chart } from "./drawchart";
import { ScoreValue, MethodsAndNames } from "./types";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { popoverAnalytics } from "./analytics";
import { extension } from "./storage";
import { userSettings } from "./usersettings";

const popperid = 'bg-popper';
const fadein = 800; //ms
const fadeout = 300; //ms

function createPopover(data: ScoreValue, domain: string, method: string,
    anchorElement: HTMLElement, srcIndex: number, destIndex: number) {
    let popperDiv = document.createElement('div');
    let title = document.createElement('h2');
    let content = document.createElement('div');
    let arrow = document.createElement('div');

    popperDiv.classList.add('bgpopper');
    title.classList.add('bgtitle');
    content.classList.add('bgcontent-wrapper');
    arrow.classList.add('bgarrow');

    popperDiv.id = popperid;
    title.innerText = 'Bias Goggles';

    popperDiv.appendChild(content);
    content.appendChild(title);
    popperDiv.appendChild(arrow);

    document.body.appendChild(popperDiv);

    popoverAnalytics.createNew(() => {

        popoverAnalytics.setSourceScoreIndex(srcIndex); //main frame
        popoverAnalytics.setDestScoreIndex(destIndex); //link

        anchorElement.addEventListener('click', () => {
            popoverAnalytics.userClickedLink();
            popoverAnalytics.save();
        });

        let options: PopperOptions = {
            placement: 'right',
            removeOnDestroy: true,
            modifiers: {
                arrow: {
                    element: arrow
                },
                hovering: {
                    value: false
                }
            },
            onCreate: (data: Data) => {
                console.log('created popover');
                popoverAnalytics.popoverShown()

                popperDiv.addEventListener('mouseenter', () => {

                    data.instance.options.modifiers.hovering.value = true;

                    popoverAnalytics.hoverStarted();

                    popperDiv.addEventListener('mouseleave', () => {
                        popoverAnalytics.hoverEnded();

                        setTimeout(() => {
                            popoverAnalytics.popoverClosed();
                            popoverAnalytics.save();
                            data.instance.destroy();
                        }, fadeout);
                    });

                });
            }
        };

        if (data === null) {
            let err = uncrawled.create404Msg(domain, ['bginfo']);
            content.appendChild(err);

        } else {
            let score = createScoreInfoDiv(data, method);
            content.appendChild(score);

            chart.draw(data.vector, 150, 200, content);
        }

        let popper = new Popper(anchorElement, popperDiv, options);

        anchorElement.addEventListener('mouseleave', () => {

            setTimeout(() => {
                if (!popper.options.modifiers.hovering.value) {
                    popoverAnalytics.popoverClosed();
                    popoverAnalytics.save();
                    popper.destroy();
                }
            }, fadeout);
        });
    });
}

function createScoreInfoDiv(data: ScoreValue, method: string): HTMLElement {

    let scoreWrapper = document.createElement('div');
    scoreWrapper.classList.add('bginfo');
    let scoreText = document.createElement('p');

    let score: string = Math.fround(data.bias_score * 100).toFixed(2);

    scoreText.innerText = 'Score : ' + score;

    let methodInfo = document.createElement('p');
    methodInfo.innerText = 'using ' + MethodsAndNames[method];

    scoreWrapper.appendChild(scoreText);
    scoreWrapper.appendChild(methodInfo);

    return scoreWrapper;
}

function elementMouseOver(event: FocusEvent): void {

    if (event.target instanceof HTMLAreaElement || event.target instanceof HTMLAnchorElement) {
        /*
        if (event.target.href[0] === '#' || event.target.href[0] === '/'
            || event.target.href.includes(window.location.origin)) {
            console.log('skipped for this link....');
            return;
        }
        */

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
                let domain = event.target.href;

                userSettings.get((settings) => {
                    extension.storage.getDomainData(utils.getDomainFromURL(window.location.href), (srcDomainData) => {
                        utils.getBiasData(domain, (data, destIndex) => {
                            createPopover(data.scores[settings.method], domain, settings.method,
                                <HTMLElement>e.target, srcDomainData.scoreIndex, destIndex);
                        });
                    });
                });

            }
        }

        setTimeout(hasWaited(event), fadein);
    }

}

//bubble down event
document.body.addEventListener("mouseover", elementMouseOver);