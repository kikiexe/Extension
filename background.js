chrome.action.onClicked.addListener(async (tab) => { 
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  } else {
    console.warn("Could not open side panel: tab ID not available.");
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
  });
});