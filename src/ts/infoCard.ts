
import { templates } from "./templates";
import { Score, Dictionary } from "./types";
import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";
import { extension } from "./storage";
import { goggles } from "./goggles";
import { utils } from "./utils";
import { Goggle } from "./types";
import { userSettings } from "./usersettings";

const pollingInterval = 10; //ms

const canvasWidth = 400;
const canvasHeight = canvasWidth;

let groups = new Set<string>();
let id = 0;

export namespace cards {

    export function clearAllCards() {
        console.log('clearing cards!');

        groups.forEach(group => {
            let cards = getAllCardForGroup(group);

            for (let i = 0; i < cards.length; i++)
                cards[i].remove();
        });

        groups.clear();
    }

    export function getUniqueID() {
        return (++id);
    }

    export function getCardData(cardID: string): string {
        if (document.getElementById(cardID)) {
            return document.getElementById(cardID).dataset.group;
        }
        else
            throw new Error('no card with id ' + cardID + ' was found');
    }

    export function getAllCardForGroup(group: string) {
        return document.querySelectorAll('[data-group=\"' + group + '\"]');
    }
}

abstract class Card {
    //unique id of card in dom
    protected cardID: string;
    //tab this card belongs to
    protected tabID: string;

    constructor(tabID: string) {
        this.tabID = 'content' + tabID;
        this.cardID = (++id).toString();
    }

    public abstract render(): void;
}

/**
 * An abstract class representing a card shown under Explore Tab
 */
abstract class ExploreCard extends Card {
    //title show
    protected title: string;

    //if true, show X icon on the card
    protected dismissable: boolean;
    //if true and if title is very long, it's trimmed so as so to fit in card and a tooltip with the full title is shown on hover
    protected tooltipOn: boolean;
    //if true the compare icon is shown on card
    protected comparable: boolean;

    //card groups are used to identify cards belonging to the same domain across tabs
    protected group: string;

    //A card can have either a string or html as its content
    protected stringContent: string;
    protected htmlContent: HTMLElement;

    constructor(tabID: string, group: string, dismissable: boolean,
        comparable: boolean, tooltipOn: boolean) {
        super(tabID);

        this.group = group;

        this.dismissable = dismissable;
        this.comparable = comparable;
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

    protected setTitle(title: string) {
        this.title = title;
    }

    /**
     * Main rendering function.
     * If no title is set an expection is thrown
     * If no stringcontent of htmlContent is set an expection is thrown.
     * All subclasses should call this before implementing their own logic.
     */

    public render() {
        let pos = document.getElementById(this.tabID);

        if (!pos)
            throw new Error('Tab with id:' + this.tabID + ' could not be found!');

        if (!this.title)
            throw new Error('No title set for card with id:' + this.cardID);

        if (this.stringContent === null && this.htmlContent === null)
            throw new Error('No contents set for card with id:' + this.cardID);

        if (this.stringContent !== null) {
            let card = templates.InnerCard(this.title, this.stringContent, this.cardID, this.tooltipOn, this.dismissable, this.comparable);
            pos.insertAdjacentHTML('afterbegin', card);
        } else {
            let card = templates.InnerCard(this.title, '', this.cardID, this.tooltipOn, this.dismissable, this.comparable);
            pos.insertAdjacentHTML('afterbegin', card);
            document.getElementById(this.cardID).getElementsByClassName('card-text')[0].appendChild(this.htmlContent);
        }

        //group is added as
        document.getElementById(this.cardID).dataset.group = this.group;
        groups.add(this.group);

        //fade in
        setTimeout(() => {
            if (document.getElementById(this.cardID) && document.getElementById(this.cardID).children[1])
                document.getElementById(this.cardID).children[1].classList.add('show');
        }, 250);

        //add listener on X button of card
        (<HTMLButtonElement>document.getElementById(this.cardID).getElementsByClassName('_close')[0])
            .addEventListener('click', () => {
                document.getElementById(this.cardID).children[1].classList.remove('show');
                document.getElementById(this.cardID).children[1].classList.add('hide');

                setTimeout(() => {
                    //dom remove
                    if (document.getElementById(this.cardID))
                        document.getElementById(this.cardID).remove();

                    //retrieve all cards in the same group and remove them
                    let siblings = cards.getAllCardForGroup(this.group);

                    for (let i = 0; i < siblings.length; i++)
                        siblings[i].remove();

                    //remove this group from groups as all its cards have been removed
                    groups.delete(this.group);
                }, 200);

            });
    }

    //simulate clicking so as to remove card gently
    public remove() {
        (<HTMLButtonElement>document.getElementById(this.cardID).
            getElementsByClassName('_close')[0]).click();
    }

}

/**
 * All cards that don't show any score data are generic cards
 */
abstract class GenericCard extends ExploreCard {

    constructor(tabID: string, group: string, tooltipOn: boolean) {
        super(tabID, group, true, false, tooltipOn);
    }

}

/**
 * A score card for a domain.
 * Admissible and comparable
 */
export class ScoreCard extends ExploreCard {
    private score: Score;
    private ready: boolean; //are score data ready to be rendered?

    constructor(goggles: string, tooltipOn: boolean, domain: string) {
        super(goggles, domain, true, true, tooltipOn);

        this.ready = false;

        extension.storage.getLatestScoreData(domain, goggles, (score) => {
            this.score = score;
            this.setTitle(templates.TitleWithScores(domain, this.score.scores[userSettings.DEFAULT_ALG].bias_score, this.score.scores[userSettings.DEFAULT_ALG].support_score));
            this.ready = true;
        });

        this.setStringContent('');
    }

    protected setTitle(title: string) {
        this.title = title;
    }

    private getScoreDataVector(): { [key: string]: number } {

        //console.log('==============score vector==============');
        //console.log(userSettings.DEFAULT_ALG);
        //console.log(this.group);
        //console.log(this.tabID);
        //console.log(this.score);
        //console.log('Default alg ', userSettings.DEFAULT_ALG);
        //console.log('==============end==============');

        return this.score.scores[userSettings.DEFAULT_ALG].vector;
    }

    /**
     * Render is run only when score data are retrieved from storage.
     * Note that there is no error handling in case data doesn't exist.
     * That is left up to the caller.
     */
    public render() {
        let handle = setInterval(() => {

            if (this.ready) {
                clearInterval(handle);

                super.render();

                this.addCompareBtn();

                //canvas can only be rendered if element is already in the dom
                chart.drawPolar(this.getScoreDataVector(), canvasWidth, canvasHeight,
                    document.getElementById(this.cardID).getElementsByClassName('card-text')[0] as HTMLElement,
                    'chart' + this.cardID, true);

                this.score = null;
            }
        }, pollingInterval);
    }

    private addCompareBtn() {
        document.getElementById(this.cardID).getElementsByClassName('compare')[0].addEventListener('click', () => {
            //send message to signal the card that started comparison
            let msg = new CustomEvent('compareCard', { detail: this.group });
            document.body.dispatchEvent(msg);
        });
    }

}

/**
 * Card shown when domain is requested but extension is disabled
 */
export class ExtensionDisabledCard extends GenericCard {

    constructor(tabID: string) {
        super(tabID, 'extension-disabled', false);
        this.setTitle('Extension is disabled!');
        this.setStringContent('Enable it, and try again');
    }

}

/**
 * Card shown when there are no data in service for a particular domain
 */
export class UncrawledDomainCard extends GenericCard {

    constructor(tabID: string, domain: string) {
        super(tabID, 'uncrawled-' + domain, false);

        this.setTitle('&#128561; Saved for future crawling!');
        this.setHTMLContent(uncrawled.create404Msg(domain, ['text-info']));
    }

}

/**
 * Card with a generic message
 */
export class GenericMessageCard extends GenericCard {

    constructor(tabID: string, cardTitle: string, cardMsg: string) {
        super(tabID, 'generic-card' + cards.getUniqueID(), false);
        this.setTitle(cardTitle);
        this.setStringContent(cardMsg);
    }
}

/**
 * Card shown when requesting data for a non www page
 */
export class NotAWebpageCard extends GenericCard {

    constructor(tabID: string) {
        super(tabID, 'notawebpage', false);

        this.setTitle('&#129327; This isn\'t a webpage!');
        this.setStringContent('');
    }

}

/**
 * Card showing a spinner when something is loading
 */
export class SpinnerCard extends GenericCard {

    constructor(tabID: string) {
        super(tabID, 'spinner', false);

        this.setTitle('Requesting data from service...');
        this.setStringContent(templates.Spinner());
    }

}

/**
 * Card showing a radar for a list of specified domains.
 * The only card other than ScoreCard that shows any score data
 */
export class CompareCard extends ExploreCard {

    private data: Dictionary; //used to package data send to drawRadar
    private ready: boolean; //are score data ready to be rendered?

    constructor(goggles: string, urlsForScoredata: Array<string>) {
        super(goggles, urlsForScoredata.toString().replace(/,/g, '-'), true, false, false);

        this.data = {};

        this.title = 'Overview';
        this.ready = false;

        urlsForScoredata.forEach((domain, index) => {
            extension.storage.getLatestScoreData(domain, goggles, (score) => {

                this.data[domain] = score.scores[userSettings.DEFAULT_ALG].vector;

                if (index === urlsForScoredata.length - 1)
                    this.ready = true;
            });
        });

        this.setStringContent('');
    }

    /**
     * Render is run only when score data are retrieved from storage.
     * Note that there is no error handling in case data doesn't exist.
     * That is left up to the caller.
     */
    public render() {

        let handle = setInterval(() => {
            if (this.ready) {
                clearInterval(handle);

                super.render();

                chart.drawRadar(this.data, canvasWidth, canvasHeight,
                    document.getElementById(this.cardID).getElementsByClassName('card-text')[0] as HTMLElement,
                    'chart' + this.cardID, true);

                this.data = null;
            }
        }, pollingInterval);
    }

}

export class GoggleCard extends Card {
    private goggleID: string;
    private goggleName: string;
    private goggleDescription: string;

    constructor(tabID: string, goggleID: string, goggleName: string, goggleDescription: string) {
        super(tabID)
        this.goggleID = goggleID;
        this.goggleName = goggleName;
        this.goggleDescription = goggleDescription;
    }

    public render() {
        let pos = document.getElementById(this.tabID);

        let targetID = this.goggleID.replace(/ /g, '-') + this.cardID;

        let card = templates.DeletableCardWithHeader(this.cardID, this.goggleName, '', this.goggleDescription, targetID);
        let modal = templates.DeleteModal(targetID, 'Delete ' + this.goggleName + ' ?',
            '<p>All data associated with this goggle will also be deleted.</p><b>You can re-install this goggle at any point.</b>');

        pos.insertAdjacentHTML('beforeend', card);
        pos.insertAdjacentHTML('beforeend', modal);

        (<HTMLButtonElement>document.getElementById(targetID)).getElementsByClassName('_delete')[0].addEventListener('click', () => {
            goggles.remove(this.goggleID);
            (<HTMLButtonElement>document.getElementById(targetID).getElementsByClassName('close')[0]).click();
            document.getElementById(this.cardID).classList.add('hide');

            setTimeout(() => {
                document.getElementById(this.cardID).remove();
            }, 50);

            pos.insertAdjacentHTML('afterbegin', templates.SuccessAlert('Successfully deleted goggle ' + this.goggleID));

            setTimeout(() => {
                (<HTMLButtonElement>pos.getElementsByClassName('alert')[0].children[1]).click();
            }, 4000);
        });
    }
}

/**
 * Card one can use to install a goggle,as retrieved, from service
 */
export class InstallGoggleCard extends Card {
    private goggle: Goggle;

    constructor(tabID: string, goggle: Goggle) {
        super(tabID);
        this.goggle = goggle;
    }

    private add(card: HTMLElement) {
        goggles.add(this.goggle);
        card.getElementsByClassName('btn')[0].remove();
        card.insertAdjacentHTML('beforeend', templates.TickBtn());
        (<HTMLButtonElement>card.getElementsByClassName('btn')[0]).addEventListener('click', () => {
            this.remove(card);
        });
    }

    private remove(card: HTMLElement) {
        goggles.remove(this.goggle.id);

        card.getElementsByClassName('btn')[0].remove();
        card.insertAdjacentHTML('beforeend', templates.AddBtn());

        (<HTMLButtonElement>card.getElementsByClassName('btn')[0]).addEventListener('click', () => {
            this.add(card);
        });
    }

    public render() {
        let pos = document.getElementById(this.tabID);
        pos.insertAdjacentHTML('beforeend', '<br>');
        let capitalizedName = utils.toTitleCase(this.goggle.name.replace(/-/g, ' '));

        pos.insertAdjacentHTML('beforeend', templates.GoggleCard(capitalizedName, this.goggle.description, this.goggle.active));

        let card = <HTMLElement>(<HTMLElement>pos.lastChild).getElementsByClassName('card-body')[0];
        card.getElementsByClassName('btn')[0].addEventListener('click', () => {
            this.add(card);
        });
    }
}