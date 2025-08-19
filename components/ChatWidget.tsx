'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, History } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface ConversationMeta {
  id: string
  preview: string
  updated_at?: string
}

// Very small markdown bold parser for **text** patterns
function renderMessageContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g) // keep delimiters
  return parts.map((part, idx) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>
    }
    return <span key={idx}>{part}</span>
  })
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamMode, setStreamMode] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showConversations, setShowConversations] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const historyAutoLoadedRef = useRef(false)

  // Load stored conversationId (persist across reloads)
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('titipyuk_conversation_id') : null
      if (stored) setConversationId(stored)
    } catch {}
  }, [])

  // Persist conversationId
  useEffect(() => {
    try {
      if (conversationId) localStorage.setItem('titipyuk_conversation_id', conversationId)
    } catch {}
  }, [conversationId])

  const loadHistory = async () => {
    if (!conversationId || loadingHistory) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/chat/history?conversationId=${conversationId}`)
      const data = await res.json()
      if (Array.isArray(data.messages)) {
        setMessages(data.messages as ChatMessage[])
      }
    } catch {/* ignore */} finally { setLoadingHistory(false); historyAutoLoadedRef.current = true }
  }

  // Fetch conversations list
  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      const res = await fetch('/api/chat/conversations')
      const data = await res.json()
      if (Array.isArray(data.conversations)) {
        const mapped: ConversationMeta[] = data.conversations.map((c: any) => ({
          id: c.conversation_id || c.id,
          preview: (c.last_message || c.preview || 'Percakapan').slice(0, 40),
          updated_at: c.updated_at || c.created_at
        }))
        setConversations(mapped)
      }
    } catch {/* ignore */} finally { setLoadingConversations(false) }
  }

  // Toggle conversation list
  const toggleConversations = () => {
    setShowConversations(v => {
      const next = !v
      if (!v) loadConversations()
      return next
    })
  }

  const openConversation = async (id: string) => {
    setConversationId(id)
    setMessages([])
    historyAutoLoadedRef.current = false
    setShowConversations(false)
    await loadHistory()
  }

  // Auto load history when widget opened first time
  useEffect(() => {
    if (open && conversationId && messages.length === 0 && !historyAutoLoadedRef.current) {
      loadHistory()
    }
  }, [open, conversationId, messages.length])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const newConversation = () => {
    setMessages([])
    setConversationId(null)
    historyAutoLoadedRef.current = false
    try { localStorage.removeItem('titipyuk_conversation_id') } catch {}
  }

  const refreshConversationsBackground = () => {
    if (showConversations) loadConversations()
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    if (streamMode) {
      await streamSend([...messages, userMsg])
    } else {
      await normalSend([...messages, userMsg])
    }
    // refresh list silently
    refreshConversationsBackground()
  }

  const normalSend = async (all: ChatMessage[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: all, conversationId })
      })
      const data = await res.json()
      if (data.conversationId && !conversationId) setConversationId(data.conversationId)
      if (data.reply?.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply.content }])
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, lagi ada masalah server.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error jaringan.' }])
    } finally {
      setLoading(false)
    }
  }

  const streamSend = async (all: ChatMessage[]) => {
    setLoading(true)
    // show streaming message immediately
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: all, conversationId })
      })
      const headerConv = res.headers.get('x-conversation-id')
      if (headerConv && !conversationId) setConversationId(headerConv)
      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const clone = [...prev]
          const lastIndex = clone.findIndex(m => m.streaming)
          if (lastIndex !== -1) {
            clone[lastIndex] = { ...clone[lastIndex], content: clone[lastIndex].content + chunk }
          }
          return clone
        })
      }
      setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m))
    } catch (e) {
      setMessages(prev => prev.map(m => m.streaming ? { ...m, content: (m.content || '') + '\n[Stream error]' , streaming: false } : m))
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-primary text-primary-foreground w-14 h-14 shadow-lg flex items-center justify-center"
        aria-label="Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-80 md:w-96 h-[480px] bg-background border rounded-lg shadow-xl flex flex-col">
          <div className="p-3 border-b flex items-center justify-between gap-2">
            <span className="font-semibold text-sm">Asisten TitipYuk</span>
            <div className="flex items-center gap-2">
              <button onClick={newConversation} title="Percakapan baru" className="text-xs underline text-primary">Baru</button>
              <button onClick={toggleConversations} title="Riwayat" className="text-xs underline text-primary flex items-center gap-1">
                <History className="h-3 w-3" /> Riwayat
              </button>
              <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                <input type="checkbox" checked={streamMode} onChange={e => setStreamMode(e.target.checked)} /> Stream
              </label>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative flex-1">
            <div ref={scrollRef} className="absolute inset-0 overflow-y-auto p-3 space-y-3 text-sm">
              {messages.length === 0 && !conversationId && !showConversations && (
                <div className="text-muted-foreground text-xs">Tanya apa aja soal TitipYuk (harga, proses, dsb). 🙌</div>
              )}
              {messages.length === 0 && conversationId && !loadingHistory && !showConversations && (
                <button onClick={loadHistory} className="text-xs underline text-primary disabled:opacity-50" disabled={loadingHistory}>{loadingHistory ? 'Memuat...' : 'Muat riwayat percakapan'}</button>
              )}
              {loadingHistory && !showConversations && <div className="text-xs text-muted-foreground">Memuat riwayat...</div>}
              {!showConversations && messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={`inline-block rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.role === 'assistant' ? renderMessageContent(m.content) : m.content}
                    {m.streaming && <span className="animate-pulse">▍</span>}
                  </div>
                </div>
              ))}
              {!showConversations && loading && !streamMode && <div className="text-xs text-muted-foreground">Mengetik...</div>}
              {!showConversations && loading && streamMode && messages.filter(m => m.streaming).length === 0 && (
                <div className="text-xs text-muted-foreground">Mengetik...</div>
              )}
            </div>
            {showConversations && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col">
                <div className="p-2 border-b flex items-center justify-between">
                  <span className="text-xs font-semibold">Riwayat Percakapan</span>
                  <button onClick={() => setShowConversations(false)} className="text-xs underline">Tutup</button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {loadingConversations && <div className="text-xs text-muted-foreground">Memuat...</div>}
                  {!loadingConversations && conversations.length === 0 && (
                    <div className="text-xs text-muted-foreground">Belum ada riwayat.</div>
                  )}
                  {conversations.map(c => (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c.id)}
                      className={`w-full text-left border rounded p-2 hover:bg-muted transition text-xs ${c.id === conversationId ? 'bg-muted' : ''}`}
                    >
                      <div className="font-medium truncate">{c.preview || 'Percakapan'}</div>
                      {c.updated_at && <div className="text-[10px] text-muted-foreground">{new Date(c.updated_at).toLocaleString('id-ID', { hour12: false })}</div>}
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t flex gap-2">
                  <button onClick={loadConversations} className="text-xs underline">Refresh</button>
                  <button onClick={() => { newConversation(); setShowConversations(false) }} className="text-xs underline text-primary">Percakapan Baru</button>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm bg-background"
              placeholder="Ketik pertanyaan..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              maxLength={800}
              disabled={showConversations}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim() || showConversations}
              className="rounded bg-primary text-primary-foreground px-3 py-1 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
