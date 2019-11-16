import { BiasScoresMethods, BiasStatsResponse, BiasStatsRequest } from "./types";
import { Chart } from "chart.js";

function drawChart(vector: any) {
    //@ts-ignore
    let ctx = document.getElementById('polar-chart').getContext('2d');

    let vector_labels = new Array;
    let vector_data = new Array;

    //get all keys
    for (let i in vector) {
        vector_labels.push(i);
    }
    
    vector_labels.forEach( (value) => {
        vector_data.push(vector[value]);
    });

    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: vector_labels,
            datasets: [{
                label: '# of Votes',
                data: vector_data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        }
    });
}

document.getElementById('save-button').addEventListener('click', () => {
    let checked: HTMLInputElement;
    let as_default: boolean = false;

    for (let item in BiasScoresMethods) {

        if ((<HTMLInputElement>document.getElementById(item)).checked) {
            checked = <HTMLInputElement>document.getElementById(item);
            console.log(checked.value + ' checked');
        }

    }

    if ((<HTMLInputElement>document.getElementById('set-as-default')).checked) {
        console.log('set as default on');
        as_default = true;
    }

    chrome.runtime.sendMessage(
        new BiasStatsRequest({ method: checked.value, set_as_default: as_default }),
        (response: BiasStatsResponse) => {
            let method = checked.value;
            //@ts-ignore
            drawChart(response.data.value[method].vector);
        });

});