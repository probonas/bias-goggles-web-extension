
export namespace templates {

    export namespace get {

        export function InnerCard(title: string, body: string, id: string, tooltipOn: boolean, dismissable: boolean, comparable: boolean): string {
            let close = '';
            let compare = '';

            if (dismissable) {
                close = `
                <button type="button" class="btn btn-link _close">
                    <img src="icons/x.svg" width="18" height="18" title="Close" >
                </button>`;
            };

            if (comparable) {
                compare = `
                <button type="button" class="btn btn-link compare" data-toggle="modal" data-target="#compareModal">
                    <img src="icons/edit.svg" width="18" height="18" title="Compare" >
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

        export function SuccessAlert(msg: string): string {
            return `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>${msg}</strong>
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>`;
        }
        /*
                <button type="button" class="btn btn-link compare" data-toggle="modal" data-target="#compareModal">
                    <img src="icons/edit.svg" width="18" height="18" title="Compare" >
                </button>`;
        */
        export function OffButton(offBtnId: string, oneHourID: string, twoHoursID: string,
            sessionOnlyID: string, permaID: string): string {
            return `
            <li class="nav-item dropdown" id="${offBtnId}">
                <button id="on-off-dropdown" class="btn" data-toggle="dropdown" 
                    data-boundary="window" type="button" aria-haspopup="true" aria-expanded="false">
                    <img src="icons/off.svg" width="18" height="18" title="OffButton" >
                </button>
                <div class="dropdown-menu" aria-labelledby="on-off-dropdown">
                    <button class="dropdown-item" id="${oneHourID}">for 1 hour</button>
                    <button class="dropdown-item" id="${twoHoursID}">for 2 hours</button>
                    <button class="dropdown-item" id="${sessionOnlyID}")">for this session only</button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item" id="${permaID}">until I re-enable it</button>
                </div>
            </li>`;
        }

        export function OnButton(onBtnId: string, onElementId: string): string {

            return `
            <li class="nav-item" id="${onBtnId}">
                <button class="btn" id="${onElementId}">
                    <img src="icons/on.svg" width="18" height="18" title="OnButton" >
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

        function NavBar(body: string): string {
            return `
            <ul class="nav nav-tabs" role="tablist">
                ${body}
            </ul>`;
        }

        function TabContents(contents: string): string {
            return `
            <div class="tab-content">
                ${contents}
            </div>`;
        }

        function Tab(title: string, tabID: string, active: boolean): string {
            if (active) {
                return `
                <li class="nav-item" id="${title}">
                    <a href="#${tabID}" class="nav-link active" data-toggle="tab" 
                    role="tab" aria-controls="${tabID}" aria-selected="true">${title}</a>
                </li>`;
            } else {
                return `
                <li class="nav-item" id="${title}">
                    <a href="#${tabID}" class="nav-link" data-toggle="tab" role="tab" 
                    aria-controls="${tabID}" aria-selected="false">${title}</a>
                </li>`;
            }
        }

        function TabPane(paneID: string, labelledby: string, active: boolean): string {

            if (active) {
                return `
                <div class="tab-pane fade show active" id="${paneID}" 
                    role="tabpanel" aria-labelledby="${labelledby}">
                </div>`;
            } else {
                return `
                <div class="tab-pane fade" id="${paneID}" role="tabpanel" 
                    aria-labelledby="${labelledby}">
                </div>`;
            }

        }

        export function CreateTabs(tabLabels: string[], tabIDs: string[]): string {
            let tabs = '';
            let panes = '';

            for (let i = 0; i < tabLabels.length; i++) {
                let title = tabLabels[i];
                let tabID = tabIDs[i];

                tabs += Tab(title, tabID, (i === 0));
                panes += TabPane(tabID, title, (i === 0));
            }

            return NavBar(tabs) + TabContents(panes);
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

    }

}