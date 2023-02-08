
let panelWindow: Window | null = null;
chrome.devtools.panels.create("StorageEditor", "icon.png", "src/panel/index.html", panel => {
  // code invoked on panel creation
  panel.onShown.addListener( (extPanelWindow) => {
    panelWindow = extPanelWindow;
    chrome.devtools.inspectedWindow.eval(`
      let _setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(keyName, keyValue) {
        postStorage(this)
        return _setItem.call(this, keyName, keyValue)
      }
      function postStorage(storage) {
        window.postMessage({
          from: 'tab_storage_editor',
          message: 'storage',
          data: storage == localStorage ? 'local' : 'session'
        }, '*')
      }
      window.addEventListener('message', function({ data }) {
        if (data && data.from === '__content_script_storage_editor') {
          switch(data.message) {
            case 'listen':
              window.addEventListener('storage', (e) => {
                postStorage(e.storageArea)
              }
            )
          }
        }
      });
    `)

    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, 
      { from: '__devtools_storage_editor', message: 'send', data: 'local' }, 
      function(response) {
        console.log('send response', response);
    });
    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, 
      { from: '__devtools_storage_editor', message: 'send', data: 'session' }, 
      function(response) {
        console.log('send response', response);
    });
    chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, 
      { from: '__devtools_storage_editor', message: 'listen' }, 
      function(response) {
        console.log('send response', response);
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages from content scripts should have sender.tab set
  if (sender.tab && panelWindow) {
    panelWindow.postMessage({ ...request, from: '__devtools_storage_editor'});
    sendResponse({
      result: 'success'
    })
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