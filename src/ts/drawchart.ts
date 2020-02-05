import { Chart, PositionType, ChartTitleOptions, ChartData, ChartDataSets, ChartTooltipItem } from "chart.js";
import { Dictionary, MinMaxAvgScores } from "./types";

import "chartjs-plugin-annotation";
import "chartjs-plugin-draggable";
import { templates } from "./templates";
import { extension } from "./storage";
import { utils } from "./utils";

export namespace chart {

    const dataColorLightnes = 70;
    const dataBorderLightness = 50;

    const green = 'rgb(0,100,0)';
    const red = 'rgb(139,0,0)';
    const grey = 'rgba(128,128,128,0.6)';

    const dateOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };

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

    export function drawTimeline(dataVector: ChartData, title: ChartTitleOptions, width: number, height: number,
        elem: HTMLElement, bindedWith: Chart[]) {

        let timelineCanvas = createCanvas('timeline', width, height, elem);

        let timelineCtx = timelineCanvas.getContext('2d');

        type SelectionData = {
            a: Date,
            b: Date
        };

        const newSelectionDataObj = (): SelectionData => {
            return {
                a: null,
                b: null
            } as SelectionData;
        }

        let selectedChartData = newSelectionDataObj();

        const updateDateInfo = (data: SelectionData) => {
            let row = templates.get.TableRow(
                data.a.toLocaleDateString('en-GB', dateOptions),
                data.b.toLocaleDateString('en-GB', dateOptions),
                false);
            let table = templates.get.Table('From Date:', 'To Date:', row);

            while (dateInfoDiv.hasChildNodes())
                dateInfoDiv.firstChild.remove();

            dateInfoDiv.insertAdjacentHTML('beforeend', table);
        }

        let tempSelectionData = newSelectionDataObj();
        let startedFrom: Date = null;

        const slider = (index: Date, id: string) => {
            return {
                id: id,
                type: 'line',
                mode: 'vertical',
                scaleID: 'x-axis-0',
                draggable: true,
                value: index,
                borderWidth: 3,
                borderColor: 'black',
                label: {
                    enabled: true,
                    position: "center",
                    content: ' '
                },
                onDragStart: function () {
                    //@ts-ignore
                    if (this.value._d !== undefined) {
                        //@ts-ignore
                        startedFrom = this.value._d;
                    } else {
                        startedFrom = this.value;
                    }

                },
                onDrag: function () {
                    //@ts-ignore
                    let dragValue = this.value._d;

                    if (startedFrom === selectedChartData.a) {
                        if (dragValue < selectedChartData.b) {
                            tempSelectionData.a = dragValue;
                            tempSelectionData.b = selectedChartData.b;
                        } else {
                            tempSelectionData.a = selectedChartData.b;
                            tempSelectionData.b = dragValue;
                        }
                    } else if (startedFrom === selectedChartData.b) {
                        if (dragValue > selectedChartData.a) {
                            tempSelectionData.a = selectedChartData.a;
                            tempSelectionData.b = dragValue;
                        } else {
                            tempSelectionData.a = dragValue;
                            tempSelectionData.b = selectedChartData.a;
                        }
                    }
                    
                    updateDateInfo(tempSelectionData);
                },
                onDragEnd: function () {
                    selectedChartData.a = tempSelectionData.a;
                    selectedChartData.b = tempSelectionData.b;

                    timeline.options.plugins.updateBinded();
                }
            }
        }

        let timeline = new Chart(timelineCtx, {
            type: 'line',
            data: dataVector,
            plugins: [{
                beforeInit: (chartInstance: Chart) => {
                    //@ts-ignore
                    let data: Array<Date> = dataVector.labels;

                    let fromIndex = Math.floor(data.length / 2 - data.length / 10);
                    let toIndex = Math.floor(data.length / 2 + data.length / 10);

                    selectedChartData.a = data[fromIndex];
                    selectedChartData.b = data[toIndex];

                    //add slider annotaions
                    //@ts-ignore
                    chartInstance.options.annotation.annotations.push(slider(selectedChartData.a, 'slider1'));
                    //@ts-ignore
                    chartInstance.options.annotation.annotations.push(slider(selectedChartData.b, 'slider2'));

                    chartInstance.options.plugins.updateBinded();
                }
            }, {
                afterRender: () => {
                    //draw date info table when chart is rendered for the first time
                    updateDateInfo(selectedChartData);
                }
            }],
            options: {
                title: title,
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
                        id: 'x-axis-0'
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
                    annotations: []
                },
                plugins: {
                    updateBinded: () => {
                        extension.storage.getAllScoreData((scores) => {
                            let selected = utils.filterScoreData(scores, selectedChartData.a, selectedChartData.b);
                            let minMaxAvgData = utils.calculateMinMaxAvgScoresPerGoggleAndMethod(selected);

                            bindedWith.forEach((chart) => {
                                chart.options.plugins.updateData(chart, minMaxAvgData);
                            });
                        });
                    }
                }
            }
        });

        let dateInfoDiv = document.createElement('div');
        elem.appendChild(dateInfoDiv);
    }

    export function drawLineChartForTimeline(title: ChartTitleOptions, width: number, height: number, pos: HTMLElement,
        type: 'bias' | 'support', goggle: string, method: string) {

        let lineCanvas = createCanvas(type + goggle, width, height, pos);

        let lineContext = lineCanvas.getContext('2d');

        return new Chart(lineContext, {
            type: 'line',
            data: {},
            options: {
                title: title,
                tooltips: {
                    callbacks: {
                        title: (item: ChartTooltipItem[], data: ChartData) => {
                            return (new Date(item[0].xLabel)).toLocaleDateString('en-GB', dateOptions);
                        },
                        label: (tooltipItem: ChartTooltipItem, data: ChartData) => {
                            return data.datasets[tooltipItem.datasetIndex].label + ': ' + (<number>tooltipItem.yLabel).toFixed(5);
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: "day"
                        },
                        ticks: {
                            autoSkip: true,
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            suggestedMax: 1,
                            suggestedMin: 0,
                            stepSize: 0.05
                        }
                    }]
                },
                plugins: {
                    updateData: (chart: Chart, data: MinMaxAvgScores) => {
                        while (chart.data.labels.length !== 0)
                            chart.data.labels.pop();

                        while (chart.data.datasets.length !== 0)
                            chart.data.datasets.pop();

                        let isBiasGraph = type === 'bias';

                        let dates = Object.keys(data);

                        let datesLabels = new Array<Date>();
                        let minBiasDataSets = new Array<number>();
                        let maxBiasDataSets = new Array<number>();
                        let avgBiasDataSets = new Array<number>();

                        let minSupportDataSets = new Array<number>();
                        let maxSupportDataSets = new Array<number>();
                        let avgSupportDataSets = new Array<number>();

                        for (let date in dates) {
                            let d = Number.parseInt(dates[date]);

                            //make labels for chart from timestamps
                            datesLabels.push(new Date(d));

                            if (data[d][goggle] !== undefined) {
                                if (isBiasGraph) {
                                    minBiasDataSets.push(data[d][goggle][method].minBias);
                                    maxBiasDataSets.push(data[d][goggle][method].maxBias);
                                    avgBiasDataSets.push(data[d][goggle][method].avgBias);
                                } else {
                                    minSupportDataSets.push(data[d][goggle][method].minSupport);
                                    maxSupportDataSets.push(data[d][goggle][method].maxSupport);
                                    avgSupportDataSets.push(data[d][goggle][method].avgSupport);
                                }
                            } else {
                                if (isBiasGraph) {
                                    minBiasDataSets.push(0);
                                    maxBiasDataSets.push(0);
                                    avgBiasDataSets.push(0);
                                } else {
                                    minSupportDataSets.push(0);
                                    maxSupportDataSets.push(0);
                                    avgSupportDataSets.push(0);
                                }
                            }
                        }

                        datesLabels.forEach((date) => {
                            //@ts-ignore
                            chart.data.labels.push(date);
                        });

                        const datasetWrapper = (label: string, data_: Array<number>, color: string, dashed: boolean) => {
                            if (dashed) {
                                return {
                                    label: label,
                                    data: data_,
                                    borderColor: color,
                                    fill: false,
                                    borderDash: [10, 10],
                                    cubicInterpolationMode: 'monotone'
                                } as ChartDataSets
                            } else {
                                return {
                                    label: label,
                                    data: data_,
                                    borderColor: color,
                                    fill: false
                                } as ChartDataSets
                            }
                        };

                        if (isBiasGraph) {
                            chart.data.datasets.push(datasetWrapper('Min Bias', minBiasDataSets, green, true));
                            chart.data.datasets.push(datasetWrapper('Max Bias', maxBiasDataSets, red, true));
                            chart.data.datasets.push(datasetWrapper('Average Bias', avgBiasDataSets, grey, false));
                        } else {
                            chart.data.datasets.push(datasetWrapper('Min Support', minSupportDataSets, green, true));
                            chart.data.datasets.push(datasetWrapper('Max Support', maxSupportDataSets, red, true));
                            chart.data.datasets.push(datasetWrapper('Average Support', avgSupportDataSets, grey, false));
                        }

                        chart.update();
                    }
                }
            }
        });
    }
}
