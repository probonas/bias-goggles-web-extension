let daysSlider = <HTMLInputElement>document.getElementById('days-slider');
let daysLabel = document.getElementById('days');
let gogglesSelect = <HTMLSelectElement>document.getElementById('goggles');

function getDataExpirationText(n: any) {
    let day: string = null;
    if (n == 1)
        day = 'day';
    else
        day = 'days'

    return 'Refresh domain data every ' + n + ' ' + day + ' : ';
}

daysSlider.onchange = function () {
    daysLabel.innerHTML = getDataExpirationText(daysSlider.value);
};

/*
chrome.runtime.sendMessage(new ExtRequest([RequestMessage.GET_EXPIRATION_INTERVAL]), (response: ExtResponse) => {
    daysLabel.innerHTML = getDataExpirationText(response.extra);
});
*/

let option = document.createElement('option');
option.value = '7';
option.innerText = 'Seven';
gogglesSelect.options.add(option);



