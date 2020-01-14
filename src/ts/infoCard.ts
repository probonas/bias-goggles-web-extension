
import { templates } from "./templates";

abstract class Card {
    protected title: string;
    protected cardID: string;
    protected tabID: string;
    protected dismissable: boolean;
    protected tooltipOn: boolean;

    protected stringContent: string;
    protected htmlContent: HTMLElement;

    constructor(cardID: string, tabID: string, dismissable: boolean, tooltipOn: boolean) {
        this.cardID = cardID;
        this.tabID = tabID;
        this.dismissable = dismissable;
        this.tooltipOn = tooltipOn;

        this.title = null;
        this.stringContent = null;
        this.htmlContent = null;
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
            let card = templates.get.InnerCard(this.title, this.stringContent, this.cardID, this.tooltipOn, this.dismissable);
            pos.insertAdjacentHTML('beforeend', card);
        } else {
            let card = templates.get.InnerCard(this.title, '', this.cardID, this.tooltipOn, this.dismissable);
            pos.insertAdjacentHTML('beforeend', card);
            document.getElementById(this.cardID).getElementsByClassName('card-text')[0].appendChild(this.htmlContent);
        }

        if (this.dismissable) {
            (<HTMLButtonElement>document.getElementById(this.cardID).firstElementChild.firstElementChild).addEventListener('click', () => {
                document.getElementById(this.cardID).parentElement.parentElement.remove();
            });
        }
    }

    public delete() {
        document.getElementById(this.cardID).remove();
    }

}
export class GenericCard extends Card {
    public setTitle(title: string) {
        this.title = title;
    }
}
export class ScoreCard extends Card {

    public setTitle(title: string, biasScore?: string, supportScore?: string) {
        this.title = templates.get.TitleWithScores(title, biasScore, supportScore);
    }
}
