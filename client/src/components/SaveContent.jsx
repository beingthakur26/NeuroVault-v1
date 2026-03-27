import { useState, useEffect } from 'react'
import { Plus, Link as LinkIcon, FileText, Loader2, Tag, FileEdit, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

export default function SaveContent({ onSaved }) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [customTags, setCustomTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoWait, setAutoWait] = useState(false)
  const { getToken } = useAuth()

  useEffect(() => {
    // Intercept Chrome Extension "?saveUrl=" feature
    const params = new URLSearchParams(window.location.search)
    const extUrl = params.get('saveUrl')
    
    if (extUrl) {
      setIsOpen(true)
      setUrl(extUrl)
      
      const extTitle = params.get('title')
      const extSnippet = params.get('snippet')
      
      if (extSnippet) {
        setNotes(extSnippet)
      } else if (extTitle) {
        setNotes(`Saved from extension: ${extTitle}`)
      }

      // Automatically trigger a save sequence so user does not need to click
      const executeAutoSave = async () => {
        setAutoWait(true)
        setLoading(true)
        try {
          const token = await getToken()
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/items/save`, {
            title: extTitle || extUrl,
            url: extUrl,
            type: extSnippet ? 'highlight' : 'article',
            content: extSnippet ? extSnippet : (extTitle ? `Notes: extension save ${extTitle}\n\nContent from ${extUrl}` : `Content from ${extUrl}`),
            manualTags: ['extension', ...(extSnippet ? ['highlight'] : [])]
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (res.data.success) {
            handleReset()
            if (onSaved) onSaved(res.data.item)
          }
        } catch (error) {
          console.error("Auto-save failed:", error)
        } finally {
          setLoading(false)
          setAutoWait(false)
        }
      }

      // Small delay to ensure auth state loads
      const timer = setTimeout(() => {
        executeAutoSave()
      }, 1000)

      // Clean the URL gracefully
      window.history.replaceState({}, document.title, window.location.pathname)

      return () => clearTimeout(timer)
    }
  }, [getToken, onSaved])

  const handleReset = () => {
    setUrl('')
    setFile(null)
    setNotes('')
    setCustomTags('')
    setIsOpen(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!url && !file) return
    
    setLoading(true)
    try {
      const token = await getToken()
      const tagsArray = customTags.split(',').map(t => t.trim()).filter(Boolean)

      if (file) {
        const formData = new FormData()
        formData.append('image', file)
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/items/upload`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'multipart/form-data' 
          }
        })
        
        if (res.data.success) {
          handleReset()
          if (onSaved) onSaved(res.data.item)
        }
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/items/save`, {
          title: url,
          url,
          type: 'article',
          content: notes ? `Notes: ${notes}\n\nContent from ${url}` : `Content from ${url}`,
          manualTags: tagsArray
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.data.success) {
          handleReset()
          if (onSaved) onSaved(res.data.item)
        }
      }
    } catch (error) {
      console.error(error)
      alert("Failed to save. Make sure backend is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8 relative">
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
            >
              <Plus size={20} />
              <span>Add to Brain</span>
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleSave}
            className="bg-[#111] border border-white/10 p-4 rounded-2xl flex flex-col space-y-4 max-w-2xl shadow-xl shadow-black/50"
          >
            {/* Main URL / Upload row */}
            <div className="flex items-center space-x-4 bg-black/50 p-3 rounded-xl border border-white/5">
              <div className="flex space-x-3 text-gray-500">
                <LinkIcon size={20} className="hover:text-white cursor-pointer transition-colors" />
                <label className="cursor-pointer" title="Upload Image for OCR">
                  <ImageIcon size={20} className="hover:text-white transition-colors" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0])
                        setUrl(e.target.files[0].name)
                      }
                    }} 
                  />
                </label>
              </div>
              
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a URL or upload an image..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-600 text-lg"
                autoFocus
                disabled={loading || !!file}
              />
              
              {file && (
                <button 
                  type="button"
                  onClick={() => { setFile(null); setUrl(''); }}
                  className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded"
                >
                  Clear File
                </button>
              )}
            </div>

            {/* Additional details: Notes & Tags */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-black/50 p-3 rounded-xl border border-white/5 flex items-start space-x-3">
                <FileEdit size={18} className="text-gray-500 mt-1" />
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add context, thoughts, or tasks related to this item..."
                  className="bg-transparent outline-none text-sm text-gray-300 placeholder-gray-600 w-full resize-none h-16"
                  disabled={loading || !!file}
                />
              </div>
              
              <div className="flex-1 bg-black/50 p-3 rounded-xl border border-white/5 flex items-start space-x-3">
                <Tag size={18} className="text-gray-500 mt-1" />
                <input 
                  type="text"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  placeholder="Custom tags (comma separated)..."
                  className="bg-transparent outline-none text-sm text-gray-300 placeholder-gray-600 w-full"
                  disabled={loading || !!file}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!url && !file)}
                className="flex items-center space-x-2 bg-white text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <span>{file ? "Analyze Image" : "Save to Brain"}</span>}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
