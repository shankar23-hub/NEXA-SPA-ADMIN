import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../utils/api'

const SLIDES = [
  { img: '/Image 1.png' },
  { img: '/Image 2.png' },
  { img: '/Image 3.png' },
  { img: '/Image 4.png' },
]

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.login(form.email, form.password)
      localStorage.setItem('nexa_token', data.token)
      onLogin({ ...data.user, avatar: null })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const slide = SLIDES[slideIdx]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* 🔥 FULL SCREEN IMAGE PANEL */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Background Image */}
        <img
          src={slide.img}
          alt="Background"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            top: 0,
            left: 0,
            zIndex: 0,
            transition: 'opacity 1s ease-in-out'
          }}
        />

        {/* Overlay Gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(120deg, rgba(0,0,0,0.6), rgba(0,0,0,0.2))',
          zIndex: 1
        }} />

        {/* Text Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          color: '#fff'
        }}>
          <h1 style={{ fontSize: 42, fontWeight: 900 }}>
            NEXA ADMIN PORTAL
          </h1>
          <p style={{ fontSize: 18, opacity: 0.8 }}>
            AI Powered Project Allocation & Staff Management
          </p>

          {/* Slide indicators */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlideIdx(i)}
                style={{
                  width: i === slideIdx ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === slideIdx ? '#8B5CF6' : '#ffffff55',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 🔐 LOGIN PANEL */}
      <div style={{
        width: 420,
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
      }}>
        <div style={{ width: '100%' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <img src="/nexa-logo.png" style={{ width: 70 }} />
            <h2 style={{ color: '#fff' }}>Welcome Back 👋</h2>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
            />

            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={eyeBtn}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Loading...' : '🔐 Login'}
            </button>
          </form>

          <p style={{ marginTop: 20, color: '#aaa' }}>
            New user? <Link to="/create-account">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  borderRadius: '8px',
  border: 'none',
  outline: 'none'
}

const btnStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  background: '#8B5CF6',
  color: '#fff',
  border: 'none',
  cursor: 'pointer'
}

const eyeBtn = {
  position: 'absolute',
  right: 10,
  top: '35%',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#000'
}