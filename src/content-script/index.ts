console.log('content-script')

function sendStorage(storage: Storage) {
    chrome.runtime.sendMessage({
        message: 'update',
        type: getType(storage),
        data: { ...storage }
    }, response => {
        console.log("Received response", response);
    })
}

function getType(storage: Storage) {
    return storage == localStorage ? 'local' : 'session'
}

window.addEventListener('storage', (e) => {
    e.storageArea && sendStorage(e.storageArea)
})

export { }
