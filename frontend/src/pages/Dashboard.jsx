import { useState, useEffect } from 'react'
import { employeeAPI, projectAPI } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const ALL_DATA = {
  Today: [
    { m: '9AM', revenue: 12, projects: 1 }, { m: '10AM', revenue: 18, projects: 2 },
    { m: '11AM', revenue: 15, projects: 1 }, { m: '12PM', revenue: 22, projects: 3 },
    { m: '1PM', revenue: 25, projects: 2 }, { m: '2PM', revenue: 30, projects: 4 },
    { m: '3PM', revenue: 28, projects: 3 }, { m: '4PM', revenue: 35, projects: 5 },
  ],
  'This Week': [
    { m: 'Mon', revenue: 32, projects: 3 }, { m: 'Tue', revenue: 48, projects: 5 },
    { m: 'Wed', revenue: 41, projects: 4 }, { m: 'Thu', revenue: 55, projects: 6 },
    { m: 'Fri', revenue: 60, projects: 7 }, { m: 'Sat', revenue: 38, projects: 3 },
    { m: 'Sun', revenue: 22, projects: 2 },
  ],
  'This Month': [
    { m: 'W1', revenue: 88, projects: 8 }, { m: 'W2', revenue: 104, projects: 11 },
    { m: 'W3', revenue: 96, projects: 9 }, { m: 'W4', revenue: 120, projects: 13 },
  ],
  'This Year': [
    { m: 'Jan', revenue: 42, projects: 3 }, { m: 'Feb', revenue: 58, projects: 5 },
    { m: 'Mar', revenue: 51, projects: 4 }, { m: 'Apr', revenue: 74, projects: 7 },
    { m: 'May', revenue: 82, projects: 8 }, { m: 'Jun', revenue: 91, projects: 9 },
    { m: 'Jul', revenue: 107, projects: 11 }, { m: 'Aug', revenue: 96, projects: 9 },
    { m: 'Sep', revenue: 78, projects: 7 }, { m: 'Oct', revenue: 89, projects: 8 },
    { m: 'Nov', revenue: 103, projects: 10 }, { m: 'Dec', revenue: 118, projects: 12 },
  ],
}

const recentActivity = [
  { action: 'New staff onboarded', name: 'Priya Sharma', time: '2 min ago', type: 'staff' },
  { action: 'Project assigned', name: 'NEXA Mobile App', time: '14 min ago', type: 'project' },
  { action: 'AI Allocation run', name: 'Backend Team', time: '1 hr ago', type: 'ai' },
  { action: 'Staff ID generated', name: 'Ravi Kumar', time: '2 hr ago', type: 'id' },
  { action: 'Project completed', name: 'Web Redesign', time: '3 hr ago', type: 'done' },
]

const topProjects = [
  { name: 'NEXA Mobile App', lead: 'Arjun Singh', progress: 78, status: 'active', team: 6 },
  { name: 'Cloud Migration', lead: 'Priya Sharma', progress: 45, status: 'active', team: 4 },
  { name: 'AI Dashboard', lead: 'Kiran Patel', progress: 92, status: 'review', team: 3 },
  { name: 'Security Audit', lead: 'Meera Nair', progress: 30, status: 'active', team: 2 },
]

const departments = [
  { name: 'Engineering', count: 18, color: '#e63946' },
  { name: 'Design', count: 8, color: '#7c3aed' },
  { name: 'HR', count: 5, color: '#06d6a0' },
  { name: 'Finance', count: 6, color: '#4cc9f0' },
  { name: 'Marketing', count: 7, color: '#fb8500' },
]

const STATUS_ICONS = { staff: '👤', project: '📁', ai: '🤖', id: '🪪', done: '✅' }
const STATUS_COLORS = { active: 'var(--green)', review: 'var(--accent2)', hold: 'var(--primary)' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--panel2)', border: '1px solid var(--panel-border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}{p.name === 'revenue' ? 'K' : ''}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState('This Year')
  const [empStats, setEmpStats] = useState({ total: 44, available: 36, busy: 5, onLeave: 3, avgScore: 85 })
  const [projStats, setProjStats] = useState({ total: 24, active: 10, pending: 5, review: 3, completed: 6, avgCompletion: 52 })
  const navigate = useNavigate()

  useEffect(() => {
    employeeAPI.getStats().then(setEmpStats).catch(() => {})
    projectAPI.getStats().then(setProjStats).catch(() => {})
  }, [])

  const chartData = ALL_DATA[period]
  const totalStaff = empStats.total
  const totalProjects = projStats.total
  const completedProjects = projStats.completed

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Dashboard Overview 📊</h1>
            <p>Welcome to NEXA Admin Portal — Here's what's happening</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="tabs">
              {['Today', 'This Week', 'This Month', 'This Year'].map(p => (
                <button key={p} className={`tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="metric-grid">
        {[
          { label: 'Total Staff', value: totalStaff, icon: '👥', color: '#e63946', change: '+3 this month', up: true },
          { label: 'Active Projects', value: totalProjects, icon: '📁', color: '#4cc9f0', change: '+2 this week', up: true },
          { label: 'Completed', value: completedProjects, icon: '✅', color: '#06d6a0', change: '50% completion rate', up: true },
          { label: 'On Leave', value: 4, icon: '🏖️', color: '#fb8500', change: '2 back Monday', up: false },
        ].map((m, i) => (
          <div key={i} className="metric-card" style={{ '--accent-color': m.color }}>
            <div className="metric-card-top">
              <div className="metric-card-label">{m.label}</div>
              <div className="metric-card-icon" style={{ background: `${m.color}18` }}>{m.icon}</div>
            </div>
            <div className="metric-card-value" style={{ color: m.color }}>{m.value}</div>
            <div className={`metric-card-change ${m.up ? 'up' : 'down'}`}>
              {m.up ? '↑' : '↓'} {m.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 22 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Project Activity</div>
              <div className="card-subtitle">{period} — project completions & revenue</div>
            </div>
            <span className="badge badge-success">↑ 14% vs last year</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e63946" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#e63946" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4cc9f0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4cc9f0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#e63946" fill="url(#colorRev)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="projects" name="projects" stroke="#4cc9f0" fill="url(#colorProj)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 3, background: '#e63946', borderRadius: 99 }}></div> Revenue (K)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 3, background: '#4cc9f0', borderRadius: 99 }}></div> Projects
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Department Distribution</div>
              <div className="card-subtitle">{totalStaff} total employees</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {departments.map(d => (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{d.name}</span>
                  <span style={{ color: d.color, fontWeight: 700 }}>{d.count}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${(d.count / totalStaff) * 100}%`, background: d.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        <div className="card" style={{ padding: 22 }}>
          <div className="card-header">
            <div className="card-title">Active Projects</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>View All →</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Lead</th>
                  <th>Team</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topProjects.map((p, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.lead}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>👥 {p.team}</div></td>
                    <td style={{ width: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-bg" style={{ flex: 1 }}>
                          <div className="progress-bar-fill" style={{ width: `${p.progress}%`, background: p.progress > 80 ? 'var(--green)' : p.progress > 50 ? '#4cc9f0' : 'var(--primary)' }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', minWidth: 28 }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: `${STATUS_COLORS[p.status]}18`, color: STATUS_COLORS[p.status] }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <span className="badge badge-info">Live</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {STATUS_ICONS[a.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{a.action}</div>
                  <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{a.name}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
