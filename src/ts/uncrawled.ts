export namespace uncrawled {
    const errorMsgId = 'error';

    export function create404Msg(url: string, cssClasses?: string[]) : HTMLElement {

        let err = document.createElement('div');
        err.id = errorMsgId;
        err.insertAdjacentHTML('beforeend','We haven\'t crawled ' + url + ' yet!')

        if (cssClasses !== undefined)
            err.classList.add(...cssClasses);

        return err;
    }

}