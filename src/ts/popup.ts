import { ExtRequest, RequestMessage, ExtResponse, MethodsAndNames } from "./types";
import { chart } from "./drawchart";
import { uncrawled } from "./uncrawled";

let methodSelected : string = null;

function handleResponse(response: ExtResponse) {
    console.log('received response');

    if (response.data.appdata === null) {
        uncrawled.show404Error(response.data.domain, ['error']);
    } else {

        if (uncrawled.errorMessageExists())
            uncrawled.removeCrawlErrorMessage();

        if( !document.getElementById('default') ){
            let btn = document.createElement('button');
            btn.id = 'default';
            btn.innerText = 'Set as default';
            btn.classList.add('slidein');
            
            btn.addEventListener('click', () => {
                if(methodSelected)
                    chrome.runtime.sendMessage(new ExtRequest([RequestMessage.SET_AS_DEFAULT],methodSelected));
            });
            
            document.getElementById('messagebox').appendChild(btn);
        }

        let method = response.extra;
        //@ts-ignore
        let vector = response.data.appdata[method].vector;
        chart.draw(vector, 220, 300,document.getElementById('chartbox'),true);
    }
}

const methods = ['ic', 'lt', 'pr'];

methods.forEach(method => {

    function closure() {
        let m = method;

        function getData() {
            methodSelected = m;
            chrome.runtime.sendMessage(
                new ExtRequest([RequestMessage.GET_STATS], m), handleResponse);
        };

        return getData;
    };

    document.getElementById(method).addEventListener('click', closure());
});

