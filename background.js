// background.js (Service Worker)

// Event listener ini akan berjalan ketika ikon ekstensi diklik
chrome.action.onClicked.addListener(async (tab) => { // FIX: Tambahkan 'async (tab)' sebagai parameter
  // Hanya buka side panel di tab aktif saat ini
  // Periksa apakah tab.id valid sebelum membuka side panel
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  } else {
    // Fallback jika tab.id tidak tersedia (misalnya, di halaman khusus Chrome)
    console.warn("Could not open side panel: tab ID not available.");
  }
});

// Anda mungkin juga ingin mengatur default_path side panel saat runtime
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel.html',
    enabled: true
  });
});