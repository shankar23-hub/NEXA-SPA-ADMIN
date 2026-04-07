import { useState, useEffect } from 'react'
import { projectAPI } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const AVATAR_COLORS = ['#e63946','#7c3aed','#06d6a0','#4cc9f0','#fb8500','#ff4d6d','#3a86ff','#8338ec']

const INITIAL_PROJECTS = [
  {
    id: 1, name: 'NEXA Mobile App', icon: '📱', color: '#e63946',
    status: 'In Progress', priority: 'High', progress: 78,
    startDate: '2024-01-15', endDate: '2024-06-30', budget: '₹12,00,000',
    head: { name: 'Arjun Singh', role: 'Senior Developer', color: 0 },
    team: [
      { name: 'Priya Sharma', role: 'UI/UX Designer', color: 1 },
      { name: 'Ravi Kumar', role: 'DevOps', color: 4 },
    ],
    description: 'A complete mobile application for NEXA clients featuring real-time project tracking, team collaboration, and AI-powered insights.',
    tech: ['React Native', 'Node.js', 'MongoDB', 'AWS'],
    tasks: [
      { name: 'UI Design Completion', done: true },
      { name: 'API Integration', done: true },
      { name: 'Beta Testing', done: false },
    ],
    milestones: [
      { name: 'Design Phase', date: '2024-02-15', done: true },
      { name: 'Testing Phase', date: '2024-06-01', done: false },
    ]
  },
]

const STATUS_CONFIG = {
  'In Progress': { color: '#4cc9f0', bg: 'rgba(76,201,240,0.1)', icon: '🔄' },
  'Completed':   { color: '#06d6a0', bg: 'rgba(6,214,160,0.1)',  icon: '✅' },
  'On Hold':     { color: '#fb8500', bg: 'rgba(251,133,0,0.1)',  icon: '⏸️' },
  'Review':      { color: '#ffd166', bg: 'rgba(255,209,102,0.1)',icon: '👁️' },
  'Planning':    { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: '📋' },
}
const PRIORITY_CONFIG = {
  'Critical': { color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
  'High':     { color: '#fb8500', bg: 'rgba(251,133,0,0.1)' },
  'Medium':   { color: '#4cc9f0', bg: 'rgba(76,201,240,0.1)' },
  'Low':      { color: '#06d6a0', bg: 'rgba(6,214,160,0.1)' },
}

// EDIT MODAL - Only editable fields; head/team PRESERVED
function EditProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    budget:      project.budget      || '',
    description: project.description || '',
    startDate:   project.startDate   || '',
    endDate:     project.endDate     || '',
    status:      project.status      || 'Planning',
    priority:    project.priority    || 'Medium',
    progress:    project.progress    ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">✏️ Edit Project — {project.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ background:'rgba(76,201,240,0.06)',border:'1px solid rgba(76,201,240,0.15)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#4cc9f0' }}>
          ℹ️ Only budget, description, dates, status, priority and progress are editable. Author &amp; team details are preserved automatically.
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">📊 Status</label>
            <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
              {Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">🚦 Priority</label>
            <select className="form-control" value={form.priority} onChange={e=>set('priority',e.target.value)}>
              {Object.keys(PRIORITY_CONFIG).map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">💰 Budget</label>
          <input className="form-control" value={form.budget} onChange={e=>set('budget',e.target.value)} placeholder="e.g. ₹10,00,000"/>
        </div>
        <div className="form-group">
          <label className="form-label">📈 Progress: {form.progress}%</label>
          <input className="form-control" type="range" min="0" max="100" value={form.progress} onChange={e=>set('progress',Number(e.target.value))}/>
        </div>
        <div className="form-group">
          <label className="form-label">📝 Description</label>
          <textarea className="form-control" rows={4} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Project description..."/>
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">📅 Start Date</label>
            <input className="form-control" type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)}/>
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">🏁 End Date</label>
            <input className="form-control" type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)}/>
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginTop:16 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave} style={{ flex:2 }}>
            {saving?'⏳ Saving...':'💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// NEW PROJECT MODAL
function NewProjectModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name:'', icon:'📁', color:'#e63946', status:'Planning', priority:'Medium',
    budget:'', description:'', startDate:'', endDate:'',
    headName:'', headRole:'',
  })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const ICONS = ['📁','📱','☁️','🤖','🔒','🛒','👔','🚀','💡','🌐','🔧','📊']
  const COLORS = ['#e63946','#7c3aed','#06d6a0','#4cc9f0','#fb8500','#ff4d6d','#3a86ff','#8338ec']

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Project name is required'); return }
    setSaving(true)
    await onSave({
      ...form,
      head:{ name:form.headName||'TBD', role:form.headRole||'Lead', color:0 },
      team:[], tasks:[], milestones:[], tech:[], progress:0,
    })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">➕ Create New Project</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display:'flex',gap:16,marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',marginBottom:8 }}>ICON</div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,width:180 }}>
              {ICONS.map(ic=>(
                <button key={ic} onClick={()=>set('icon',ic)} style={{ width:34,height:34,fontSize:18,borderRadius:8,border:`2px solid ${form.icon===ic?'var(--primary)':'var(--panel-border)'}`,background:'var(--bg3)',cursor:'pointer' }}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',marginBottom:8 }}>COLOR</div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
              {COLORS.map(c=>(
                <div key={c} onClick={()=>set('color',c)} style={{ width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',border:form.color===c?'3px solid #fff':'3px solid transparent' }}></div>
              ))}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. NEXA Mobile App"/>
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
              {Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Priority</label>
            <select className="form-control" value={form.priority} onChange={e=>set('priority',e.target.value)}>
              {Object.keys(PRIORITY_CONFIG).map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Budget</label>
          <input className="form-control" value={form.budget} onChange={e=>set('budget',e.target.value)} placeholder="e.g. ₹10,00,000"/>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={3} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Project overview..."/>
        </div>
        <div className="form-grid">
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Start Date</label>
            <input className="form-control" type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)}/>
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">End Date</label>
            <input className="form-control" type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)}/>
          </div>
        </div>
        <div style={{ fontSize:11,fontWeight:800,color:'var(--primary)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.1em' }}>Project Head</div>
        <div className="form-grid">
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Head Name</label>
            <input className="form-control" value={form.headName} onChange={e=>set('headName',e.target.value)} placeholder="e.g. John Doe"/>
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Head Role</label>
            <input className="form-control" value={form.headRole} onChange={e=>set('headRole',e.target.value)} placeholder="e.g. Tech Lead"/>
          </div>
        </div>
        <div style={{ display:'flex',gap:10,marginTop:8 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave} style={{ flex:2 }}>
            {saving?'⏳ Creating...':'✅ Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

// DELETE CONFIRMATION MODAL
function DeleteModal({ project, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:440 }}>
        <div className="modal-header">
          <div className="modal-title" style={{ color:'#e63946' }}>🗑️ Delete Project</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ textAlign:'center',padding:'10px 0 20px' }}>
          <div style={{ fontSize:52,marginBottom:12 }}>{project.icon}</div>
          <div style={{ fontSize:16,fontWeight:700,marginBottom:8 }}>{project.name}</div>
          <div style={{ fontSize:13,color:'var(--text-muted)',lineHeight:1.6 }}>
            Are you sure you want to delete this project?<br/>
            <strong style={{ color:'#e63946' }}>This action cannot be undone.</strong>
          </div>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex:1 }}>Cancel</button>
          <button className="btn" disabled={deleting}
            style={{ flex:1,background:'#e63946',color:'#fff',border:'none',cursor:'pointer',padding:'10px 0',borderRadius:10,fontWeight:700 }}
            onClick={async()=>{ setDeleting(true); await onConfirm() }}>
            {deleting?'⏳ Deleting...':'🗑️ Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectDetailModal({ project, onClose, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [analysis, setAnalysis] = useState(project.allocationSnapshot||null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const sc = STATUS_CONFIG[project.status]||STATUS_CONFIG['Planning']
  const pc = PRIORITY_CONFIG[project.priority]||PRIORITY_CONFIG['Medium']
  const doneTasks = project.tasks.filter(t=>t.done).length

  useEffect(()=>{
    let mounted = true
    if(!analysis && project.id){
      setAnalysisLoading(true)
      projectAPI.getAnalysis(project.id)
        .then(data=>{ if(mounted) setAnalysis(data) })
        .catch(()=>{})
        .finally(()=>{ if(mounted) setAnalysisLoading(false) })
    }
    return ()=>{ mounted=false }
  },[project.id])

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg" style={{ maxWidth:860 }}>
        <div className="modal-header">
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:48,height:48,borderRadius:12,background:`${project.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>{project.icon}</div>
            <div>
              <div className="modal-title">{project.name}</div>
              <div style={{ display:'flex',gap:8,marginTop:4 }}>
                <span className="badge" style={{ background:sc.bg,color:sc.color }}>{sc.icon} {project.status}</span>
                <span className="badge" style={{ background:pc.bg,color:pc.color }}>🚦 {project.priority}</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={onEdit}>✏️ Edit</button>
            <button className="btn btn-sm" style={{ background:'rgba(230,57,70,0.12)',color:'#e63946',border:'1px solid rgba(230,57,70,0.2)' }} onClick={onDelete}>🗑️ Delete</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom:20 }}>
          {['overview','team','tasks','milestones','ai analysis'].map(t=>(
            <button key={t} className={`tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)} style={{ textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>

        {activeTab==='overview' && (
          <div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
              {[
                { label:'Progress',value:`${project.progress}%`,icon:'📊',color:project.color },
                { label:'Budget',value:project.budget||'—',icon:'💰',color:'#06d6a0' },
                { label:'Tasks Done',value:`${doneTasks}/${project.tasks.length}`,icon:'✅',color:'#4cc9f0' },
                { label:'Team Size',value:`${project.team.length+1}`,icon:'👥',color:'#7c3aed' },
              ].map(s=>(
                <div key={s.label} style={{ background:'var(--bg3)',borderRadius:10,padding:14,border:'1px solid var(--panel-border)' }}>
                  <div style={{ fontSize:20,marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:20,fontWeight:800,color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13 }}>
                <span style={{ fontWeight:600 }}>Overall Progress</span>
                <span style={{ color:project.color,fontWeight:700 }}>{project.progress}%</span>
              </div>
              <div className="progress-bar-bg" style={{ height:10 }}>
                <div className="progress-bar-fill" style={{ width:`${project.progress}%`,background:`linear-gradient(90deg,${project.color},${project.color}99)` }}></div>
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,marginBottom:8,color:'var(--text-soft)' }}>PROJECT DESCRIPTION</div>
              <div style={{ fontSize:13.5,color:'var(--text-soft)',lineHeight:1.7,background:'var(--bg3)',padding:14,borderRadius:10,border:'1px solid var(--panel-border)' }}>{project.description}</div>
            </div>
            {!!project.aiSummary && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13,fontWeight:700,marginBottom:8,color:'#a78bfa' }}>AI SUMMARY</div>
                <div style={{ fontSize:13.5,color:'var(--text-soft)',lineHeight:1.7,background:'rgba(124,58,237,0.08)',padding:14,borderRadius:10,border:'1px solid rgba(124,58,237,0.15)' }}>{project.aiSummary}</div>
              </div>
            )}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,marginBottom:8,color:'var(--text-soft)' }}>TECH STACK</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {project.tech.map(t=><span key={t} className="badge badge-purple" style={{ fontSize:12 }}>⚙️ {t}</span>)}
              </div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div className="profile-detail-item"><div className="profile-detail-label">📅 Start Date</div><div className="profile-detail-value">{project.startDate}</div></div>
              <div className="profile-detail-item"><div className="profile-detail-label">🏁 End Date</div><div className="profile-detail-value">{project.endDate}</div></div>
            </div>
          </div>
        )}

        {activeTab==='team' && (
          <div>
            <div style={{ fontSize:13,fontWeight:700,marginBottom:12,color:'var(--primary)',textTransform:'uppercase',letterSpacing:'0.1em' }}>Project Head</div>
            <div style={{ background:'linear-gradient(135deg,rgba(230,57,70,0.08),rgba(230,57,70,0.03))',border:'1px solid rgba(230,57,70,0.2)',borderRadius:12,padding:18,display:'flex',alignItems:'center',gap:14,marginBottom:20 }}>
              <div style={{ width:56,height:56,borderRadius:14,background:AVATAR_COLORS[project.head?.color??0],display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff' }}>
                {(project.head?.name||'TBD').split(' ').map(w=>w[0]).join('').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:16,fontWeight:800 }}>{project.head?.name||'TBD'}</div>
                <div style={{ fontSize:13,color:'var(--primary)' }}>{project.head?.role||''}</div>
                <span className="badge badge-danger" style={{ marginTop:4 }}>👑 Project Head</span>
              </div>
            </div>
            <div style={{ fontSize:13,fontWeight:700,marginBottom:12,color:'var(--text-soft)',textTransform:'uppercase',letterSpacing:'0.1em' }}>Team Members ({project.team.length})</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {project.team.map((m,i)=>(
                <div key={i} style={{ background:'var(--bg3)',borderRadius:12,padding:14,display:'flex',alignItems:'center',gap:12,border:'1px solid var(--panel-border)' }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:AVATAR_COLORS[m.color??(i%8)],display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#fff' }}>
                    {m.name.split(' ').map(w=>w[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:14 }}>{m.name}</div>
                    <div style={{ fontSize:12,color:'var(--text-muted)' }}>{m.role}</div>
                  </div>
                </div>
              ))}
              {project.team.length===0 && <div style={{ color:'var(--text-muted)',fontSize:13,gridColumn:'1/-1' }}>No team members assigned yet.</div>}
            </div>
          </div>
        )}

        {activeTab==='tasks' && (
          <div>
            <div style={{ marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div style={{ fontSize:14,fontWeight:600,color:'var(--text-soft)' }}>Task Completion</div>
              <span className="badge badge-info">{doneTasks}/{project.tasks.length} Done</span>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {project.tasks.map((t,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:t.done?'rgba(6,214,160,0.05)':'var(--bg3)',borderRadius:10,border:`1px solid ${t.done?'rgba(6,214,160,0.15)':'var(--panel-border)'}` }}>
                  <div style={{ width:24,height:24,borderRadius:'50%',background:t.done?'var(--green)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0 }}>{t.done?'✓':i+1}</div>
                  <div style={{ flex:1,fontSize:14,fontWeight:500,color:t.done?'var(--text-muted)':'var(--text)',textDecoration:t.done?'line-through':'none' }}>{t.name}</div>
                  <span className="badge" style={{ background:t.done?'rgba(6,214,160,0.1)':'rgba(255,255,255,0.05)',color:t.done?'var(--green)':'var(--text-muted)',fontSize:11 }}>{t.done?'✅ Done':'⏳ Pending'}</span>
                </div>
              ))}
              {project.tasks.length===0 && <div style={{ color:'var(--text-muted)',textAlign:'center',padding:20 }}>No tasks defined.</div>}
            </div>
          </div>
        )}

        {activeTab==='milestones' && (
          <div>
            <div style={{ position:'relative',paddingLeft:28 }}>
              <div style={{ position:'absolute',left:11,top:0,bottom:0,width:2,background:'var(--panel-border)' }}></div>
              {project.milestones.map((m,i)=>(
                <div key={i} style={{ position:'relative',marginBottom:20 }}>
                  <div style={{ position:'absolute',left:-22,top:4,width:14,height:14,borderRadius:'50%',background:m.done?'var(--green)':'var(--panel-border)',border:'2px solid var(--panel)',zIndex:1 }}></div>
                  <div style={{ background:'var(--bg3)',borderRadius:10,padding:'12px 16px',border:`1px solid ${m.done?'rgba(6,214,160,0.15)':'var(--panel-border)'}` }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      <div style={{ fontWeight:600,fontSize:14 }}>{m.name}</div>
                      <span className="badge" style={{ background:m.done?'rgba(6,214,160,0.1)':'rgba(255,255,255,0.05)',color:m.done?'var(--green)':'var(--text-muted)' }}>{m.done?'✅ Completed':'⏳ Upcoming'}</span>
                    </div>
                    <div style={{ fontSize:12,color:'var(--text-muted)',marginTop:4 }}>📅 {m.date}</div>
                  </div>
                </div>
              ))}
              {project.milestones.length===0 && <div style={{ color:'var(--text-muted)',fontSize:13 }}>No milestones defined.</div>}
            </div>
          </div>
        )}

        {activeTab==='ai analysis' && (
          <div>
            {analysisLoading && <div className="empty-state"><div className="empty-state-icon">⏳</div><h3>Analyzing...</h3></div>}
            {!analysisLoading && analysis && (
              <div style={{ display:'grid',gap:14 }}>
                <div style={{ background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.15)',borderRadius:12,padding:16 }}>
                  <div style={{ fontWeight:700,color:'#a78bfa',marginBottom:8 }}>🤖 Allocation Summary</div>
                  <div style={{ lineHeight:1.7,color:'var(--text-soft)' }}>{analysis.analysis?.summary||'No AI summary available.'}</div>
                </div>
              </div>
            )}
            {!analysisLoading && !analysis && <div className="empty-state"><div className="empty-state-icon">🤖</div><h3>No AI analysis available</h3></div>}
          </div>
        )}

        <div style={{ marginTop:20 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ width:'100%' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

function normalizeProj(p) {
  const statusMap = { Active:'In Progress', Pending:'Planning', Review:'Review', Completed:'Completed' }
  return {
    ...p,
    status:   statusMap[p.status]||p.status||'Planning',
    icon:     p.icon  ||'📁',
    color:    p.color ||'#e63946',
    progress: p.completion??p.progress??0,
    endDate:  p.deadline  ||p.endDate  ||'',
    head:     p.head?(typeof p.head==='string'?{name:p.head,role:'Lead',color:0}:p.head):{name:'TBD',role:'',color:0},
    team:     Array.isArray(p.team)?p.team:[],
    aiSummary: p.aiSummary||'',
    riskLevel: p.riskLevel||'Medium',
    allocationSnapshot: p.allocationSnapshot||null,
    tasks:    Array.isArray(p.tasks)?p.tasks:[],
    milestones: Array.isArray(p.milestones)?p.milestones:[],
    tech:     Array.isArray(p.tech)?p.tech:[],
  }
}

export default function ProjectStatus() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(()=>setToast(null), 3500)
  }

  useEffect(()=>{
    projectAPI.getAll()
      .then(data=>setProjects(data.map(normalizeProj)))
      .catch(()=>{})
  },[])

  const filtered = projects.filter(p=>{
    const matchS = filterStatus==='All'||p.status===filterStatus
    const matchQ = !search||p.name.toLowerCase().includes(search.toLowerCase())
    return matchS && matchQ
  })

  // EDIT: only updates editable fields, preserves head/team
  const handleEditSave = async (form) => {
    try {
      const existing = projects.find(p=>p.id===editing.id)||editing
      const payload = {
        ...existing,
        budget:     form.budget,
        description:form.description,
        startDate:  form.startDate,
        endDate:    form.endDate,
        status:     form.status,
        priority:   form.priority,
        progress:   Number(form.progress),
        completion: Number(form.progress),
        head:       existing.head,  // preserve original
        team:       existing.team,  // preserve original
      }
      let norm
      try {
        const updated = await projectAPI.update(editing.id, payload)
        norm = normalizeProj(updated)
      } catch {
        norm = normalizeProj(payload)
      }
      setProjects(ps=>ps.map(p=>p.id===editing.id?norm:p))
      if(selected?.id===editing.id) setSelected(norm)
      setEditing(null)
      showToast('✅ Project updated successfully!')
    } catch(err) {
      showToast('Failed to update: '+err.message, 'error')
    }
  }

  const handleNewProject = async (form) => {
    try {
      let created
      try { created = await projectAPI.create(form) }
      catch { created = { ...form, id: Date.now() } }
      setProjects(ps=>[...ps, normalizeProj(created)])
      setShowNew(false)
      showToast('✅ Project created!')
    } catch(err) {
      showToast('Failed to create: '+err.message, 'error')
    }
  }

  const handleDelete = async (project) => {
    try {
      try { await projectAPI.remove(project.id) } catch {}
      setProjects(ps=>ps.filter(p=>p.id!==project.id))
      setDeleting(null)
      setSelected(null)
      showToast(`🗑️ "${project.name}" deleted.`)
    } catch(err) {
      showToast('Failed to delete: '+err.message, 'error')
    }
  }

  const statuses = ['All',...Object.keys(STATUS_CONFIG)]

  return (
    <div>
      {toast && (
        <div style={{ position:'fixed',top:24,right:24,zIndex:9999,padding:'13px 20px',borderRadius:13,fontWeight:600,fontSize:14,
          background:toast.type==='error'?'#e63946':'#06d6a0',color:'#fff',boxShadow:'0 8px 32px rgba(0,0,0,0.35)',animation:'_toastIn 0.3s ease' }}>
          {toast.type==='error'?'⚠️':'✅'} {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Project Status 📊</h1>
            <p>{projects.length} total projects · Click any project to view full details</p>
          </div>
          <button className="btn btn-primary" onClick={()=>setShowNew(true)}>➕ New Project</button>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom:24 }}>
        {Object.entries(STATUS_CONFIG).map(([status,sc])=>{
          const count = projects.filter(p=>p.status===status).length
          return (
            <div key={status} className="metric-card" style={{ '--accent-color':sc.color,cursor:'pointer' }} onClick={()=>setFilterStatus(status)}>
              <div className="metric-card-top">
                <div className="metric-card-label">{status}</div>
                <div className="metric-card-icon" style={{ background:sc.bg }}>{sc.icon}</div>
              </div>
              <div className="metric-card-value" style={{ color:sc.color }}>{count}</div>
              <div className="metric-card-change" style={{ color:'var(--text-muted)' }}>projects</div>
            </div>
          )
        })}
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:24,flexWrap:'wrap',alignItems:'center' }}>
        <input className="form-control" placeholder="🔍 Search projects..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:260 }}/>
        <div className="tabs">
          {statuses.map(s=>(
            <button key={s} className={`tab ${filterStatus===s?'active':''}`} onClick={()=>setFilterStatus(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:18 }}>
        {filtered.map(p=>{
          const sc = STATUS_CONFIG[p.status]||STATUS_CONFIG['Planning']
          const pc = PRIORITY_CONFIG[p.priority]||PRIORITY_CONFIG['Medium']
          const doneTasks = p.tasks.filter(t=>t.done).length
          return (
            <div key={p.id} className="project-card" onClick={()=>setSelected(p)}>
              <div className="project-card-header">
                <div style={{ display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0 }}>
                  <div className="project-card-icon" style={{ background:`${p.color}15` }}>{p.icon}</div>
                  <div style={{ minWidth:0 }}>
                    <div className="project-card-title">{p.name}</div>
                    <div style={{ display:'flex',gap:6,marginTop:4 }}>
                      <span className="badge" style={{ background:sc.bg,color:sc.color,fontSize:10 }}>{sc.icon} {p.status}</span>
                      <span className="badge" style={{ background:pc?.bg,color:pc?.color,fontSize:10 }}>🚦 {p.priority}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex',gap:4,flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={e=>{e.stopPropagation();setEditing(p)}} title="Edit">✏️</button>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{ color:'#e63946' }} onClick={e=>{e.stopPropagation();setDeleting(p)}} title="Delete">🗑️</button>
                </div>
              </div>

              <div className="project-card-desc" style={{ marginBottom:14 }}>{(p.description||'').slice(0,90)}{(p.description||'').length>90?'...':''}</div>

              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight:700,color:p.color }}>{p.progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width:`${p.progress}%`,background:p.color }}></div>
                </div>
              </div>

              <div className="project-card-footer">
                <div className="member-stack">
                  {[p.head,...p.team].slice(0,4).map((m,i)=>(
                    <div key={i} className="member-bubble" style={{ background:AVATAR_COLORS[m?.color??(i%8)] }} title={m?.name}>
                      {(m?.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                  ))}
                  {p.team.length>3 && <div className="member-bubble" style={{ background:'var(--bg3)' }}>+{p.team.length-3}</div>}
                </div>
                <div style={{ display:'flex',gap:8,fontSize:12,color:'var(--text-muted)' }}>
                  <span>✅ {doneTasks}/{p.tasks.length}</span>
                  <span>📅 {p.endDate}</span>
                </div>
              </div>

              <button className="btn btn-ghost btn-sm" style={{ width:'100%',marginTop:14 }}>View Full Details →</button>
            </div>
          )
        })}
      </div>

      {filtered.length===0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No Projects Found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}

      {selected && !editing && !deleting && (
        <ProjectDetailModal
          project={selected}
          onClose={()=>setSelected(null)}
          onEdit={()=>{setEditing(selected);setSelected(null)}}
          onDelete={()=>{setDeleting(selected);setSelected(null)}}
        />
      )}
      {editing && (
        <EditProjectModal project={editing} onClose={()=>setEditing(null)} onSave={handleEditSave}/>
      )}
      {deleting && (
        <DeleteModal project={deleting} onClose={()=>setDeleting(null)} onConfirm={()=>handleDelete(deleting)}/>
      )}
      {showNew && (
        <NewProjectModal onClose={()=>setShowNew(false)} onSave={handleNewProject}/>
      )}

      <style>{`
        @keyframes _toastIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
