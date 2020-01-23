import { Chart, PositionType } from "chart.js";
import { Dictionary } from "./types";

export namespace chart {

    const dataColorLightnes = 70;
    const dataBorderLightness = 50;

    class HSL {
        private hue: number;
        private saturation: number;
        private lightness: number;

        constructor(hue: number, saturation: number, lightness: number) {
            this.hue = hue,
                this.saturation = saturation;
            this.lightness = lightness;
        }

        public toCssHSL(): string {
            return 'hsl(' + this.hue + 'deg,' + this.saturation + '%,' + this.lightness + '%)';
        }

    }

    class DiscreteColorBuilder {

        private lightness: number;
        private saturation: number;
        private quantity: number;

        private startDegrees: number;
        private endDegrees: number;
        private step: number;
        private last: number;

        private colors: Array<HSL>;

        constructor(quantity: number, saturation: number, lightness: number) {
            this.quantity = quantity;
            this.lightness = lightness;
            this.saturation = saturation;
            this.colors = new Array();

            this.startDegrees = 0;
            this.endDegrees = 359;

            this.step = Math.floor((this.endDegrees - this.startDegrees) / this.quantity);

            this.last = 0;

            for (let i = 0; i < this.quantity; i++) {
                this.colors.push(new HSL(this.startDegrees + i * this.step, this.saturation, this.lightness));
            }
        }

        public next(): HSL {
            return this.colors[this.last++];
        }

    }

    const commonOptionsWithoutLabels = {
        legend: {
            display: false
        },
        layout: {
            padding: {
                left: 5,
                right: 5,
                top: -60,
                bottom: 0
            }
        }
    };

    const commonOptionsWithLabels = {
        legend: {
            position: <PositionType>'bottom',
            labels: {
                usePointStyle: true,
                fontSize: 11
            }
        },
        layout: {
            padding: {
                left: 5,
                right: 5,
                top: -60,
                bottom: 0
            }
        }
    };

    function createCanvas(id: string, width: number, height: number,
        positionElement: HTMLElement): HTMLCanvasElement {
        let canvas: HTMLCanvasElement;

        if (!document.getElementById(id)) {
            canvas = document.createElement('canvas');
            canvas.id = id;
            canvas.width = width;
            canvas.height = height;

            positionElement.appendChild(canvas);
        } else {
            canvas = <HTMLCanvasElement>document.getElementById(id);
        }

        return canvas;
    }

    //elem must be present in the dom tree for the canvas to 
    //render properly
    export function drawPolar(vector: any, width: number, height: number, elem: HTMLElement, id: string, showLabels?: boolean) {

        let canvas = createCanvas(id, width, height, elem);
        let ctx = canvas.getContext('2d');

        let dataLabels = new Array;
        let data = new Array;
        let dataColors = new Array;
        let borderColors = new Array;

        //get all keys
        for (let i in vector) {
            dataLabels.push(i);
        }

        let dataPainter = new DiscreteColorBuilder(dataLabels.length, 90, dataColorLightnes);
        let borderPainter = new DiscreteColorBuilder(dataLabels.length, 100, dataBorderLightness);

        dataLabels.forEach((value) => {
            data.push(vector[value]);

            dataColors.push(dataPainter.next().toCssHSL());
            borderColors.push(borderPainter.next().toCssHSL());

        });

        if (showLabels) {
            new Chart(ctx, {
                type: 'polarArea',
                data: {
                    datasets: [{
                        data: data,
                        backgroundColor: dataColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }],
                    labels: dataLabels
                },
                options: commonOptionsWithLabels
            });
        } else {
            new Chart(ctx, {
                type: 'polarArea',
                data: {
                    datasets: [{
                        data: data,
                        backgroundColor: dataColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }],
                    labels: dataLabels
                },
                options: commonOptionsWithoutLabels
            });
        }
    }

    export function drawRadar(dataVectors: Dictionary, width: number, height: number, elem: HTMLElement, id: string,
        showLabels?: boolean) {

        let canvas = createCanvas(id, width, height, elem);
        let ctx = canvas.getContext('2d');

        let dataSeries = new Array;

        let dataSeriesLabels = Object.keys(dataVectors);
        let dataLabels = Object.keys(dataVectors[dataSeriesLabels[0]]);

        let dataPainter = new DiscreteColorBuilder(dataSeriesLabels.length, 80, dataColorLightnes);
        let borderPainter = new DiscreteColorBuilder(dataSeriesLabels.length, 90, dataBorderLightness);

        //console.log('---------------------------');
        //console.log(dataVectors);
        //console.log(dataSeriesLabels);
        //console.log(dataLabels);

        dataSeriesLabels.forEach((value, index) => {
            dataSeries.push({
                label: value,
                data: Object.values(dataVectors[value]),
                borderColor: borderPainter.next().toCssHSL(),
                backgroundColor: dataPainter.next().toCssHSL(),
                fill: true
            });
        });

        //console.log(dataSeries);

        if (showLabels) {
            new Chart(ctx, {
                type: 'radar',
                data: {
                    datasets: dataSeries,
                    labels: dataLabels
                },
                options: commonOptionsWithLabels
            });
        } else {
            new Chart(ctx, {
                type: 'radar',
                data: {
                    datasets: dataSeries,
                    labels: dataLabels
                },
                options: commonOptionsWithoutLabels
            });
        }
    }

    export function drawTimeline(vector: any, width: number, height: number,
        elem: HTMLElement, id: string) {


        let selectionOverlay = createCanvas('selection-overlay',
            width, 60, elem);

        selectionOverlay.style.position = "absolute";
        selectionOverlay.style.pointerEvents = "none";

        let selectionCtx = selectionOverlay.getContext('2d');

        let timelineCanvas = createCanvas('timeline', selectionOverlay.width,
            selectionOverlay.height, elem);

        let timelineCtx = timelineCanvas.getContext('2d');

        let selectionRect = {
            w: 0,
            startX: 0,
        };

        let timelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: vector,
            options: {
                tooltips: {
                    intersect: false, //use nearest
                    mode: 'index'
                },
                elements: {
                    //point: {
                    //radius: 0
                    //}
                },
                responsive: true,
                onResize: () => {
                    selectionOverlay.width = timelineChart.width;
                    selectionOverlay.height = timelineChart.height;
                    selectionCtx = selectionOverlay.getContext('2d');
                    timelineCtx = timelineCanvas.getContext('2d');
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            minUnit: "day"
                        },
                        ticks: {
                            autoSkip: true,
                        }
                    }],
                    yAxes: [{
                        position: "left",
                        ticks: {
                            display: false,
                            reverse: false
                        },

                    }]
                }
            }
        });

        console.log(timelineCanvas.width, timelineCanvas.height);

        let startIndex = 0;
        let endIndex = 0;

        let drag = false;

        timelineCanvas.addEventListener('pointerdown', ev => {
            drag = true;
            startIndex = 0;

            let rect = selectionOverlay.getBoundingClientRect();
            selectionRect.startX = ev.clientX - rect.left;

            //@ts-ignore
            let points = timelineChart.getElementsAtEventForMode(ev, 'index', {
                intersect: false
            });

            console.log('this', points);
            //@ts-ignore
            startIndex = points[0]._index;

            console.log('data selected');
            let data = timelineChart.data.labels.slice(startIndex, endIndex);
            console.log(data);
        });

        timelineCanvas.addEventListener('pointermove', ev => {

            let rect = timelineCanvas.getBoundingClientRect();

            if (drag) {

                if (ev.clientX < timelineChart.chartArea.left) {
                    selectionRect.w = timelineChart.chartArea.left - selectionRect.startX;
                } else if (ev.clientX > timelineChart.chartArea.right) {
                    selectionRect.w = timelineChart.chartArea.right - selectionRect.startX;
                } else {
                    selectionRect.w = ev.clientX - rect.left - selectionRect.startX;
                }

                selectionCtx.globalAlpha = 0.5;

                selectionCtx.clearRect(0, 0, selectionOverlay.width, selectionOverlay.height);

                selectionCtx.fillRect(selectionRect.startX,
                    timelineChart.chartArea.top,
                    selectionRect.w,
                    timelineChart.chartArea.bottom - timelineChart.chartArea.top);

            } else {
                selectionCtx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);
            }

        });

        timelineCanvas.addEventListener('pointerup', (ev) => {
            drag = false;

            //@ts-ignore
            let points = timelineChart.getElementsAtEventForMode(ev, 'index', {
                intersect: false
            });

            //@ts-ignore
            endIndex = points[0]._index;

            console.log('data selected');

            let data = timelineChart.data.labels.slice(startIndex, endIndex);

            console.log(data);
        });
    }
}
