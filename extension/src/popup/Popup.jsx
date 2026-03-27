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

      // 3. Send to API (Assume authenticated session via cookies or specific token flow)
      // NOTE: In production, you'd integrate Clerk authentication token here.
      const clerkToken = "TODO: Retrieve Token" 
      
      await axios.post('http://localhost:5000/api/items/save', {
        ...result,
        type: 'article'
      }, {
        headers: { Authorization: `Bearer ${clerkToken}` }
      })

      setStatus('success')
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
