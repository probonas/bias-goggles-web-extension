chrome.runtime.sendMessage({response_content: "bias-stats"}, (response) => {
    console.log('received message');
    let div = document.createElement("div");
    div.innerText = response;
    document.body.appendChild(div);
});
