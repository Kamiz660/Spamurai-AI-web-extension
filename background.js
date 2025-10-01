chrome.runtime.onInstalled.addListener(() =>{
    chrome.storage.sync.get9([geminiApiKey], (data) => {
        if(!data.geminiApiKey){
            chrome.tabs.create({url: "options.html"});
        };    
    });
});