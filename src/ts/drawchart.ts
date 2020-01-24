import { Chart, PositionType } from "chart.js";
import { Dictionary } from "./types";

import "chartjs-plugin-annotation";
import "chartjs-plugin-draggable";
import { templates } from "./templates";

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

        let timelineCanvas = createCanvas('timeline', width, height, elem);

        let timelineCtx = timelineCanvas.getContext('2d');

        let selectedChartData = {
            startDate: null as Date,
            endDate: null as Date
        };

        let fromID = 'line1';
        let fromIndex = null;
        let toID = 'line2';
        let toIndex = null;

        //@ts-ignore
        let data: Array<Date> = vector.labels;

        fromIndex = Math.floor(data.length / 2 - data.length / 10);
        toIndex = Math.floor(data.length / 2 + data.length / 10);

        selectedChartData.startDate = data[fromIndex];
        selectedChartData.endDate = data[toIndex];

        console.log(fromIndex);
        console.log(toIndex);

        let startedFromLower: boolean;

        const updateDateInfo = (data: any) => {
            let row = templates.get.TableRow(data.startDate.toString(), data.endDate.toString(), false);
            let table = templates.get.Table('From Date:', 'To Date:', row);

            while (dateInfoDiv.hasChildNodes())
                dateInfoDiv.firstChild.remove();

            dateInfoDiv.insertAdjacentHTML('beforeend', table);
        }

        const makeDraggableLine = (index: Date, id: string) => {
            return {
                id: id,
                type: 'line',
                mode: 'vertical',
                scaleID: 'x-axis-0',
                draggable: true,
                onDragStart: function () {

                    if (this.value === selectedChartData.startDate) {
                        startedFromLower = true;
                    } else if (this.value === selectedChartData.endDate) {
                        startedFromLower = false;
                    } else {
                        console.log(this.value, selectedChartData.startDate, selectedChartData.endDate);
                        throw new Error('nonono');
                    }

                },
                onDrag: function () {

                    if (startedFromLower) {

                        if (this.value >= selectedChartData.endDate) {
                            startedFromLower = false;
                            selectedChartData.startDate = selectedChartData.endDate;
                            selectedChartData.endDate = this.value;
                        } else {
                            selectedChartData.startDate = this.value;
                        }

                    } else {

                        if (this.value <= selectedChartData.startDate) {
                            startedFromLower = true;
                            selectedChartData.endDate = selectedChartData.startDate;
                            selectedChartData.startDate = this.value;
                        } else {
                            selectedChartData.endDate = this.value;
                        }
                    }

                    updateDateInfo(selectedChartData);
                },
                value: index,
                borderWidth: 3,
                borderColor: 'black',
                label: {
                    enabled: true,
                    position: "center",
                    content: ' '
                }
            }
        }

        let timelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: vector,
            options: {
                tooltips: {
                    intersect: false, //use nearest
                    mode: 'index',
                    enabled: false
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                responsive: true,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: "day"
                        },
                        ticks: {
                            autoSkip: true,
                        },
                        id: 'x-axis-0',
                        scaleLabel: {
                            labelString: 'Extension Usage'
                        }
                    }],
                    yAxes: [{
                        position: "left",
                        ticks: {
                            display: false,
                        },
                        id: 'y-axis-0'
                    }]
                },
                //@ts-ignore
                annotation: {
                    drawTime: 'afterDatasetsDraw',
                    events: ['click'],
                    annotations: [
                        makeDraggableLine(selectedChartData.startDate, fromID),
                        makeDraggableLine(selectedChartData.endDate, toID)
                    ]
                }
            }
        });

        let dateInfoDiv = document.createElement('div');
        elem.appendChild(dateInfoDiv);
        updateDateInfo(selectedChartData);

        /* add graphs here */
    }
}
