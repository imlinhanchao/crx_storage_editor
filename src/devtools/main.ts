
let panelWindow: { [key:number]: Window} = {};
let tabListener: { [key:number]: ({ data }: { data: any}) => void } = {}
chrome.devtools.panels.create("Storage Editor", "public/logo_128.png", "src/panel/index.html#/devtools", panel => {
  // code invoked on panel creation
  panel.onShown.addListener( (extPanelWindow) => {
    panelWindow[chrome.devtools.inspectedWindow.tabId] = extPanelWindow;
    const tabId = chrome.devtools.inspectedWindow.tabId;
    if (tabListener[tabId]) panelWindow[tabId].removeEventListener('message', tabListener[tabId]);
    tabListener[tabId] = panelListener(chrome.devtools.inspectedWindow.tabId);
    panelWindow[chrome.devtools.inspectedWindow.tabId].addEventListener('message', tabListener[tabId]);
    initTabWindow(tabId)
  });
});

function initTabWindow(tabId: number) {
    chrome.devtools.inspectedWindow.eval(`
      if (!window.postStorage) {
        let _setItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(keyName, keyValue) {
          postStorage(this)
          return _setItem.call(this, keyName, keyValue)
        }
        window.postStorage = (storage) => {
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
      }
      postStorage(localStorage)
      postStorage(sessionStorage)
    `)

    chrome.tabs.sendMessage(tabId, 
      { from: '__devtools_storage_editor', message: 'listen' }, 
      function(response) {
        console.log('send response', response);
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages from content scripts should have sender.tab set
  if (sender.tab && sender.tab.active 
    && chrome.devtools.inspectedWindow.tabId == sender.tab.id 
    && panelWindow) {
    console.log('sender', sender.tab);
    console.log('id', chrome.devtools.inspectedWindow.tabId)
    panelWindow[chrome.devtools.inspectedWindow.tabId].postMessage({ ...request, from: '__devtools_storage_editor'});
    sendResponse({
      result: 'success'
    })
  }
});

function panelListener(tabId: number) {
  return async function({ data }: { data: any}) {
    chrome.tabs.sendMessage(tabId, 
      { from: '__devtools_storage_editor', ...data }, 
      function(response) {
        console.log('send response', response);
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, change) => {
  console.log('id', tabId);
  console.log('status', change);
  if (change.status != 'complete') return;
  initTabWindow(tabId);
})

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