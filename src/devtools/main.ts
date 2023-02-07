
let panelWindow: Window | null = null;
chrome.devtools.panels.create("StorageEditor", "icon.png", "src/panel/index.html", panel => {
    // code invoked on panel creation
    panel.onShown.addListener( (extPanelWindow) => {
        panelWindow = extPanelWindow;
        chrome.devtools.inspectedWindow.eval('sendStorage(localStorage);');
        chrome.devtools.inspectedWindow.eval('sendStorage(sessionStorage);');
        chrome.devtools.inspectedWindow.eval('alert(123);');
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Messages from content scripts should have sender.tab set
    if (sender.tab && panelWindow) {
        panelWindow.postMessage({ ...request, from: '__devtools_storage_editor'});
    }
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

console.log('devtools');

export {};