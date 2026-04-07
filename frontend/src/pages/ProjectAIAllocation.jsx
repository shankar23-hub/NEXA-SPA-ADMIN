import { useState, useRef } from 'react'
import { allocationAPI, pdfAPI, projectAPI } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const STAGES = [
  { n: 1, title: 'PDF Upload & Parse',  desc: 'Upload project brief PDF — Python extracts requirements', icon: '📄' },
  { n: 2, title: 'Skill Matching',      desc: 'AI matches required skills against staff competencies', icon: '🎯' },
  { n: 3, title: 'Availability Check',  desc: 'Filters out staff currently on leave or overloaded', icon: '📅' },
  { n: 4, title: 'Workload Balance',    desc: 'Applies workload penalty to prevent burnout', icon: '⚖️' },
  { n: 5, title: 'Composite Scoring',   desc: 'Computes final match score for each candidate', icon: '📊' },
  { n: 6, title: 'Optimal Allocation',  desc: 'Recommends best candidate + suggested team', icon: '🏆' },
]

const MOCK_STAFF = [
  { id: 1, name: 'Shankar Rajan',  role: 'AI/ML Engineer',       skills: ['Python','AI','React','TensorFlow'],           availability: 'Available', dept: 'Engineering', color: '#8B5CF6', experience: 6, pastPerformance: 94, currentProjects: 1 },
  { id: 2, name: 'Arun Kumar',     role: 'Full Stack Developer',  skills: ['React','Node.js','SQL','JavaScript'],         availability: 'Busy',      dept: 'Engineering', color: '#F87171', experience: 4, pastPerformance: 80, currentProjects: 3 },
  { id: 3, name: 'Priya Nair',     role: 'Data Scientist',        skills: ['Python','ML','SQL','Pandas','Scikit-learn'],  availability: 'Available', dept: 'Data',        color: '#00C896', experience: 5, pastPerformance: 92, currentProjects: 1 },
  { id: 4, name: 'Vikram Singh',   role: 'Backend Developer',     skills: ['Java','SQL','Python','Spring Boot'],          availability: 'Available', dept: 'Engineering', color: '#FF9F43', experience: 7, pastPerformance: 87, currentProjects: 2 },
  { id: 5, name: 'Divya Menon',    role: 'Frontend Developer',    skills: ['React','HTML5','CSS3','JavaScript','Figma'],  availability: 'Available', dept: 'Design',      color: '#38BDF8', experience: 3, pastPerformance: 78, currentProjects: 1 },
  { id: 6, name: 'Rahul Sharma',   role: 'DevOps Engineer',       skills: ['Python','Docker','Kubernetes','SQL'],         availability: 'Busy',      dept: 'Infra',       color: '#A78BFA', experience: 5, pastPerformance: 83, currentProjects: 2 },
  { id: 7, name: 'Meena Krishnan', role: 'Project Manager',       skills: ['Agile','Scrum','JIRA','SQL'],                availability: 'Available', dept: 'Management',  color: '#34D399', experience: 9, pastPerformance: 91, currentProjects: 1 },
  { id: 8, name: 'Arjun Pillai',   role: 'Security Engineer',     skills: ['Python','JavaScript','SQL','Cybersecurity'],  availability: 'Available', dept: 'Security',    color: '#FCD34D', experience: 6, pastPerformance: 85, currentProjects: 1 },
]

const WEIGHTS = { skill: 0.35, avail: 0.25, exp: 0.20, perf: 0.20 }
const MAX_EXP = 10
const AVAIL_SCORES = { Available: 100, Busy: 40, Leave: 0 }
const WORKLOAD_PENALTY = (n) => n > 2 ? 20 : n > 1 ? 10 : 0

function computeScore(emp, requiredSkills) {
  if (!requiredSkills.length) return 50
  const empSkills = (emp.skills || []).map(s => s.toLowerCase())
  const matched = requiredSkills.filter(sk => empSkills.some(es => es.includes(sk.toLowerCase()) || sk.toLowerCase().includes(es)))
  const sSkill = (matched.length / requiredSkills.length) * 100
  const sAvail = AVAIL_SCORES[emp.availability] ?? 0
  const sExp   = Math.min((emp.experience / MAX_EXP) * 100, 100)
  const sPerf  = emp.pastPerformance ?? 75
  const penalty = WORKLOAD_PENALTY(emp.currentProjects ?? 0)
  const raw = sSkill * WEIGHTS.skill + sAvail * WEIGHTS.avail + sExp * WEIGHTS.exp + sPerf * WEIGHTS.perf - penalty
  return Math.round(Math.max(0, Math.min(100, raw)))
}

function getSkillMatches(emp, requiredSkills) {
  const empSkills = (emp.skills || []).map(s => s.toLowerCase())
  return requiredSkills.filter(sk => empSkills.some(es => es.includes(sk.toLowerCase()) || sk.toLowerCase().includes(es)))
}

function ScoreRing({ score, size = 100 }) {
  const r = (size / 2) - 10
  const circ = 2 * Math.PI * r
  const pct  = score / 100
  const col  = score >= 70 ? '#06d6a0' : score >= 45 ? '#fb8500' : '#e63946'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={8}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: size > 80 ? 22 : 15, fontWeight: 800, color: col }}>{score}%</div>
      </div>
    </div>
  )
}

function StageBadge({ stage, active, done, running }) {
  return (
    <div className="ai-stage" style={{
      borderColor: active || done ? 'rgba(230,57,70,0.35)' : 'var(--panel-border)',
      background:  active || done ? 'rgba(230,57,70,0.05)' : 'rgba(255,255,255,0.02)',
    }}>
      <div className="ai-stage-num" style={{
        background: done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--primary-light)',
        color: active || done ? '#fff' : 'var(--primary)',
        transition: 'all 0.4s ease',
      }}>
        {done ? '✓' : stage.n}
      </div>
      <div className="ai-stage-content">
        <h4 style={{ color: active || done ? 'var(--text)' : 'var(--text-muted)' }}>{stage.icon} {stage.title}</h4>
        <p>{stage.desc}</p>
      </div>
      {active && running && <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 'auto', flexShrink: 0 }}></span>}
    </div>
  )
}

// Proceed Project Modal
function ProceedModal({ results, projectName, skills, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const overview = {
    name: projectName || 'AI-Allocated Project',
    description: `This project has been allocated by the NEXA AI engine based on required skills: ${skills.join(', ')}.`,
    skills,
    lead: results.best,
    team: results.team,
  }

  const tasks = [
    { name: 'Kickoff Meeting & Requirements Review', done: false },
    { name: 'Environment Setup & Repository Creation', done: false },
    { name: 'Sprint 1 Planning', done: false },
    { name: 'Initial Development Phase', done: false },
    { name: 'Code Review & QA', done: false },
    { name: 'UAT & Stakeholder Review', done: false },
    { name: 'Final Deployment', done: false },
  ]

  const milestones = [
    { name: 'Project Kickoff', date: new Date().toISOString().slice(0,10), done: false },
    { name: 'Phase 1 Complete', date: new Date(Date.now()+30*86400000).toISOString().slice(0,10), done: false },
    { name: 'Beta Release', date: new Date(Date.now()+60*86400000).toISOString().slice(0,10), done: false },
    { name: 'Final Launch', date: new Date(Date.now()+90*86400000).toISOString().slice(0,10), done: false },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxWidth: 860 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(230,57,70,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🚀</div>
            <div>
              <div className="modal-title">{overview.name}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span className="badge badge-success">✅ AI Allocated</span>
                <span className="badge badge-info">In Progress</span>
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="tabs" style={{ marginBottom: 20 }}>
          {['overview', 'team', 'tasks', 'milestones'].map(t => (
            <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
            <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--panel-border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>📋 Project Overview</div>
              <div style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7 }}>{overview.description}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>🎯 Required Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {skills.map(s => <span key={s} className="badge badge-success" style={{ fontSize: 12 }}>✓ {s}</span>)}
              </div>
            </div>
            {results.best && (
              <div style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.08),rgba(230,57,70,0.03))', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>🏆 AI Best Match — Project Lead</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <ScoreRing score={results.best.matchScore} size={60} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{results.best.name}</div>
                    <div style={{ color: 'var(--primary)', fontSize: 13 }}>{results.best.role} · {results.best.dept || results.best.department}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div>
            {results.best && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project Lead (Best Match)</div>
                <div style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.08), rgba(230,57,70,0.03))', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: results.best.color || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
                    {results.best.name.split(' ').map(w=>w[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{results.best.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--primary)' }}>{results.best.role}</div>
                    <span className="badge badge-danger" style={{ marginTop: 4 }}>👑 Project Lead · {results.best.matchScore}% Match</span>
                  </div>
                </div>
              </>
            )}
            {results.team?.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggested Team ({results.team.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {results.team.map((m, i) => (
                    <div key={i} style={{ background: 'var(--bg3)', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--panel-border)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: m.color || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                        {m.name.split(' ').map(w=>w[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.role}</div>
                        <span className="badge badge-info" style={{ fontSize: 10, marginTop: 4 }}>Match: {m.matchScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-soft)' }}>Auto-generated Tasks</div>
              <span className="badge badge-info">0/{tasks.length} Done</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--panel-border)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: 11 }}>⏳ Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div>
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'var(--panel-border)' }}></div>
              {milestones.map((m, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
                  <div style={{ position: 'absolute', left: -22, top: 4, width: 14, height: 14, borderRadius: '50%', background: 'var(--panel-border)', border: '2px solid var(--panel)', zIndex: 1 }}></div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>⏳ Upcoming</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>📅 {m.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Close</button>
          <button className="btn btn-primary" disabled={saving} onClick={async () => {
            try {
              setSaving(true)
              const lead = results.best
              const teamMembers = results.team || []
              const allMembers = [lead, ...teamMembers].filter(Boolean)
              const payload = {
                name: overview.name,
                description: overview.description,
                status: 'In Progress',
                priority: 'High',
                progress: 12,
                startDate: new Date().toISOString().slice(0,10),
                endDate: milestones[milestones.length - 1]?.date || '',
                budget: 0,
                teamSize: allMembers.length || 1,
                tech: skills,
                head: lead ? { name: lead.name, role: lead.role, color: 0 } : 'TBD',
                assignedEmployees: allMembers.map(m => m.name),
                team: teamMembers.map((m, i) => ({ name: m.name, role: m.role, color: (i + 1) % 8 })),
                tasks,
                milestones,
                aiSummary: results.analysis?.summary || '',
                riskLevel: results.analysis?.deliveryRisk || 'Medium',
                workloadInsights: results.analysis || null,
                allocationSnapshot: results,
                icon: '🚀',
                color: '#e63946',
              }
              const created = await projectAPI.create(payload)

              // ── Send notifications to allocated employees ──────────────────
              // Notify Project Head
              if (lead && lead.id) {
                try {
                  await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('nexa_token') || ''}`,
                      },
                      body: JSON.stringify({
                        employeeId:  lead.id,
                        employeeName: lead.name,
                        type:        'project_allocation',
                        role:        'Project Head',
                        projectId:   created?.id,
                        projectName: overview.name,
                        message:     `You have been assigned as Project Head for "${overview.name}". The AI allocation engine has selected you based on your skills and performance score (${lead.matchScore}%).`,
                        sentAt:      new Date().toISOString(),
                      }),
                    }
                  )
                } catch {}
              }

              // Notify Team Members
              for (const member of teamMembers) {
                if (member && member.id) {
                  try {
                    await fetch(
                      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('nexa_token') || ''}`,
                        },
                        body: JSON.stringify({
                          employeeId:  member.id,
                          employeeName: member.name,
                          type:        'project_allocation',
                          role:        'Team Member',
                          projectId:   created?.id,
                          projectName: overview.name,
                          message:     `You have been added as a Team Member for "${overview.name}". Project Head: ${lead?.name || 'TBD'}. Check your projects for full details.`,
                          sentAt:      new Date().toISOString(),
                        }),
                      }
                    )
                  } catch {}
                }
              }

              onClose()
              navigate('/projects')
            } catch (err) {
              alert('Failed to save project: ' + err.message)
            } finally {
              setSaving(false)
            }
          }} style={{ flex: 2 }}>
            {saving ? '⏳ Saving & Notifying...' : '✅ Save to Projects →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectAIAllocation() {
  const [file, setFile] = useState(null)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [stage, setStage] = useState(0)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [pdfText, setPdfText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')
  const [backendMode, setBackendMode] = useState(null)
  const [showProceed, setShowProceed] = useState(false)
  const fileRef = useRef()

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) { setSkills(sk => [...sk, s]); setSkillInput('') }
  }

  const handleFile = async (f) => {
    if (!f) return
    setFile(f)
    setStage(1)
    setResults(null)
    setError('')
    try {
      const data = await pdfAPI.analyze(f)
      setBackendMode(true)
      setPdfText(data.text?.slice(0, 2000) || `Extracted from: ${f.name}`)
      if (data.skills?.length) setSkills(data.skills)
    } catch {
      setBackendMode(false)
      const simText = `Extracted from: ${f.name}\n\nProject: Enterprise Web Platform\nRequirements:\n- Frontend: React, TypeScript\n- Backend: Node.js, Python\n- Infrastructure: AWS, Docker\n- Database: PostgreSQL, SQL\n- CI/CD Pipeline`
      setPdfText(simText)
      setSkills(['React', 'Python', 'AWS', 'Docker', 'Node.js'])
    }
    setStage(0)
  }

  const animateStages = async (onDone) => {
    for (let i = 1; i <= 6; i++) {
      setStage(i)
      await new Promise(r => setTimeout(r, 600))
    }
    onDone()
  }

  const runAllocation = async () => {
    if (!skills.length) { alert('Please add required skills or upload a PDF first'); return }
    setRunning(true)
    setResults(null)
    setError('')
    setStage(1)

    const token = localStorage.getItem('nexa_token')
    const isDemo = token === 'demo-mode' || !token

    if (!isDemo) {
      let apiResult = null
      let apiError = null
      const apiPromise = allocationAPI.run({ requiredSkills: skills, projectName: projectName || undefined })
        .then(r => { apiResult = r }).catch(e => { apiError = e })
      await animateStages(async () => { await apiPromise })
      if (apiResult?.success) {
        setBackendMode(true)
        setResults(apiResult)
        setRunning(false)
        return
      }
      if (apiError) setBackendMode(false)
    }

    setBackendMode(false)
    setStage(0)
    for (let i = 1; i <= 6; i++) {
      setStage(i)
      await new Promise(r => setTimeout(r, 620))
    }

    const eligible = MOCK_STAFF.filter(s => s.availability !== 'Leave')
    const scored = eligible.map(s => ({
      ...s,
      matchScore: computeScore(s, skills),
      skillMatches: getSkillMatches(s, skills),
      skillMiss: skills.filter(sk => !getSkillMatches(s, [sk]).length),
      breakdown: {
        skillScore: Math.round((getSkillMatches(s, skills).length / skills.length) * 100),
        availabilityScore: AVAIL_SCORES[s.availability],
        experienceScore: Math.round(Math.min((s.experience / MAX_EXP) * 100, 100)),
        performanceScore: s.pastPerformance,
        workloadPenalty: WORKLOAD_PENALTY(s.currentProjects),
        composite: computeScore(s, skills),
      },
    }))
    scored.sort((a, b) => b.matchScore - a.matchScore)

    const best = scored[0] || null
    const team = scored.slice(1, 4).filter(s => s.matchScore > 40)
    const qualified = scored.filter(s => s.matchScore >= 60)
    const coverage = best && skills.length ? Math.round((best.skillMatches.length / skills.length) * 100) : 0

    setResults({ success: true, best, team, allScored: scored, stats: { evaluated: MOCK_STAFF.length, eligible: eligible.length, qualified: qualified.length, skillCoverage: coverage } })
    setRunning(false)
  }

  const reset = () => { setFile(null); setSkills([]); setSkillInput(''); setStage(0); setResults(null); setPdfText(''); setProjectName(''); setError(''); setBackendMode(null) }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Project AI Allocation 🤖</h1>
            <p>Upload a PDF project brief — Python AI engine analyzes &amp; allocates best-fit staff</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {backendMode === true  && <span className="badge badge-success">🟢 Python Backend Connected</span>}
            {backendMode === false && <span className="badge" style={{ background: 'rgba(251,133,0,0.15)', color: '#fb8500', border: '1px solid rgba(251,133,0,0.25)' }}>🟡 Demo Mode</span>}
            {(file || results) && <button className="btn btn-outline" onClick={reset}>🔄 Reset</button>}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="card-header">
              <div className="card-title">📄 PDF Upload</div>
              <span className="badge badge-info">Python Backend</span>
            </div>
            <div
              className={`upload-zone ${dragOver ? 'dragover' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            >
              <div className="upload-zone-icon">📤</div>
              <h3>{file ? file.name : 'Drop PDF here or click to upload'}</h3>
              <p>{file ? `✅ File loaded — ${(file.size / 1024).toFixed(1)} KB` : 'Project brief, requirements doc, or any PDF'}</p>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            {pdfText && (
              <div style={{ marginTop: 14, background: 'var(--bg3)', borderRadius: 10, padding: 14, border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: backendMode ? 'var(--green)' : 'var(--accent)', marginBottom: 8, letterSpacing: '0.1em' }}>
                  {backendMode ? '✅ PDF EXTRACTED (Python Backend)' : '⚡ SIMULATED EXTRACTION (Demo Mode)'}
                </div>
                <pre style={{ fontSize: 11, color: 'var(--text-soft)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{pdfText}</pre>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>📋 Project Details</div>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input className="form-control" placeholder="e.g. NEXA Mobile App" value={projectName} onChange={e => setProjectName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Required Skills (auto-extracted or manual)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-control" placeholder="Add a skill..."
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                />
                <button className="btn btn-primary" onClick={addSkill}>Add</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, minHeight: 36 }}>
              {skills.map(s => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--primary-light)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 999, fontSize: 12, color: 'var(--accent)' }}>
                  {s}
                  <button onClick={() => setSkills(sk => sk.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {!skills.length && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No skills added yet — upload PDF or add manually</span>}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={runAllocation} disabled={running || !skills.length} style={{ width: '100%' }}>
            {running
              ? <><span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Running AI Pipeline… Stage {stage}/6</>
              : '🚀 Run AI Allocation'}
          </button>

          {error && <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff6b6b' }}>{error}</div>}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="card-title">⚙️ AI Pipeline Stages</div>
              {running && <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Running…</span>}
            </div>
            {STAGES.map(s => (
              <StageBadge key={s.n} stage={s} active={stage === s.n} done={stage > s.n || (!running && results && stage === 0)} running={running} />
            ))}
          </div>

          {results && (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  { label: 'Evaluated', value: results.stats.evaluated, icon: '🔍', color: '#4cc9f0' },
                  { label: 'Eligible',  value: results.stats.eligible,  icon: '✅', color: '#06d6a0' },
                  { label: 'Qualified', value: results.stats.qualified, icon: '⭐', color: '#fb8500' },
                  { label: 'Coverage',  value: `${results.stats.skillCoverage}%`, icon: '🎯', color: '#7c3aed' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 20 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Best Match */}
              {results.best && (
                <div className="ai-result-card" style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>🏆</span>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>Best Match</div>
                    <span className="badge badge-danger">Top Pick</span>
                    {backendMode && <span className="badge badge-success" style={{ fontSize: 10 }}>Python AI</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <ScoreRing score={results.best.matchScore} size={90} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{results.best.name}</div>
                      <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                        {results.best.role} · {results.best.dept || results.best.department}
                      </div>
                      {results.best.breakdown && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10, fontSize: 11 }}>
                          {[
                            { label: 'Skill',    v: results.best.breakdown.skillScore },
                            { label: 'Avail.',   v: results.best.breakdown.availabilityScore },
                            { label: 'Exp.',     v: results.best.breakdown.experienceScore },
                            { label: 'Perf.',    v: results.best.breakdown.performanceScore },
                            { label: '−Penalty', v: results.best.breakdown.workloadPenalty, neg: true },
                          ].map(b => (
                            <div key={b.label} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '4px 8px', textAlign: 'center' }}>
                              <div style={{ color: b.neg ? '#e63946' : 'var(--green)', fontWeight: 700 }}>{b.neg ? '-' : ''}{b.v}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{b.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(results.best.skillMatches || results.best.skills || []).slice(0, 6).map(sk => (
                          <span key={sk} className="badge badge-success" style={{ fontSize: 11 }}>✓ {sk}</span>
                        ))}
                        {(results.best.skillMiss || []).slice(0, 3).map(sk => (
                          <span key={sk} className="badge" style={{ fontSize: 11, background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '1px solid rgba(230,57,70,0.2)' }}>✗ {sk}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested Team */}
              {results.team?.length > 0 && (
                <div className="card" style={{ padding: 18, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>👥 Suggested Team Members</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {results.team.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--panel-border)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: m.color || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {m.name.split(' ').map(w => w[0]).join('').toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.role} · {m.dept || m.department}</div>
                        </div>
                        <ScoreRing score={m.matchScore} size={52} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proceed Project Button */}
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: 16, background: 'linear-gradient(135deg, #06d6a0, #4cc9f0)', borderColor: '#06d6a0' }}
                onClick={() => setShowProceed(true)}
              >
                🚀 Proceed Project — View Full Details
              </button>

              {/* All Candidates */}
              {results.allScored?.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>📋 All Candidates Ranked</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.allScored.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: i === 0 ? 'rgba(230,57,70,0.06)' : 'var(--bg3)', borderRadius: 8, border: `1px solid ${i === 0 ? 'rgba(230,57,70,0.2)' : 'var(--panel-border)'}` }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: m.color || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {m.name.split(' ').map(w => w[0]).join('').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name} {i === 0 ? '🏆' : ''}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.role}</div>
                        </div>
                        <div style={{ width: 160, flexShrink: 0 }}>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${m.matchScore}%`, background: m.matchScore >= 70 ? '#06d6a0' : m.matchScore >= 45 ? '#fb8500' : '#e63946', borderRadius: 999 }} />
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: m.matchScore >= 70 ? '#06d6a0' : m.matchScore >= 45 ? '#fb8500' : '#e63946', width: 38, textAlign: 'right' }}>{m.matchScore}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showProceed && results && (
        <ProceedModal results={results} projectName={projectName} skills={skills} onClose={() => setShowProceed(false)} />
      )}
    </div>
  )
}
