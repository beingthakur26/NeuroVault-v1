document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('saveBtn');

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.innerText = 'Extracting...';

    try {
      // 1. Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 2. Fetch extracted content from content script manually via scripting
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            title: document.title,
            content: document.body.innerText.substring(0, 5000),
            url: window.location.href,
            favicon: document.querySelector('link[rel="icon"]')?.href || ''
          };
        }
      });

      saveBtn.innerText = 'Saving...';

      // 3. To save, we actually just open the Dashboard Save URL with payload
      // Since clerk auth in a vanilla extension requires complex cookie sharing,
      // it is easiest to pass the URL to the user's dashboard!
      const API_URL = 'https://neurovault-v1-backend.onrender.com';
      const DASHBOARD_URL = 'https://neurovault-ui.onrender.com';
      const dashboardUrl = `${DASHBOARD_URL}/dashboard?saveUrl=${encodeURIComponent(result.url)}&title=${encodeURIComponent(result.title)}`;
      
      // Alternatively try calling backend directly and let Clerk cookie pass if it exists
      const res = await fetch(`${API_URL}/api/items/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.url,
          title: result.title,
          content: result.content,
          type: 'article',
          favicon: result.favicon
        })
      });

      if (res.ok) {
        saveBtn.innerText = 'Saved!';
      } else {
        saveBtn.innerText = 'Auth Required (Open Dashboard)';
        setTimeout(() => {
          chrome.tabs.create({ url: dashboardUrl });
        }, 1500)
      }
    } catch (error) {
      console.error(error);
      saveBtn.innerText = 'Error Saving';
    }
  });
});
