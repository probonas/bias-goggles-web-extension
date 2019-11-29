export namespace uncrawled {
    const errorMsgId = 'uncrawled-error';

    export function show404Error(url: string, cssClasses?: string[]) {
        if (errorMessageExists())
            return;

        let err = document.createElement('div');
        err.id = errorMsgId;
        err.innerText = 'We haven\'t crawled ' + url + ' yet!';

        if (cssClasses !== undefined)
            err.classList.add(...cssClasses);

        document.body.appendChild(err);
    }

    export function errorMessageExists(): boolean {
        return (document.getElementById(errorMsgId)) ? true : false;
    }

    export function removeCrawlErrorMessage() {
        document.getElementById(errorMsgId).remove();
    }

}