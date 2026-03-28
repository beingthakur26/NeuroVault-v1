document.addEventListener('DOMContentLoaded', async () => {
  const saveBtn = document.getElementById('saveBtn');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const authContainer = document.getElementById('authContainer');
  const saveContainer = document.getElementById('saveContainer');
  const statusMsg = document.getElementById('statusMsg');

  const API_URL = 'https://neurovault-v1-backend.onrender.com';
  const DASHBOARD_URL = 'https://neurovault-v1.onrender.com';

  // const API_URL = 'http://localhost:5000';
  // const DASHBOARD_URL = 'http://localhost:5173';

  // Auth Check
  try {
    const res = await fetch(`${API_URL}/api/me`, { credentials: 'include' });
    if (res.ok) {
      statusMsg.style.display = 'none';
      saveContainer.style.display = 'block';
      // AUTOMATIC SAVE: If already authenticated, start saving immediately
      performSave();
    } else {
      throw new Error('Unauthorized');
    }
  } catch (error) {
    statusMsg.style.display = 'none';
    authContainer.style.display = 'block';
  }

  // Auth Button Handlers
  loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/sign-in` });
  });

  signupBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}/sign-up` });
  });

  // Save Handler
  saveBtn.addEventListener('click', performSave);

  async function performSave() {
    saveBtn.disabled = true;
    saveBtn.innerText = 'Extracting...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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

      const res = await fetch(`${API_URL}/api/items/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...result,
          type: 'article'
        })
      });

      if (res.ok) {
        saveBtn.innerText = 'Saved!';
        setTimeout(() => window.close(), 1500);
      } else if (res.status === 401) {
        saveContainer.style.display = 'none';
        authContainer.style.display = 'block';
      } else {
        saveBtn.innerText = 'Error Saving';
        saveBtn.disabled = false;
      }
    } catch (error) {
      console.error(error);
      saveBtn.innerText = 'Error Saving';
      saveBtn.disabled = false;
    }
  }
});
