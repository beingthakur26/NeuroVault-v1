// Background service worker for handling cross-origin auth tokens and event listens.
chrome.runtime.onInstalled.addListener(() => {
  console.log('NeuroVault Extension Installed')
})
