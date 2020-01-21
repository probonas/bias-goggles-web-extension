
import { templates } from "./templates";
import { Score, Dictionary } from "./types";
import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";

let allGeneric: Array<Card> = new Array();
let allScoreCards: Map<string, ScoreCard> = new Map();
let allCompareCards: Array<CompareCard> = new Array();

let scoreCardsCache: Map<string, ScoreCard> = new Map();

export namespace cards {

    export function getScoreCard(domain: string, forgoggle: string) {
        if (allScoreCards.has(domain + forgoggle))
            return allScoreCards.get(domain + forgoggle);
        else if (scoreCardsCache.has(domain + forgoggle))
            return scoreCardsCache.get(domain + forgoggle);
        else
            throw new Error('card for ' + domain + ' ' + forgoggle + ' not found!');
    }

    export function exists(domain: string, forgoggle: string) {
        return allScoreCards.has(domain + forgoggle);
    }

    export function existsInCache(domain: string, forgoggle: string) {
        return scoreCardsCache.has(domain + forgoggle);
    }


    export function clearAllCards() {
        allGeneric.forEach(card => card.remove());
        allGeneric = new Array();

        allScoreCards.forEach(card => card.remove());
        allScoreCards.clear();

        allCompareCards.forEach(card => card.remove());
        allCompareCards = new Array();
    }

    export function getCardWithID(cardID: string): ScoreCard | null {

        let card = null;

        allGeneric.forEach((value) => {
            if (value.getCardID() === cardID)
                card = value;
        });

        allScoreCards.forEach((value, key) => {
            if (value.getCardID() === cardID)
                card = value;
        });

        scoreCardsCache.forEach((value, key) => {
            if (value.getCardID() === cardID)
                card = value;
        });

        allCompareCards.forEach((value) => {
            if (value.getCardID() === cardID)
                card = value;
        });

        return card;
    }

    export function getAllScoreCards(): Map<string, ScoreCard> {
        let retMap = new Map<string, ScoreCard>();

        allScoreCards.forEach((value, key) => {
            retMap.set(key, value);
        });

        scoreCardsCache.forEach((value, key) => {
            retMap.set(key, value);
        });

        return retMap;
    }

    export function getUniqueID() {
        return (++id);
    }

}

let id = 0;

abstract class Card {
    protected title: string;
    protected cardID: string;
    protected tabID: string;
    protected dismissable: boolean;
    protected tooltipOn: boolean;
    protected comparable: boolean;

    protected stringContent: string;
    protected htmlContent: HTMLElement;

    constructor(tabID: string, dismissable: boolean,
        comparable: boolean, tooltipOn: boolean) {

        this.cardID = (++id).toString();

        this.tabID = tabID;
        this.dismissable = dismissable;
        this.comparable = comparable;
        this.tooltipOn = tooltipOn;

        this.title = null;
        this.stringContent = null;
        this.htmlContent = null;
    }

    public getCardID(): string {
        return this.cardID;
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

    public setTitle(title: string) {
        this.title = title;
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
                });
        }
    }

    public remove() {
        if (document.getElementById(this.cardID))
            document.getElementById(this.cardID).remove();
        else
            console.log('failed to remove ' + this.cardID);
    }

}
export class GenericCard extends Card {
    constructor(tabID: string, tooltipOn: boolean) {
        super(tabID, true, false, tooltipOn);

        allGeneric.push(this);
    }

    public remove() {
        super.remove();

        allGeneric = allGeneric.filter(value => value.getCardID() !== this.cardID);
    }

}

export class ScoreCard extends Card {

    private score: Score;
    private domain: string;

    constructor(tabID: string, tooltipOn: boolean,
        scoreData: Score, domain: string) {
        super(tabID, true, true, tooltipOn);

        this.score = scoreData;
        this.domain = domain;

        this.setStringContent('');
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

    public getScore(): Score {
        return this.score;
    }

    public render() {
        super.render();
        this.setEditBtn();

        allScoreCards.set(this.domain + this.tabID, this);

        //canvas can only be rendered if element is already in the dom
        chart.drawPolar(this.getScoreDataVector(), 440, 680,
            document.getElementById(this.cardID).getElementsByClassName('card-text')[0] as HTMLElement,
            'chart' + this.cardID, true);

    }

    public remove() {
        super.remove();

        allScoreCards.delete(this.domain + this.tabID);
        scoreCardsCache.set(this.domain + this.tabID, this);

        allScoreCards.forEach((value, key) => {
            if (value.getDomain() === this.domain) {
                allScoreCards.delete(key);
                value.remove();
            }
        });

        console.log('removing...');
        console.log(this.domain, this.tabID, this.cardID);
    }

    private setEditBtn() {
        document.getElementById(this.cardID).getElementsByClassName('compare')[0].addEventListener('click', () => {
            let msg = new CustomEvent('compareCard', { detail: this.cardID });
            document.body.dispatchEvent(msg);
        });
    }
}

export class ExtensionDisabledCard extends GenericCard {

    constructor(tabID: string) {
        super(tabID, false);
        this.setTitle('Extension is disabled!');
        this.setStringContent('Enable it, and try again');
    }

}

export class UncrawledDomainCard extends GenericCard {

    constructor(tabID: string, domain: string) {
        super(tabID, false);

        this.setTitle('Too bad... :(');
        this.setHTMLContent(uncrawled.create404Msg(domain, ['text-info']));
    }

}

export class NotAWebpageCard extends GenericCard {

    constructor(tabID: string) {
        super(tabID, false);

        this.setTitle('This isn\'t a webpage!');
        this.setStringContent('');
    }

}

export class SpinnerCard extends GenericCard {
    constructor(tabID: string) {
        super(tabID, false);

        this.setTitle('Requesting data from service...');
        this.setStringContent(templates.get.Spinner());
    }
}

export class CompareCard extends Card {

    private data: Dictionary;
    private comparedDomains: Array<string>;

    constructor(tabID: string, scoreData: Score[],
        urlsForScoredata: Array<string>) {
        super(tabID, true, false, false);

        this.data = {};

        scoreData.forEach((score, index) => {
            let url = urlsForScoredata[index];

            this.data[url] = score.scores['pr'].vector;
        });

        this.comparedDomains = urlsForScoredata;

        this.setStringContent('');
    }

    public getComparedDomains(): Array<string> {
        return this.comparedDomains;
    }

    public remove() {
        super.remove();

        let siblings = allCompareCards.filter((value =>
            value.getComparedDomains() === this.comparedDomains));

        allCompareCards = allCompareCards.filter(value =>
            value.getComparedDomains() !== this.comparedDomains)

        if (siblings)
            siblings.forEach(value => {
                value.remove();
            });
    }

    public render() {
        super.render();

        allCompareCards.push(this);

        chart.drawRadar(this.data, 440, 680,
            document.getElementById(this.cardID).getElementsByClassName('card-text')[0] as HTMLElement,
            'chart' + this.cardID, true);

    }
}