import Popper, { PopperOptions, Data } from "popper.js";
import { chart } from "./drawchart";
import { ScoreValue, MethodsAndNames } from "./types";
import { uncrawled } from "./uncrawled";
import { utils } from "./utils";
import { popoverAnalytics } from "./analytics";
import { extension } from "./storage";
import { userSettings } from "./usersettings";
import { settings } from "cluster";

const popperid = 'bg-popper';
const fadein = 800; //ms
const fadeout = 300; //ms

export namespace popover {

    export function show(anchorElement: HTMLElement, method: string) {
        let domain = (<HTMLAnchorElement>anchorElement).href;
        let popperDiv: HTMLElement;
        let arrow: HTMLElement;
        let scoreData: ScoreValue;
        let popper: Popper;

        let createDiv = () => {
            popperDiv = document.createElement('div');
            document.body.appendChild(popperDiv);

            let title = document.createElement('h2');
            let content = document.createElement('div');
            arrow = document.createElement('div');

            popperDiv.classList.add('bgpopper');
            title.classList.add('bgtitle');
            content.classList.add('bgcontent-wrapper');
            arrow.classList.add('bgarrow');

            popperDiv.id = popperid;
            title.innerText = 'Bias Goggles';

            popperDiv.appendChild(content);
            content.appendChild(title);

            popperDiv.appendChild(arrow);
            addGraph(content);
        };

        let createScoreInfoDiv = () => {
            let scoreWrapper = document.createElement('div');
            scoreWrapper.classList.add('bginfo');
            let scoreText = document.createElement('p');

            let score: string = Math.fround(scoreData.bias_score * 100).toFixed(2);

            scoreText.innerText = 'Score : ' + score;

            let methodInfo = document.createElement('p');
            methodInfo.innerText = 'using ' + MethodsAndNames[method];

            scoreWrapper.appendChild(scoreText);
            scoreWrapper.appendChild(methodInfo);

            return scoreWrapper;
        }

        let getSettings = (): PopperOptions => {
            return {
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
                    popoverAnalytics.popoverShown();

                    popperDiv.addEventListener('mouseenter', () => {

                        data.instance.options.modifiers.hovering.value = true;
                        popoverAnalytics.hoverStarted();

                        popperDiv.addEventListener('mouseleave', () => {
                            data.instance.options.modifiers.hovering.value = false;
                            popoverAnalytics.hoverEnded();
                            data.instance.destroy();
                        });

                    });
                }
            };
        }

        let addGraph = (div: HTMLElement) => {
            if (scoreData === null) {
                let err = uncrawled.create404Msg(domain, ['bginfo']);
                div.appendChild(err);
            } else {
                let score = createScoreInfoDiv();
                div.appendChild(score);

                chart.draw(scoreData.vector, 150, 200, div, 'chart');
            }

            popper = new Popper(anchorElement, popperDiv, getSettings());
            popper.destroy = () => {
                setTimeout(() => {
                    if (!popper.options.modifiers.hovering.value) {
                        document.getElementById(popperid).remove();
                        popoverAnalytics.popoverClosed();
                        popoverAnalytics.save();
                        anchorElement.removeEventListener('click', clickedLinkCallback);
                        anchorElement.removeEventListener('mouseleave', outOfLinkCallback);
                    }
                }, fadeout);
            };

            anchorElement.addEventListener('click', clickedLinkCallback);
            anchorElement.addEventListener('mouseleave', outOfLinkCallback);
        };

        let clickedLinkCallback = () => {
            popoverAnalytics.userClickedLink();
        };

        //user didn't hover and didn't click on the link also
        let outOfLinkCallback = () => {
            popper.destroy();

        };

        let pageDomain = utils.getDomainFromURL(window.location.href);

        userSettings.get((settings) => {
            extension.storage.getDomainData(pageDomain, settings.goggles, (srcDomainData) => {
                utils.getBiasDataForGoggles(domain, settings.goggles,(data, destIndex) => {
                    scoreData = data.scores[method];
                    popoverAnalytics.createNew(() => {
                        createDiv();
                        popoverAnalytics.setSourceScoreIndex(srcDomainData.scoreIndex);  //main frame
                        popoverAnalytics.setDestScoreIndex(destIndex);                   //link
                    });
                });
            });
        });
    }

}

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
                        popover.show(<HTMLElement>e.target, settings.method);
                    }

                });

            }
        }

        setTimeout(hasWaited(event), fadein);
    }

}

//bubble down event
document.body.addEventListener("mouseover", elementMouseOver);