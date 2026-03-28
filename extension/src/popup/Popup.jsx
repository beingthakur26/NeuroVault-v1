import React, { useState } from 'react'
import axios from 'axios'

export default function Popup() {
  const [status, setStatus] = useState('idle')

  const handleSave = async () => {
    setStatus('saving')
    try {
      // 1. Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      // 2. Fetch extracted content from content script
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            title: document.title,
            content: document.body.innerText.substring(0, 5000), // Limit payload length
            url: window.location.href,
            favicon: document.querySelector('link[rel="icon"]')?.href
          }
        }
      })

      // 3. Send to API
      const API_URL = 'https://neurovault-v1-backend.onrender.com'
      const DASHBOARD_URL = 'https://neurovault-ui.onrender.com'
      
      try {
        await axios.post(`${API_URL}/api/items/save`, {
          ...result,
          type: 'article'
        })
        setStatus('success')
      } catch (axError) {
        // If 401/Unauthorized, redirect to dashboard as fallback
        if (axError.response?.status === 401) {
          setStatus('error')
          setTimeout(() => {
            chrome.tabs.create({ url: `${DASHBOARD_URL}/dashboard?saveUrl=${encodeURIComponent(result.url)}&title=${encodeURIComponent(result.title)}` })
          }, 1500)
        } else {
          throw axError
        }
      }
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  return (
    <div style={{ padding: '16px', width: '300px', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>NeuroVault</h2>
      <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '16px' }}>Save this page to your brain.</p>
      
      <button 
        onClick={handleSave} 
        disabled={status === 'saving'}
        style={{ width: '100%', padding: '10px', backgroundColor: 'white', color: 'black', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
      >
        {status === 'idle' && 'Save Page'}
        {status === 'saving' && 'Saving...'}
        {status === 'success' && 'Saved!'}
        {status === 'error' && 'Error Saving'}
      </button>
    </div>
  )
}
