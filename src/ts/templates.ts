export namespace templates {

    export namespace get {

        export function InnerCard(title: string, body: string, id: string, tooltipText: string, dismissable: boolean): string {
            let style = '';

            if (!dismissable) {
                style = "display: none;";
            };

            if (tooltipText) {

                if (title.length > 28) {
                    title = title.substr(0, 28) + '...';
                }

                return `
                <div>
                    <div class="card">
                        <div class="card-body" id=${id}>
                            <span data-toggle="tooltip" title="${tooltipText}">
                                <button type="button" style="${style}" class="close" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button> 
                                <h3 class="card-title">${title}</h3>
                            </span>
                            <h5>
                                <p class="card-text">${body}</p>
                            </h5>
                        </div>
                    </div>
                    <div class="pt-2"></div>
                </div>`;

            } else {
                return `
                <div>
                    <div class="card">
                        <div class="card-body" id=${id}>
                            <button type="button" style="${style}" class="close" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h3 class="card-title">${title}</h3>
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

        export function OffButton(offBtnId: string, oneHourID: string, twoHoursID: string,
            sessionOnlyID: string, permaID: string): string {
            return `
            <li class="nav-item dropdown" id="${offBtnId}">
                <button id="on-off-dropdown" class="btn btn-outline-danger dropdown-toggle" data-toggle="dropdown" 
                    data-boundary="window" type="button" aria-haspopup="true" aria-expanded="false">
                    Disable
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
                <button class="btn btn-outline-success" id="${onElementId}">Enable</button>
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
    }
}