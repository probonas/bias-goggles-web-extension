import { BiasScoresMethods, BiasStatsResponse, BiasStatsRequest } from "./types";
import { Chart } from "chart.js";

class Color {
    red: number;
    green: number;
    blue: number;

    constructor(color?: Color) {
        this.red = color && color.red || 0;
        this.green = color && color.green || 0;
        this.blue = color && color.blue || 0;
    }

}

class RGB {

    private minimumContrast = 35;
    private resetHardLimit = 100;

    private lastColor: Color;

    private colorList: Array<Color>;

    constructor() {
        this.colorList = [];
        this.lastColor = undefined;
    }

    private getRandomColor(): Color {
        let color = new Color();

        color.red = Math.floor(Math.random() * 255);
        color.green = Math.floor(Math.random() * 255);
        color.blue = Math.floor(Math.random() * 255);

        return color;
    }

    private contrast(color1: Color, color2: Color): number {
        return Math.sqrt(
            0.3 * Math.pow(color1.red - color2.red, 2) +
            0.59 * Math.pow(color1.green - color2.green, 2) +
            0.11 * Math.pow(color1.blue - color2.blue, 2));
    }

    private checkContrast(color: Color) {
        let timesResetted = 0;

        if (this.colorList.length === 0)
            this.colorList.push(color);
        else {

            for (let i = 0; i < this.colorList.length; i++) {

                let curr = this.colorList[i];

                //console.log('red ' + color.red + ' green ' + color.green + ' blue ' + color.blue);
                //console.log('red ' + curr.red + ' green ' + curr.green + ' blue ' + curr.blue);
                //console.log('===> ' + this.contrast(curr,color));

                if (this.contrast(curr, color) < this.minimumContrast &&
                    timesResetted < this.resetHardLimit) {

                    color = this.getRandomColor();
                    i = 0;
                    timesResetted++;

                }
            }
            
            //console.log('resetted ' + timesResetted);
            
            this.colorList.push(color);
        }
    }

    public getCssRGBA(opacity: string, useLastColor: boolean): string {
        let color: Color;

        if (!useLastColor) {
            color = this.getRandomColor();
            this.checkContrast(color);
            this.lastColor = color;
        } else {
            color = this.lastColor;
        }

        return 'rgba(' +
            color.red + ',' +
            color.green + ',' +
            color.blue + ',' +
            opacity + ')';
    }

}



function drawChart(vector: any) {
    //@ts-ignore
    let ctx = document.getElementById('polar-chart').getContext('2d');

    let colorMaker = new RGB();

    const backgroundOpacity = '0.3';
    const borderOpacity = '1';

    let vector_labels = new Array;
    let vector_data = new Array;
    let bgColors = new Array;
    let borderColors = new Array;

    //get all keys
    for (let i in vector) {
        vector_labels.push(i);
    }

    vector_labels.forEach((value) => {
        vector_data.push(vector[value]);
        bgColors.push(colorMaker.getCssRGBA(backgroundOpacity, false));
        borderColors.push(colorMaker.getCssRGBA(borderOpacity, true));
    });

    new Chart(ctx, {
        type: 'polarArea',
        data: {
            datasets: [{
                data: vector_data,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1
            }],
            labels: vector_labels
        },
        options :{
            legend: {
                position : 'bottom',
                labels: {
                    usePointStyle: true,
                    fontSize: 11

                }
            }
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
            let canvas = document.createElement('canvas');
            canvas.id = 'polar-chart';
            canvas.width = 220;
            canvas.height = 300;

            document.body.appendChild(canvas);
            //@ts-ignore
            drawChart(response.data.value[method].vector);
        });

});