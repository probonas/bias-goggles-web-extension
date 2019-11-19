import { link } from "fs";

let links = document.links;
let start = 0;
let waitTime = 2000; //ms

for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("mouseover", (event) => {
        start = new Date().getSeconds();

        setTimeout(() => {
            if(start != 0){
                //@ts-ignore
                console.log('hovered ' + event.target.href);
            }
        },waitTime);
    });

    links[i].addEventListener('mouseout' , (event) => {
        start = 0;
    });
}