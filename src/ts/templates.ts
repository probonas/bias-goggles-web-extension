import { service } from "./service";
import { SpinnerCard, GenericMessageCard, InstallGoggleCard } from "./infoCard";
import { utils } from "./utils";
import { userSettings } from "./usersettings";

export namespace templates {

    let aspectcounter: number;
    let aspectLabelPrefix = '#';

    export function InnerCard(title: string, body: string, id: string, tooltipOn: boolean, dismissable: boolean, comparable: boolean): string {
        let close = '';
        let compare = '';

        if (dismissable) {
            close = `
                <button style="font-size: 0.5rem;" type="button" class="btn _close">
                    <i class="far fa-window-close fa-3x"></i>
                </button>`;
        };

        if (comparable) {
            compare = `
                <button style="font-size: 0.5rem;" type="button" class="btn compare" data-toggle="modal" data-target="#compareModal">
                    <i class="fa fa-search-plus fa-3x"></i>
                </button>`;
        }

        if (tooltipOn) {
            let tooltipText = title;
            if (title.length > 28) {
                title = title.substr(0, 28) + '...';
            }

            return `
                <div id="${id}">
                    <br>
                    <div class="card fade">
                        <div class="card-body">

                            <div class="row float-right">
                                    ${compare}
                                    ${close}
                            </div>

                            <div class="row">
                                <span data-toggle="tooltip" title="${tooltipText}">
                                    <h3 class="card-title">${title}</h3>
                                </span>
                            </div>

                            <h5>
                                <p class="card-text">${body}</p>
                            </h5>

                        </div>
                    </div>
                    <div class="pt-2"></div>
                </div>`;

        } else {
            return `
                <div id="${id}">
                    <br>
                    <div class="card fade">
                        <div class="card-body">

                            <div class="row float-right">
                                ${compare}
                                ${close}
                            </div>

                            <div class="row">
                                <h3 class="card-title">${title}</h3>
                            </div>


                            <h5>
                                <p class="card-text">${body}</p>
                            </h5>

                        </div>
                    </div>
                    <div class="pt-2"></div>
                </div>`;
        }
    }

    export function Spinner(): string {
        return `
            <div class="d-flex justify-content-center">
                <div class="spinner-border" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>`;
    }

    export function Check(id: string, msg: string): string {
        return `
        <div id="${id}" class="d-flex flex-column fade">
            <h3 class="d-flex justify-content-center">${msg}</h3>
            <span class="d-flex justify-content-center">
                <i class="fa fa-check-circle fa-4x text-success"></i>
            </span>
        </div>`;
    }

    export function Error(id: string, msg: string): string {
        return `
        <div id="${id}" class="d-flex flex-column fade">
            <h3 class="d-flex justify-content-center">${msg}</h3>
            <span class="d-flex justify-content-center">
                <i class="fa fa-times-circle fa-4x text-danger"></i>
            </span>
        </div>`;
    }

    export function ButtonWithSpinner(msg: string) {
        return `
        <button class="btn btn-primary mt-3 submitform" type="button" disabled>
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ${msg}
        </button>
        `;
    }

    export function SuccessAlert(msg: string): string {
        return `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>${msg}</strong>
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>`;
    }

    export function OffButton(offBtnId: string, oneHourID: string, twoHoursID: string,
        sessionOnlyID: string, permaID: string): string {
        return `
            <li class="nav-item dropdown" id="${offBtnId}">
                <button id="on-off-dropdown" class="btn" data-toggle="dropdown"
                    data-boundary="window" type="button" aria-haspopup="true" aria-expanded="false">
                    <i class="fa fa-power-off" style="color:red" aria-hidden="true" data-trigger="hover" data-toggle="tooltip" data-placement="bottom" title="Disable plugin"></i>
                </button>
                <div class="dropdown-menu" aria-labelledby="on-off-dropdown">
                    <button class="dropdown-item" id="${sessionOnlyID}")">for this session</button>
                    <button class="dropdown-item" id="${permaID}">permanently</button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item" id="${oneHourID}">for 1 hour</button>
                    <button class="dropdown-item" id="${twoHoursID}">for 2 hours</button>
                </div>
            </li>`;
    }

    export function OnButton(onBtnId: string, onElementId: string): string {

        return `
            <li class="nav-item" id="${onBtnId}" data-toggle="tooltip" data-placement="bottom" title="Disable plugin">
                <button class="btn" id="${onElementId}">
                    <i class="fa fa-power-off" style="color:green" aria-hidden="true"></i>
                </button>
            </li>`
    }

    export function Table(firstColLabel: string, secondColLabel: string, rowsData: string): string {
        const table = `
            <table class="table table-hover">
                <thead>
                    <tr>
                    <th scope="col">${firstColLabel}</th>
                    <th scope="col">${secondColLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsData}
                </tbody>
            </table>`;

        return table;
    }

    export function TableRow(firstColValue: string, secondColValue: string, strong: boolean): string {
        const body_strong = `
            <tr>
                <th scope="row">${firstColValue}</th>
                <td>${secondColValue}</td>
            </tr>`;

        const body = `
            <tr>
                <td>${firstColValue}</td>
                <td>${secondColValue}</td>
            </tr>`;

        if (strong)
            return body_strong;
        else
            return body;
    }

    export function AccordionCard(title: string, body: string, ascendingCardNum: number, dataparent: string): string {

        const card = `
            <div class="card">
                <div class="card-header" id="header${ascendingCardNum}">
                <h2 class="mb-0">
                    <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${ascendingCardNum}" aria-expanded="true" aria-controls="collapse${ascendingCardNum}">
                    ${title}
                    </button>
                </h2>
                </div>

                <div id="collapse${ascendingCardNum}" class="collapse" aria-labelledby="header${ascendingCardNum}" data-parent="#${dataparent}">
                <div class="card-body">
                    ${body}
                </div>
                </div>
            </div>`;

        return card;
    }

    export function MutedButton(id: string, label: string): string {
        let txt = label;
        if (label.length > 12)
            txt = label.slice(0, 12) + '...';

        return `
            <div class="col-4">
                <button id="${id}" type="button" class="btn btn-primary disabled" data-toggle="tooltip" title="${label}">
                    ${txt}
                </button>
            </div>`;
    }

    export function Tab(tabID: string, contentTabID: string, active: boolean): string {
        if (active) {
            return `
                <li class="nav-item" id="${tabID}">
                    <a href="#${contentTabID}" class="nav-link active" data-toggle="tab"
                    role="tab" aria-controls="${contentTabID}" aria-selected="true">${tabID}</a>
                </li>`;
        } else {
            return `
                <li class="nav-item" id="${tabID}">
                    <a href="#content${contentTabID}" class="nav-link" data-toggle="tab" role="tab"
                    aria-controls="content${contentTabID}" aria-selected="false">${tabID}</a>
                </li>`;
        }
    }

    export function TabPane(paneID: string, labelledby: string, active: boolean): string {

        if (active) {
            return `
                <div class="tab-pane fade show active" id="content${paneID}"
                    role="tabpanel" aria-labelledby="${labelledby}">
                </div>`;
        } else {
            return `
                <div class="tab-pane fade" id="content${paneID}" role="tabpanel"
                    aria-labelledby="${labelledby}">
                </div>`;
        }

    }

    export function TitleWithScores(title: string, bias_score?: number, support_score?: number) {
        if (bias_score === undefined) {
            return `
                <ul class="list-unstyled">
                    <li> ${title} </li>
                    <hr />
                </ul>`;
        } else {
            return `
                <ul class="list-unstyled">
                    <li> ${title} </li>
                    <hr />
                    <li><h4 class="text-info">Bias Score: ${Math.fround(bias_score * 100).toFixed(2)} %</h4></li>
                    <li><h4 class="text-info">Support Score: ${Math.fround(support_score * 100).toFixed(2)} %</h4></li>
                </ul>`
        }
        ;
    }

    export function checkWithLabel(label: string, id: string, preChecked?: boolean, isHidden?: boolean) {
        let checked = '';
        let hidden = '';

        if (preChecked)
            checked = 'checked';

        if (isHidden)
            hidden = 'display: none;';

        return `
            <div class="form-check" style="${hidden}">
                <input class="form-check-input" type="checkbox" id="${id}" value="${label}" ${checked}>
                <label class="form-check-label" for="${id}" > ${label} </label>
            </div>`;
    }

    export function CheckList(listTitle: string, labels: Array<string>) {
        let ret = `<p>${listTitle}</p>`;

        labels.forEach((value) => {
            ret += checkWithLabel(value, value);
        });

        return ret;
    }

    export function InputWithButon(inputID: string, btnID: string,
        inputPlaceHolder: string, btnLabel: string, title?: string, contentID?: string) {

        if (!title)
            title = '';
        if (!contentID)
            contentID = '';

        return `
            <div class="dropdown-divider"></div>
            <p id="${contentID}">${title}</p>
            <div class="input-group mb-3">
                <input id="${inputID}" type="text" class="form-control" placeholder="${inputPlaceHolder}" aria-label="${inputPlaceHolder}" aria-describedby="basic-addon2">
                <div class="input-group-append">
                    <button id="${btnID}" class="btn btn-outline-secondary" type="button">${btnLabel}</button>
                </div>
            </div>`
    }

    export function DeletableCardWithHeader(id: string, header: string, title: string, text: string, target: string) {

        return `
            <div class="card" id="${id}">
                <h5 class="card-header">
                        ${header}
                        <div class="float-right">
                            <button type="button" class="btn _delete" data-toggle="modal" data-target="#${target}">
                                <i class="fa fa-trash" data-toggle="tooltip" data-placement="top" title="Delete this Goggle"></i>
                            </button>
                        </div>
                </h5>

                <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text">${text}</p>
                </div>
            </div>
            <br>`
    }

    export function DeleteModal(id: string, title: string, body: string) {
        return `
            <div class="modal fade" id="${id}" tabindex="-1" role="dialog" aria-hidden="true">
              <div class="modal-dialog" role="document">
                <div class="modal-content">

                  <div class="modal-header">
                    <h5 class="modal-title" id="modal-title">
                       ${title}
                    </h5>

                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>

                  </div>

                  <div class="modal-body" id="modal-body">
                    ${body}
                  </div>

                  <div class="modal-footer">
                      <button type="button" class="btn btn-primary" data-dismiss="modal">Cancel</button>
                      <button type="button" class="btn btn-outline-danger _delete">Delete</button>
                  </div>

                </div>
              </div>
            </div>`
    }

    export function GoggleCard(goggleName: string, goggleDescription: string, active: boolean) {
        let title = '';
        if (active) {
            title = goggleName;
        } else {
            title = `
                ${goggleName}
                <i class="fa fa-exclamation-triangle" data-toggle="tooltip" data-placement="right"
                    title="You can add it, but you will not be able to use it immediately!"></i>`;
        }

        return `
            <div class="card">
                <div class="card-header">
                    ${title}
                </div>

                <div class="card-body">
                    <p class="card-text">${goggleDescription}</p>
                    ${AddBtn()}
                </div>
            </div>`;
    }

    function removeTooltips() {
        //delete tooltip gently
        let tooltips = document.body.getElementsByClassName('tooltip');

        for (let i = 0; i < tooltips.length; i++) {
            if (tooltips[i].classList.contains('show'))
                tooltips[i].classList.remove('show');
            tooltips[i].remove();
        }
    }

    function AddSeed(offset: boolean): HTMLElement {
        let seedHTML = `
        <div class="input-group">
            <input type="text" class="form-control seed" data-toggle="tooltip" data-placement="bottom" title="e.g. a political party's webpage, a brand's page or an affiliated page" placeholder="enter supporting site...">
            <div class="input-group-append">
                <button type="button" class="btn greyicon removeseed" data-toggle="tooltip" data-placement="bottom" title="delete this site">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        </div>
        <div class="input-group">
            <p class="info"></p>
        </div>`;

        let ret = document.createElement('div');

        if (offset)
            ret.classList.add('offset-3', 'col-9', 'mb-2');
        else
            ret.classList.add('col-9', 'mb-2');

        ret.insertAdjacentHTML('afterbegin', seedHTML);

        setTimeout(() => {
            //add delete seed button listener
            let deleteSeedBtn = ret.getElementsByClassName('removeseed')[0];
            let info = <HTMLSpanElement>ret.getElementsByClassName('info')[0];

            deleteSeedBtn.addEventListener('click', () => {
                if (!ret.classList.contains('offset-3'))
                    if (ret.nextElementSibling)
                        ret.nextElementSibling.classList.remove('offset-3');
                ret.remove();

                removeTooltips();
            });

            let input = <HTMLInputElement>ret.getElementsByClassName('seed')[0];
            let commonClasses = ['is-valid', 'is-invalid', 'text-warning', 'text-danger'];

            input.addEventListener('keyup', () => {
                let userInput = input.value;

                if (utils.isUrl(userInput)) {
                    service.checkIfCrawled(userInput, (crawled) => {
                        console.log('cr', crawled);
                        if (crawled) {
                            input.classList.remove(...commonClasses);
                            input.classList.add('is-valid');
                            info.innerText = '';
                        } else {
                            input.classList.remove(...commonClasses);
                            input.classList.add('is-valid');

                            info.classList.remove(...commonClasses);
                            info.classList.add('text-warning');
                            info.innerText = "Domain has not been crawled yet!";
                        }
                    });
                } else {
                    if (userInput.length !== 0) {
                        input.classList.remove(...commonClasses);
                        input.classList.add('is-invalid');

                        info.classList.remove(...commonClasses);
                        info.classList.add('text-danger');
                        info.innerText = 'Invalid domain!';
                    } else {
                        input.classList.remove(...commonClasses);
                        info.classList.remove(...commonClasses);
                        info.innerText = '';
                    }
                }
            });

        }, 50)

        return ret;
    }

    function AspectLabel(aspectName: string): HTMLElement {
        let aspectHTML = `
        <div class="input-group">
                <input type="text" class="form-control aspectlabel" style="text-align:center;" placeholder="${aspectName}" data-toggle="tooltip" data-placement="bottom" title="aspect number" readonly>
                <div class="input-group-inline">
                <button type="button" class="btn greyicon removeaspect" data-toggle="tooltip" data-placement="bottom" title="delete this aspect">
                    <i class="fa fa-times" ></i>
                </button>
            <div>
        </div>`;

        let div = document.createElement('div');
        div.classList.add('col-3', 'mb-2');

        div.insertAdjacentHTML('afterbegin', aspectHTML);

        return div;
    }

    export function AddAspect(): HTMLElement {
        const aspectHTML = `
                <div class="row seedlist">
                </div>
                <div class="d-flex flex-row-reverse mt-2 mb-4">
                    <button type="button" class="btn btn-outline-success add-site" data-toggle="tooltip" data-placement="right" title="add supporting site for this aspect">
                        <i class="fa fa-plus"></i>
                    </button>
                </div>`

        let ret = document.createElement('div');
        ret.classList.add('aspect')

        ret.insertAdjacentHTML('afterbegin', aspectHTML);

        ret.getElementsByClassName('seedlist')[0].appendChild(AspectLabel(aspectLabelPrefix + (++aspectcounter)));
        ret.getElementsByClassName('seedlist')[0].appendChild(AddSeed(false));

        let addSeedBtn = ret.getElementsByClassName('add-site')[0];

        addSeedBtn.addEventListener('click', () => {
            let seedslist = ret.getElementsByClassName('seedlist')[0];

            if (ret.getElementsByClassName('seed').length === 0)
                seedslist.appendChild(AddSeed(false));
            else
                seedslist.appendChild(AddSeed(true));
        });

        setTimeout(() => {
            ret.getElementsByClassName('removeaspect')[0].addEventListener('click', () => {
                ret.remove();
                removeTooltips();

                let aspects = document.getElementsByClassName('aspect');

                if (aspects.length === 0)
                    aspectcounter = 0;

                for (let i = 0; i < aspects.length; i++) {
                    let label = aspectLabelPrefix + (i + 1);
                    (<HTMLInputElement>aspects[i].getElementsByClassName('aspectlabel')[0]).placeholder = label;
                    aspectcounter = i + 1;
                }

            });
        }, 50);

        return ret;
    };

    export function TickBtn(): string {
        removeTooltips();
        return `
            <button type="button" class="btn btn btn-success" placement="right" data-toggle="tooltip" data-placement="right" title="Remove this Goggle!">
                <i class="fa fa-check"></i>
            </button>
        `;
    }

    export function AddBtn(): string {
        removeTooltips();
        return `
            <button type="button" class="btn btn-outline-primary" data-toggle="tooltip" data-placement="right" title="Add this Goggle">
                <i class="fa fa-plus"></i>
            </button>`;
    }

    export function GoggleSearch(): HTMLElement {
        const searchHTML = `
        <div class="input-group">
            <input type="text" class="form-control" id="searchbox" placeholder="enter goggle name,topic or keywords">
            <div class="input-group-inline">
                <button type="button" class="btn greyicon deleteretrieved" placement="right" data-toggle="tooltip" data-placement="bottom" title="Discard search results">
                    <i class="fa fa-times"></i>
                </button>
                <button type="button" class="btn greyicon searchgoggles" placement="right">
                    <i class="fa fa-search"></i>
                </button>
            </div>
        </div>`;

        let ret = document.createElement("div");
        ret.insertAdjacentHTML("afterbegin", searchHTML);

        let input = <HTMLInputElement>ret.getElementsByClassName('form-control')[0];
        let searchBtn = <HTMLButtonElement>ret.getElementsByClassName('searchgoggles')[0];

        function deleteRetrievedGoggles() {
            while (document.getElementById('contentgoggles-retrieved').hasChildNodes())
                document.getElementById('contentgoggles-retrieved').lastChild.remove();
        }

        let deleteBtn = <HTMLButtonElement>ret.getElementsByClassName('deleteretrieved')[0];
        deleteBtn.addEventListener('click', () => {
            input.value = '';
            deleteRetrievedGoggles();
        });

        searchBtn.addEventListener("click", () => {
            let collapseCreator = document.getElementById("goggle-creator-collapse-btn");

            if (collapseCreator.getAttribute("aria-expanded") === "true")
                collapseCreator.click();

            deleteRetrievedGoggles();

            let spinner = new SpinnerCard('goggles-retrieved');
            spinner.render();

            service.search(input.value.trim(), (data) => {
                spinner.remove();
                if (data === null)
                    new GenericMessageCard('goggles-retrieved', 'Search failed', 'Please try again later.').render();
                else if (data.length === 0)
                    new GenericMessageCard('goggles-retrieved', 'Nothing found!', 'Search for ' + input.value.trim() + ' returned no results.').render();
                else
                    data.forEach(goggle => {
                        new InstallGoggleCard('goggles-retrieved', goggle).render();
                    });
            });

        });

        input.addEventListener("keyup", (event) => {
            //enter key is pressed
            if (event.keyCode === 13)
                searchBtn.click();
        });

        return ret;
    }

    function selection(value: string) {
        return `
            <option value="${value}">${value}</option>
        `;
    }
    export function selections(domainTypes: Array<string>) {
        let selectionList = '';

        domainTypes.forEach((value) => {
            selectionList += selection(value);
        });

        return selectionList;
    }

    export function GoggleCreator(): HTMLElement {
        aspectcounter = 0;
        let formHTML = `
        <div class="row">
            <div class="dropdown-divider"></div>
        </div>

        <div class="row">
            <label for="new-goggle-name">Goggle Name:</label>
            <input type="text" class="form-control new-goggle-name" id="new-goggle-name" placeholder="Enter name for this goggle">
            <small id="new-goggle-help" class="form-text text-muted">Should be descriptive of the goggle in order
                to help the community
            </small>
        </div>

        <div class="row">
            <label for="goggle-description">Description:</label>
            <textarea class="form-control goggle-description" id="goggle-description" rows="4"
                placeholder="Enter complete description of the goggle and try to be concise..."></textarea>
        </div>

        <div class="row">
            <label for="domain-selection">Domain:</label>
            <select class="custom-select domain-selection" id="domain-selection">
                <option selected>Select domain for this goggle...</option>
            </select>
        </div>

        <div class="row" id="aspectslist">
            <label class="aspectslist" for="aspectslist">Add aspects:</label>
            <small id="new-goggle-help" class="form-text text-muted">At least two aspects should be added
        </small>
        </div>

        <div class="row">
                <button id="add-aspect" type="button" class="btn btn-outline-success mt-3 add-aspect" data-toggle="tooltip"
                    data-placement="right" title="insert aspect">
                    <i class="fa fa-plus"></i>
                </button>
        </div>

        <div class="row">
            <button type="button" class="btn btn-primary mt-3 submitform">Create Goggle</button>
        </div>

        <div class="row">
            <div class="dropdown-divider"></div>
        </div>`;

        let ret = document.createElement("div");
        ret.insertAdjacentHTML("afterbegin", formHTML);
        ret.classList.add('fade');

        setTimeout(() => {
            ret.classList.add('show')
        }, 250);

        ret.getElementsByClassName('add-aspect')[0].addEventListener('click', () => {
            ret.getElementsByClassName('aspectslist')[0].insertAdjacentElement('beforeend', templates.AddAspect());
            ret.getElementsByClassName('aspectslist')[0].insertAdjacentElement('beforeend', templates.AddAspect());
        });

        service.getDomainTypes((domainTypes) => {
            ret.getElementsByClassName('custom-select')[0].insertAdjacentHTML('beforeend', selections(domainTypes));
        });

        //initial aspect
        (<HTMLButtonElement>ret.getElementsByClassName('add-aspect')[0]).click();

        ret.getElementsByClassName('submitform')[0].addEventListener('click', () => {
            removeTooltips();

            let goggleNameInput = <HTMLInputElement>ret.getElementsByClassName('new-goggle-name')[0];
            let goggleDescriptionInput = <HTMLTextAreaElement>ret.getElementsByClassName('goggle-description')[0];
            let domainTypeSelection = <HTMLSelectElement>ret.getElementsByClassName('domain-selection')[0];

            let goggleName: string;
            let goggleDescription: string;
            let domainType: string;

            if (goggleNameInput.value.trim() === '') {
                goggleNameInput.focus();
                return;
            } else {
                goggleName = goggleDescriptionInput.value.trim();
            }

            if (goggleDescriptionInput.value.trim() === '') {
                goggleDescriptionInput.focus();
                return;
            } else {
                goggleDescription = goggleDescriptionInput.value.trim();
            }

            if (domainTypeSelection.selectedIndex === 0) {
                domainTypeSelection.focus();
                return;
            } else {
                domainType = domainTypeSelection.value;
            }

            let aspects = ret.getElementsByClassName('aspect');

            if (aspects.length <= 1) {
                document.getElementById('add-aspect').focus();
                return;
            }

            let aspectsOfBias = new Array<string>();

            for (let i = 0; i < aspects.length; i++) {
                let invalid = aspects[i].getElementsByClassName('is-invalid');

                //focus on the first invalid found
                //when there are no invalid, we proceed
                if (invalid.length > 0) {
                    (<HTMLInputElement>invalid[0]).focus();
                    return;
                } else {
                    let valid = aspects[i].getElementsByClassName('is-valid');

                    if (valid.length === 0) {
                        (<HTMLButtonElement>aspects[i].getElementsByClassName('add-site')[0]).focus();
                        return;
                    }

                    let seeds = new Set<string>();

                    for (let j = 0; j < valid.length; j++)
                        seeds.add((<HTMLInputElement>valid[j]).value);

                    service.postAB([...seeds], (AbId) => {
                        aspectsOfBias.push(AbId);

                        if (aspectsOfBias.length === aspects.length) {
                            let submitBtn = ret.getElementsByClassName('submitform')[0];
                            let btnPos = submitBtn.parentElement;

                            submitBtn.remove();
                            btnPos.insertAdjacentHTML('beforeend', ButtonWithSpinner('Submitting...'));

                            userSettings.get(items => {
                                service.postCreatedGoggle({
                                    abs: [...aspectsOfBias],
                                    description: goggleDescription,
                                    domain: domainType,
                                    name: goggleName,
                                    creator: items.userID
                                }, (goggle) => {
                                    console.log('google created');
                                    console.log(goggle);

                                    ret.classList.remove('show');
                                    ret.classList.add('hide');

                                    setTimeout(() => {
                                        while (document.getElementById('goggle-creator').hasChildNodes())
                                            document.getElementById('goggle-creator').lastChild.remove();

                                        if (goggle) {
                                            document.getElementById('goggle-creator').insertAdjacentHTML('beforeend', Check('creation-progress', 'Successfully created goggles!'));
                                            document.getElementById('creation-progress').classList.add('show');
                                        } else {
                                            document.getElementById('goggle-creator').insertAdjacentHTML('beforeend', Error('creation-progress', 'Goggle creation failed!'));
                                            document.getElementById('creation-progress').classList.add('show');
                                        }


                                        setTimeout(() => {
                                            document.getElementById('creation-progress').classList.add('hide');
                                            setTimeout(() => {
                                                document.getElementById('creation-progress').remove();
                                                document.getElementById('goggle-creator').insertAdjacentElement('beforeend', GoggleCreator());
                                            }, 250)
                                        }, 3000);
                                    }, 250);
                                });
                            });
                        }
                    });
                }
            }
        });

        return ret;
    }
}
