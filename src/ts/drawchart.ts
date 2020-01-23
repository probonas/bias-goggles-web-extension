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
        //selectionOverlay.style.pointerEvents = "none";

        let selectionCtx = selectionOverlay.getContext('2d');

        let timelineCanvas = createCanvas('timeline', selectionOverlay.width,
            selectionOverlay.height, elem);

        let timelineCtx = timelineCanvas.getContext('2d');

        let sliderChanged = false;

        let selectionRect = {
            startX: 0,
            endX: 0
        };

        const drawDefaultSlider = (chart: Chart) => {
            selectionCtx.globalAlpha = 0.3;
            selectionCtx.clearRect(0, 0, selectionOverlay.width, selectionOverlay.height);

            let tlmiddle = (chart.chartArea.left + chart.chartArea.right) / 2;
            let defaultWidth = (chart.chartArea.right - chart.chartArea.left) * 0.3;

            /*
            console.log(
                tlmiddle - defaultWidth / 2,
                chart.chartArea.bottom,
                defaultWidth,
                chart.chartArea.top - chart.chartArea.bottom
            );
            */

            //selectionOverlay.getBoundingClientRect() returns the whole canvas
            //and not just the rect, so we need to following to keep track of rect's
            //coordinates.
            selectionRect.startX = tlmiddle - defaultWidth / 2;
            selectionRect.endX = selectionRect.startX + defaultWidth;

            selectionCtx.fillRect(
                selectionRect.startX,
                chart.chartArea.bottom,
                defaultWidth,
                chart.chartArea.top - chart.chartArea.bottom
            );
        }

        let timelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: vector,
            options: {
                tooltips: {
                    intersect: false, //use nearest
                    mode: 'index'
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
            },
            plugins: [{
                afterRender: (chart, options) => {
                    if (sliderChanged) {
                        //redraw slider as changed by user
                    } else {
                        drawDefaultSlider(chart);
                    }
                }
            }]
        });


        let selectedChartData = {
            startDataIndex: 0,
            endDataIndex: 0
        };

        type actions = 'left-resize' | 'right-resize' | 'move';
        let action: actions;

        selectionOverlay.addEventListener('pointerdown', ev => {
            //@ts-ignore
            let points = timelineChart.getElementsAtEventForMode(ev, 'index', {
                intersect: false
            });

            //@ts-ignore
            selectedChartData.startDataIndex = points[0]._index;
        });

        selectionOverlay.addEventListener('pointermove', ev => {
            let tlRect = timelineChart.canvas.getBoundingClientRect();
            let threshold = (selectionRect.endX - selectionRect.startX) * 0.1;

            const valueInRange = (value: number, lowerLimit: number, upperLimit: number) => {
                return value >= lowerLimit && value <= upperLimit;
            }

            if (valueInRange(ev.clientX - tlRect.left, selectionRect.startX - threshold,
                selectionRect.startX + threshold)) {
                selectionOverlay.style.cursor = 'ew-resize';
            } else if (valueInRange(ev.clientX - tlRect.left, selectionRect.endX - threshold,
                selectionRect.endX + threshold)) {
                selectionOverlay.style.cursor = 'ew-resize';
            } else if (valueInRange(ev.clientX - tlRect.left, selectionRect.startX + threshold,
                selectionRect.endX - threshold)) {
                selectionOverlay.style.cursor = 'grab';
            }

            if (action === 'left-resize') {
                //selectionRect.left = ev.clientX - tlRect.left;
            } else if (action === 'right-resize') {
                //selectionRect.endX = ev.clientX - tlRect.left;
            } else if (action === 'move') {
                //console.log('implement move');
            }
            /*
                        if (ev.clientX < timelineChart.chartArea.left) {
                            selectionRect.width = timelineChart.chartArea.left - selectionRect.left;
                        } else if (ev.clientX > timelineChart.chartArea.right) {
                            selectionRect.width = timelineChart.chartArea.right - selectionRect.left;
                        } else if (ev.clientX > selectionRect.right) {
                            selectionRect.width = ev.clientX - tlRect.left - selectionRect.left;
                        } else if (ev.clientX < selectionRect.left) {
            
                        }
            */
            //selectionCtx.globalAlpha = 0.3;

            //selectionCtx.clearRect(0, 0, selectionOverlay.width, selectionOverlay.height);

            /*
            selectionCtx.fillRect(
                selectionRect.left,
                timelineChart.chartArea.bottom,
                selectionRect.width,
                timelineChart.chartArea.top - timelineChart.chartArea.bottom);
            */
        });

        selectionOverlay.addEventListener('pointerup', (ev) => {
            let rect = timelineCanvas.getBoundingClientRect();

            selectionOverlay.style.cursor = 'default';
            //selectionRect.endX = ev.clientX - rect.left;

            /*
            drag = false;

            //@ts-ignore
            let points = timelineChart.getElementsAtEventForMode(ev, 'index', {
                intersect: false
            });

            selectionRect.resizing = false;
            selectionRect.endX = ev.clientX - timelineCanvas.getBoundingClientRect().left;

            //@ts-ignore
            endDataIndex = points[0]._index;

            console.log('data selected');
            let data = timelineChart.data.labels.slice(startDataIndex, endDataIndex);
            console.log(data);
            */
        });
    }
}
