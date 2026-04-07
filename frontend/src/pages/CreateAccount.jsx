import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../utils/api'

const ROLES = ['Administrator', 'Project Manager', 'HR Manager', 'Operations Lead']

export default function CreateAccount({ onLogin }) {
  const [form,    setForm]    = useState({ name: '', email: '', role: 'Administrator', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const data = await authAPI.signup({
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     form.role,
        dept:     'Management',
      })
      localStorage.setItem('nexa_token', data.token)
      setSuccess('Account created! Signing you in…')
      setTimeout(() => onLogin({ ...data.user, avatar: null }), 800)
    } catch (err) {
      setError(err.message || 'Unable to create account. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" style={{ background: 'var(--blue)' }}></div>
      <div className="auth-bg-orb auth-bg-orb-2" style={{ background: 'var(--purple)' }}></div>

      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-brand-big">
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔷</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Create NEXA Admin Account</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 360 }}>
            Register your portal administrator and start managing staff, projects, and AI-powered resource allocation from one place.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['🍃 Stored securely in MongoDB', '🔐 JWT-authenticated sessions', '🤖 AI-powered project allocation', '📊 Real-time dashboards'].map(txt => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
                <span>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/nexa-logo.png" alt="NEXA" style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 10 }} />
            <h2 style={{ margin: 0 }}>Create Account</h2>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-soft)' }}>Registers a new admin in MongoDB</p>
          </div>

          {error   && <div style={{ background: 'rgba(230,57,70,0.1)',   border: '1px solid rgba(230,57,70,0.2)',   borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff6b6b'  }}>{error}</div>}
          {success && <div style={{ background: 'rgba(6,214,160,0.1)',   border: '1px solid rgba(6,214,160,0.2)',   borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#8cffd9' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="John Doe" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder="admin@nexa.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={set('role')}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" placeholder="Repeat your password" value={form.confirm} onChange={set('confirm')} required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account…' : '✨ Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--text-soft)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
