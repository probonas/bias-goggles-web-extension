import { Chart, ChartTitleOptions, ChartData, ChartDataSets, ChartTooltipItem } from "chart.js";
import { Dictionary, Score } from "./types";

import "chartjs-plugin-annotation";
import "chartjs-plugin-draggable";
import "chartjs-plugin-watermark";
import "chartjs-plugin-zoom";

import ChartDataLabelsPlugin from "chartjs-plugin-datalabels";
//chartjs-plugin-datalabels installs itself globally by default
Chart.plugins.unregister(ChartDataLabelsPlugin);

import { templates } from "./templates";
import { extension } from "./storage";
import { utils } from "./utils";

import { Anchor, Font } from "chartjs-plugin-datalabels/types/options";

export namespace chart {

    const lightness = 45;
    const saturation = 80;
    const opaque = 100;

    const green = 'rgb(133,229,133)';
    const red = 'rgb(229,133,133)';
    const blue = 'rgba(133,133,229)';

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
            if (this.last === this.colors.length)
                this.last = 0;
            return this.colors[this.last++];
        }

    }

    function createCanvas(id: string, width: number, height: number,
        positionElement: HTMLElement): HTMLCanvasElement {
        let canvas: HTMLCanvasElement;

        if (!document.getElementById(id)) {
            canvas = document.createElement('canvas');
            canvas.id = id;

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

        ctx.canvas.width = width;
        ctx.canvas.height = height;

        let dataLabels = new Array;
        let data = new Array;
        let dataColors = new Array;
        let borderColors = new Array;

        //get all keys
        for (let i in vector) {
            dataLabels.push(i);
        }

        let dataPainter = new DiscreteColorBuilder(dataLabels.length, saturation, lightness);
        let borderPainter = new DiscreteColorBuilder(dataLabels.length, saturation, opaque);

        dataLabels.forEach((value) => {
            data.push(vector[value]);

            dataColors.push(dataPainter.next().toCssHSL());
            borderColors.push(borderPainter.next().toCssHSL());

        });

        //console.log('debug....');
        //console.log(dataLabels);
        //console.log(data);
        //console.log(vector);


        if (showLabels) {
            new Chart(ctx, {
                type: 'polarArea',
                data: {
                    datasets: [{
                        data: data,
                        backgroundColor: dataColors,
                        borderColor: borderColors,
                        borderWidth: 2
                    }],
                    labels: dataLabels
                },
                options: {
                    legend: {
                        display: false
                    },
                    layout: {
                        padding: {
                            left: 10,
                            right: 10
                        }
                    },
                    plugins: {
                        datalabels: {
                            anchor: <Anchor>'end',
                            //@ts-ignore
                            backgroundColor: function (context) {
                                return context.dataset.backgroundColor;
                            },
                            borderColor: 'white',
                            borderRadius: 25,
                            borderWidth: 3,
                            color: 'white',
                            font: {
                                weight: 'bold'
                            } as Font,
                            //@ts-ignore
                            formatter: (value, context) => {
                                return context.chart.data.labels[context.dataIndex];
                            }
                        }
                    }
                },
                plugins: [ChartDataLabelsPlugin]
            });
        } else {
            new Chart(ctx, {
                type: 'polarArea',
                data: {
                    datasets: [{
                        data: data,
                        backgroundColor: dataColors,
                        borderColor: borderColors,
                        borderWidth: 2
                    }],
                    labels: dataLabels
                },
                options: {
                    legend: {
                        display: false
                    }
                },
                plugins: [ChartDataLabelsPlugin]
            });
        }
    }

    export function drawRadar(dataVectors: Dictionary, width: number, height: number, elem: HTMLElement, id: string,
        showLabels?: boolean) {

        let canvas = createCanvas(id, width, height, elem);
        let ctx = canvas.getContext('2d');

        ctx.canvas.width = width;
        ctx.canvas.height = height;

        let dataSeries = new Array;

        let dataSeriesLabels = Object.keys(dataVectors);
        let dataLabels = Object.keys(dataVectors[dataSeriesLabels[0]]);

        let dataPainter = new DiscreteColorBuilder(dataSeriesLabels.length, saturation, lightness);
        let borderPainter = new DiscreteColorBuilder(dataSeriesLabels.length, saturation, saturation);

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
                borderWidth: 5,
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
                options: {
                    legend: {
                        position: 'bottom',
                    },
                    plugins: {
                        datalabels: {
                            display: false,
                        },
                    }
                }
            });
        } else {
            new Chart(ctx, {
                type: 'radar',
                data: {
                    datasets: dataSeries,
                    labels: dataLabels
                },
                options: {
                    legend: {
                        display: false
                    }
                }
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
            let row = templates.TableRow(
                data.a.toLocaleDateString('en-GB', dateOptions),
                data.b.toLocaleDateString('en-GB', dateOptions),
                false);
            let table = templates.Table('From Date:', 'To Date:', row);

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
                            extension.storage.getAllDomainDataInverse((domains) => {

                                let scoresForSelection = utils.filterScoreData(scores, selectedChartData.a, selectedChartData.b);
                                //console.log('filtered scores', scoresForSelection);

                                let domainsForSelection = utils.filterDomainData(scoresForSelection, domains);
                                //console.log('filtered domains', domainsForSelection);


                                bindedWith.forEach((chart) => {
                                    chart.options.plugins.updateData(chart, scoresForSelection, domainsForSelection);
                                });

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
                legend: {
                    labels: {
                        usePointStyle: true
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
                            min: 0,
                            stepSize: 0.005
                        }
                    }]
                },
                plugins: {
                    updateData: (chart: Chart, scores: Map<number, Score>) => {
                        let minMaxAvgData = utils.calculateMinMaxAvgScores(scores, goggle, method);

                        while (chart.data.labels.length !== 0)
                            chart.data.labels.pop();

                        while (chart.data.datasets.length !== 0)
                            chart.data.datasets.pop();

                        let isBiasGraph = type === 'bias';

                        let dates = Object.keys(minMaxAvgData);

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

                            if (minMaxAvgData[d][goggle] !== undefined) {
                                if (isBiasGraph) {
                                    minBiasDataSets.push(minMaxAvgData[d][goggle][method].minBias);
                                    maxBiasDataSets.push(minMaxAvgData[d][goggle][method].maxBias);
                                    avgBiasDataSets.push(minMaxAvgData[d][goggle][method].avgBias);
                                } else {
                                    minSupportDataSets.push(minMaxAvgData[d][goggle][method].minSupport);
                                    maxSupportDataSets.push(minMaxAvgData[d][goggle][method].maxSupport);
                                    avgSupportDataSets.push(minMaxAvgData[d][goggle][method].avgSupport);
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
                                    backgroundColor: color,
                                    fill: false,
                                    borderDash: [2],
                                    cubicInterpolationMode: 'monotone'
                                } as ChartDataSets
                            } else {
                                return {
                                    label: label,
                                    data: data_,
                                    borderColor: color,
                                    backgroundColor: color,
                                    fill: false
                                } as ChartDataSets
                            }
                        };

                        if (isBiasGraph) {
                            chart.data.datasets.push(datasetWrapper('Min Bias', minBiasDataSets, green, true));
                            chart.data.datasets.push(datasetWrapper('Max Bias', maxBiasDataSets, red, true));
                            chart.data.datasets.push(datasetWrapper('Average Bias', avgBiasDataSets, blue, false));
                        } else {
                            chart.data.datasets.push(datasetWrapper('Min Support', minSupportDataSets, green, true));
                            chart.data.datasets.push(datasetWrapper('Max Support', maxSupportDataSets, red, true));
                            chart.data.datasets.push(datasetWrapper('Average Support', avgSupportDataSets, blue, false));
                        }

                        chart.update();
                    }
                }
            }
        });
    }

    export function drawStackedBar(title: ChartTitleOptions, width: number, height: number, pos: HTMLElement,
        goggle: string, method: string) {

        let stackedCanvas = createCanvas('top biased based on support' + goggle, width, height, pos);

        let stackedContext = stackedCanvas.getContext('2d');

        return new Chart(stackedContext, {
            type: 'bar',
            data: {},
            options: {
                /*
                //@ts-ignores
                watermark: {
                    image: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
                    alignToChartArea: true,
                    position: "front"
                },
                */
                title: title,
                tooltips: {
                    mode: 'single'
                },
                legend: {
                    display: false,
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
                        stacked: true
                    }],
                    yAxes: [{
                        stacked: true,
                        position: "left",
                        ticks: {
                            autoSkip: true,
                            stepSize: 0.05
                        }
                    }]
                },
                plugins: {
                    updateData: (chart: Chart, scores: Map<number, Score>, scoresToDomains: Map<number, string>) => {
                        const datasetWrapper = (label: string, data_: Array<number>, color: string) => {
                            return {
                                backgroundColor: color,
                                label: label,
                                data: data_,
                            } as ChartDataSets
                        };

                        while (chart.data.labels.length !== 0)
                            chart.data.labels.pop();

                        while (chart.data.datasets.length !== 0)
                            chart.data.datasets.pop();

                        let top = utils.getTopSupportive(scores, method);

                        scoresToDomains = new Map([...scoresToDomains].filter(value => goggle === value[1].split(' ')[0]));

                        //remove goggles and keep domain name only
                        scoresToDomains = new Map([...([...scoresToDomains].map((value) => {
                            value[1] = value[1].split(' ')[1];
                            return value;
                        }))]);

                        let domains = new Set<string>();

                        scoresToDomains.forEach((value) => {
                            domains.add(value);
                        });

                        top.forEach((perDayScores) => {
                            let date = [...perDayScores.entries()];
                            //@ts-ignore
                            chart.data.labels.push(new Date(date[0][1].date));

                        });

                        let color = new DiscreteColorBuilder(domains.size / 2, saturation, lightness);

                        //for every domain returned from top
                        domains.forEach((domain) => {
                            let data = new Array<number>();

                            //for every day selected
                            top.forEach((perDayScoresMap, mapIndex) => {
                                let dataFound = false;

                                //look if data for this domain exist for this date
                                perDayScoresMap.forEach((score, scoreIndex) => {

                                    if (scoresToDomains.has(scoreIndex) && scoresToDomains.get(scoreIndex) === domain) {
                                        //push a value
                                        data.push(score.scores[method].bias_score);
                                        if (dataFound) {
                                            console.error('??');
                                        }

                                        dataFound = true;
                                    }

                                });

                                if (!dataFound)
                                    data.push(0);
                            });

                            chart.data.datasets.push(datasetWrapper(domain, data, color.next().toCssHSL()));
                        });

                        chart.update();
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'y',
                            rangeMin: {
                                y: 0
                            }
                        },
                        zoom: {
                            rangeMin: {
                                y: 0
                            },
                            enabled: true,
                            drag: false,
                            mode: 'y',
                            speed: 0.1,
                        }
                    }
                }
            }
        });
    }
}
