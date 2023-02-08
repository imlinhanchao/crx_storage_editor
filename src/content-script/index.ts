console.log('content-script')

function sendStorage(storage: Storage) {
    chrome.runtime.sendMessage({
        message: 'update',
        type: getType(storage),
        data: { ...storage }
    }, response => {
        console.log('update response', response);
    })
    return storage;
}

function getType(storage: Storage) {
    return storage == localStorage ? 'local' : 'session'
}

window.addEventListener('message', ({ data }) => {
    if (data.from != 'tab_storage_editor') return;
    switch (data.message) {
      case 'storage':
        sendStorage(data.data == 'local' ? localStorage : sessionStorage);
        break;
    
      default:
        break;
    }
})

chrome.runtime.onMessage.addListener(function (message, sender) {
  let request = message;
  if (request.from != '__devtools_storage_editor') return;
  switch(request.message) {
    case 'send':
      send(request.data)
      break;
    case 'listen':
      window.postMessage({
        from: '__content_script_storage_editor',
        message: 'listen'
      })      
      break;
  }
});

function send(type: string) {
  switch (type) {
    case 'local':
      sendStorage(localStorage);
      break;
    case 'session':
      sendStorage(sessionStorage);
      break;
    default:
      break;
  }
}

export { }
