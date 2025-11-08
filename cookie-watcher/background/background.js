// Listen for cookie changes
chrome.cookies.onChanged.addListener((changeInfo) => {
    chrome.storage.sync.get(['notifyChanges'], (data) => {
      if (data.notifyChanges) {
        const cookie = changeInfo.cookie;
        const action = changeInfo.removed ? 'Removed' : 'Added';
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../assets/icon48.png',
          title: `Cookie ${action}`,
          message: `${cookie.name} on ${cookie.domain}`,
          priority: 1
        });
      }
    });
  });
  
  // Listen for tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      chrome.storage.sync.get(['autoRefresh'], (data) => {
        if (data.autoRefresh) {
          // Trigger popup refresh if it's open
          chrome.runtime.sendMessage({ type: 'TAB_UPDATED' }).catch(() => {
            // Popup might not be open, ignore error
          });
        }
      });
    }
  });
  
  // Log when background script starts
  console.log('Cookie Watcher background script loaded');