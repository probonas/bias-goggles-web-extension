chrome.runtime.sendMessage({response_content: "bias-stats"}, (response) => {
    console.log('received message');
    let div = document.createElement("div");
    div.innerText = response;
    document.getElementById('method-' + response.method).setAttribute('checked','');
});

document.getElementById('form')?.addEventListener('submit', () => {
    console.log('not yet implemented!');
});

