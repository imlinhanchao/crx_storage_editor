

chrome.devtools.panels.create("StorageEditor", "icon.png", "src/panel/index.html", panel => {
    // code invoked on panel creation
    panel.onShown.addListener( (extPanelWindow) => {
        let sayHello = extPanelWindow.document.querySelector('#sayHello');
        sayHello?.addEventListener("click", () => {
            // show a greeting alert in the inspected page
            chrome.devtools.inspectedWindow.eval('alert("Hello from the DevTools Extension");');
        });             
    });
});

// Create a connection to the background service worker
const backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});

// Relay the tab ID to the background service worker
backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});

export {};