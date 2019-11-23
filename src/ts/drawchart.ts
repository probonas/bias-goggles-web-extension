import { Chart } from "chart.js";

export namespace chart {

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

    //elem must be present in the dom tree for the canvas to 
    //render properly
    export function draw(vector: any, elem?: HTMLElement) {
        const id = 'polar-chart';
        let canvas: HTMLCanvasElement;

        if (!document.getElementById(id)) {
            canvas = document.createElement('canvas');
            canvas.id = id;
            canvas.width = 220;
            canvas.height = 300;

            if (!elem)
                document.body.appendChild(canvas);
            else
                elem.appendChild(canvas);
        } else {
            canvas = <HTMLCanvasElement>document.getElementById(id);
        }

        let ctx = canvas.getContext('2d');

        const dataColorLightnes = 70;
        const dataBorderLightness = 50;

        let dataLabels = new Array;
        let data = new Array;
        let dataColors = new Array;
        let borderColors = new Array;

        //get all keys
        for (let i in vector) {
            dataLabels.push(i);
        }

        let dataPainter = new DiscreteColorBuilder(dataLabels.length, 100, dataColorLightnes);
        let borderPainter = new DiscreteColorBuilder(dataLabels.length, 100, dataBorderLightness);

        dataLabels.forEach((value) => {
            data.push(vector[value]);

            dataColors.push(dataPainter.next().toCssHSL());
            borderColors.push(borderPainter.next().toCssHSL());

        });

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
            options: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        fontSize: 11

                    }
                }
            }
        });
    }
}