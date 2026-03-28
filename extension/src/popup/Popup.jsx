import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function Popup() {
  const [status, setStatus] = useState('loading') // idle, saving, success, error, loading, unauthorized

  const API_URL = 'https://neurovault-v1-backend.onrender.com'
  const DASHBOARD_URL = 'https://neurovault-v1.onrender.com'

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      await axios.get(`${API_URL}/api/me`, { withCredentials: true })
      setStatus('idle')
      // AUTOMATIC SAVE: If already authenticated, start saving immediately
      handleSave()
    } catch (error) {
      console.error("Auth Check Failed:", error)
      setStatus('unauthorized')
    }
  }

  const handleOpenAuth = (authPath) => {
    chrome.tabs.create({ url: `${DASHBOARD_URL}${authPath}` })
  }

  const handleSave = async () => {
    setStatus('saving')
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            title: document.title,
            content: document.body.innerText.substring(0, 5000),
            url: window.location.href,
            favicon: document.querySelector('link[rel="icon"]')?.href
          }
        }
      })

      try {
        await axios.post(`${API_URL}/api/items/save`, {
          ...result,
          type: 'article'
        }, { withCredentials: true })
        setStatus('success')
        // Auto-close after 1.5s on success
        setTimeout(() => window.close(), 1500)
      } catch (axError) {
        if (axError.response?.status === 401) {
          setStatus('unauthorized')
        } else {
          throw axError
        }
      }
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ padding: '16px', width: '300px', backgroundColor: '#0a0a0a', color: 'white', textAlign: 'center' }}>
        <p>Checking Authentication...</p>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return (
      <div style={{ padding: '16px', width: '300px', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>NeuroVault</h2>
        <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '16px' }}>Please login or sign up to save items to your brain.</p>
        
        <button 
          onClick={() => handleOpenAuth('/sign-in')}
          style={{ width: '100%', padding: '10px', backgroundColor: 'white', color: 'black', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none', marginBottom: '8px' }}
        >
          Log In
        </button>
        <button 
          onClick={() => handleOpenAuth('/sign-up')}
          style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: 'white', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #3f3f46' }}
        >
          Sign Up
        </button>
      </div>
    )
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
