
import { templates } from "./templates";
import { Score } from "./types";
import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";

abstract class Card {
    protected title: string;
    protected cardID: string;
    protected tabID: string;
    protected dismissable: boolean;
    protected tooltipOn: boolean;
    protected comparable: boolean;

    protected stringContent: string;
    protected htmlContent: HTMLElement;

    constructor(cardID: string, tabID: string, dismissable: boolean, comparable: boolean, tooltipOn: boolean) {
        this.cardID = cardID;
        this.tabID = tabID;
        this.dismissable = dismissable;
        this.tooltipOn = tooltipOn;

        this.comparable = comparable;
        this.title = null;
        this.stringContent = null;
        this.htmlContent = null;
    }

    public getTabID(): string {
        return this.tabID;
    }

    public setStringContent(contents: string) {
        this.stringContent = contents;
    }

    public setHTMLContent(contents: HTMLElement) {
        this.htmlContent = contents;
    }

    public render() {
        let pos = document.getElementById(this.tabID);

        if (!pos)
            throw new Error('Tab with id:' + this.tabID + ' could not be found!');

        if (!this.title)
            throw new Error('No title set for card with id:' + this.cardID);

        if (this.stringContent === null && this.htmlContent === null)
            throw new Error('No contents set for card with id:' + this.cardID);

        if (this.stringContent !== null) {
            let card = templates.get.InnerCard(this.title, this.stringContent, this.cardID, this.tooltipOn, this.dismissable, this.comparable);
            pos.insertAdjacentHTML('beforeend', card);
        } else {
            let card = templates.get.InnerCard(this.title, '', this.cardID, this.tooltipOn, this.dismissable, this.comparable);
            pos.insertAdjacentHTML('beforeend', card);
            document.getElementById(this.cardID).getElementsByClassName('card-text')[0].appendChild(this.htmlContent);
        }

        if (this.dismissable) {

            (<HTMLButtonElement>document.getElementById(this.cardID).
                getElementsByClassName('_close')[0]).addEventListener('click', () => {
                    this.remove();
                    let msg = new CustomEvent('closedCard', { detail: this.cardID });
                    document.body.dispatchEvent(msg);
                });
        }
    }

    public remove() {
        if (document.getElementById(this.cardID))
            document.getElementById(this.cardID).remove();
    }

}
export class GenericCard extends Card {
    constructor(cardID: string, tabID: string, tooltipOn: boolean) {
        super(cardID, tabID, true, false, tooltipOn);
    }

    public setTitle(title: string) {
        this.title = title;
    }
}

export class ScoreCard extends Card {

    private score: Score;
    private domain: string;

    constructor(cardID: string, tabID: string, tooltipOn: boolean,
        scoreData: Score, domain: string) {
        super(cardID, tabID, true, true, tooltipOn);

        this.score = scoreData;
        this.domain = domain;
    }

    public setTitle(title: string) {
        this.title = templates.get.TitleWithScores(title,
            this.score.scores['pr'].bias_score,
            this.score.scores['pr'].support_score);
    }

    private getScoreDataVector(): string[] {
        return this.score.scores['pr'].vector;
    }

    public getDomain(): string {
        return this.domain;
    }

    public getCardID(): string {
        return this.cardID;
    }

    public render() {
        super.render();
        this.setEditBtn();

        //canvas can only be rendered if element is already in the dom
        chart.draw(this.getScoreDataVector(), 440, 680,
            document.getElementById(this.cardID).getElementsByClassName('card-text')[0] as HTMLElement,
            'chart' + this.cardID, true);

    }

    private setEditBtn() {
        document.getElementById(this.cardID).getElementsByClassName('compare')[0].addEventListener('click', () => {
            let msg = new CustomEvent('compareCard', { detail: this.cardID });
            document.body.dispatchEvent(msg);
        });
    }
}

export class ExtensionDisabledCard extends GenericCard {

    constructor(cardID: string, tabID: string) {
        super(cardID, tabID, false);
        this.setTitle('Extension is disabled!');
        this.setStringContent('Enable it, and try again');
    }

}

export class UncrawledDomainCard extends GenericCard {

    constructor(cardID: string, tabID: string, domain: string) {
        super(cardID, tabID, false);

        this.setTitle('Too bad... :(');
        this.setHTMLContent(uncrawled.create404Msg(domain, ['text-info']));
    }

}

export class NotAWebpageCard extends GenericCard {

    constructor(cardID: string, tabID: string) {
        super(cardID, tabID, false);

        this.setTitle('This isn\'t a webpage!');
        this.setStringContent('');
    }

}

export class SpinnerCard extends GenericCard {
    constructor(cardID: string, tabID: string) {
        super(cardID, tabID, false);

        this.setTitle('Requesting data from service...');
        this.setStringContent(templates.get.Spinner());
    }
}