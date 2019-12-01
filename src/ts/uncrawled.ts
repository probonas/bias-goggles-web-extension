export namespace uncrawled {
    const errorMsgId = 'error';

    export function create404Msg(url: string, cssClasses?: string[]) : HTMLElement {
        if (errorMessageExists())
            return;

        let err = document.createElement('div');
        err.id = errorMsgId;
        err.innerText = 'We haven\'t crawled ' + url + ' yet!';

        if (cssClasses !== undefined)
            err.classList.add(...cssClasses);

        return err;
    }

    export function errorMessageExists(): boolean {
        return (document.getElementById(errorMsgId)) ? true : false;
    }

    export function removeCrawlErrorMessage() {
        document.getElementById(errorMsgId).remove();
    }

}