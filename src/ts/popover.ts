import Popper from "popper.js";
import { chart } from "./drawchart";
import { ExtRequest, ExtResponse, RequestMessage, DomainData, AppData, MethodsAndNames } from "./types";
import { uncrawled } from "./uncrawled";

const popperid = 'bg-popper';
const timeout = 500; //ms
let focus = 0;

function createPopover(response: AppData, method: string, anchorElement: HTMLElement) {
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

    anchorElement.appendChild(popperDiv);

    if (response.appdata === null) {

        let err = uncrawled.create404Msg(response.domain, ['bginfo']);
        content.appendChild(err);

        new Popper(anchorElement, popperDiv, {
            placement: 'right',
            modifiers: {
                arrow: {
                    element: arrow
                }
            },
            onUpdate: function (data) {
                console.log(data.arrowElement);
            }
        });

    } else {
        let score = createScoreInfoDiv(response.appdata, method);
        score.classList.add('bginfo');
        content.appendChild(score);

        //@ts-ignore
        chart.draw(response.appdata[method].vector, 150, 200, content);
        new Popper(anchorElement, popperDiv, {
            placement: 'right',
            modifiers: {
                arrow: {
                    element: arrow
                }
            },
            onUpdate: function (data) {
                console.log(data.arrowElement);
            }
        });
    }
}

function createScoreInfoDiv(data: DomainData, method: string): HTMLElement {

    let scoreWrapper = document.createElement('div');
    let scoreText = document.createElement('p');

    //@ts-ignore
    let score: string = data[method].bias_score;
    score = Math.fround(parseFloat(score) * 100).toFixed(2);

    scoreText.innerText = 'Bias Score : ' + score;

    let methodInfo = document.createElement('p');
    methodInfo.classList.add("bginfo");
    methodInfo.innerText = 'using ' + MethodsAndNames[method];

    scoreWrapper.appendChild(scoreText);
    scoreWrapper.appendChild(methodInfo);

    return scoreWrapper;
}

function checkifUserWaited(event: FocusEvent) {
    let e = event;

    return function () {
        if (focus === 0) {
            return;
        }

        //@ts-ignore
        chrome.runtime.sendMessage(new ExtRequest([RequestMessage.GET_DEFAULT_STATS], e.target.href), (response) => {
            createPopover(response.data, <string>response.extra, <HTMLElement>e.target);
            e.target.addEventListener('mouseleave', closePopper);
        });
    }
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
        focus = new Date().getMilliseconds();
        setTimeout(checkifUserWaited(event), timeout);
    }

}

function closePopper() {
    if (document.getElementById(popperid))
        document.getElementById(popperid).remove();
}

//bubble down event
document.body.addEventListener("mouseover", elementMouseOver);
//bubble up event
document.body.addEventListener("mouseout", () => { focus = 0; });