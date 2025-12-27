import { useEffect, useRef, useState } from 'react'
import './App.css'

const DEFAULT_SESSION_ID = 'demo'

function App() {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('sessionId') || DEFAULT_SESSION_ID
  })
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    const normalized = sessionId.trim() || DEFAULT_SESSION_ID
    localStorage.setItem('sessionId', normalized)
    if (normalized !== sessionId) {
      setSessionId(normalized)
    }
  }, [sessionId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const sendMessage = async () => {
    const trimmed = message.trim()
    if (!trimmed || loading) return

    const normalizedSessionId = sessionId.trim() || DEFAULT_SESSION_ID
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setMessage('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: normalizedSessionId,
          message: trimmed,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const errorMessage = payload?.error || `Request failed (${response.status})`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const answer =
        typeof data?.answer === 'string' && data.answer.trim()
          ? data.answer
          : 'No response received.'

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Health API Demo</p>
          <h1>Care Companion Chat</h1>
          <p className="subtitle">
            Ask a question and get a concise response from your Codex-backed
            assistant.
          </p>
        </div>
        <div className="session-card">
          <label htmlFor="sessionId">Session ID</label>
          <input
            id="sessionId"
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            placeholder={DEFAULT_SESSION_ID}
          />
          <span className="session-hint">Saved locally in your browser.</span>
        </div>
      </header>

      <section className="chat-card">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h2>Start the conversation</h2>
              <p>Send your first message to begin a new session.</p>
            </div>
          ) : (
            messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`message ${item.role}`}
              >
                <div className="message-meta">
                  {item.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="message-body">{item.content}</div>
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant pending">
              <div className="message-meta">Assistant</div>
              <div className="message-body">Thinking...</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <div className="composer-input">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about symptoms, medications, follow-up care..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || message.trim().length === 0}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </section>

      {error ? (
        <div className="status-banner error" role="alert">
          {error}
        </div>
      ) : (
        <div className="status-banner">Replies are generated live.</div>
      )}
    </div>
  )
}

export default App
