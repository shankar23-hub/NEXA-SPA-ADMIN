import { useState, useEffect, useRef } from 'react'
import { employeeAPI } from '../utils/api'

const DEPARTMENTS = ['Engineering','Design','HR','Finance','Marketing','Operations','Sales','Support']
const ROLES = ['Software Engineer','Senior Developer','UI/UX Designer','HR Manager','Project Manager','Team Lead','Business Analyst','QA Engineer','DevOps Engineer','Data Scientist']
const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Singapore','Germany','UAE']
const INDIA_STATES = ['Tamil Nadu','Maharashtra','Karnataka','Delhi','Gujarat','Rajasthan','Kerala','Andhra Pradesh','Telangana','West Bengal']
const CITIES = { 'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem'], 'Karnataka': ['Bengaluru','Mysore','Hubli','Mangalore'], 'Maharashtra': ['Mumbai','Pune','Nagpur','Nashik'], 'Delhi': ['New Delhi','Noida','Gurgaon','Faridabad'] }

const EMPTY_FORM = { name:'', role:'', email:'', mobile:'', dept:'', dob:'', doj:'', father:'', mother:'', address:'', country:'India', state:'', city:'', skills: [], skillsInput: '', experience: '', certifications: [], availability: 'Available', pastPerformance: 75, currentProjects: 0, score: 75, image: null, imagePreview: null }

function StaffModal({ staff, onClose, onSave }) {
  const [form, setForm] = useState(staff ? { ...staff } : EMPTY_FORM)
  const fileRef = useRef()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('imagePreview', ev.target.result)
    reader.readAsDataURL(file)
  }


  const addSkill = () => {
    const value = (form.skillsInput || '').trim()
    if (!value) return
    if ((form.skills || []).some(skill => skill.toLowerCase() === value.toLowerCase())) return
    setForm(f => ({ ...f, skills: [...(f.skills || []), value], skillsInput: '' }))
  }

  const removeSkill = (skill) => {
    setForm(f => ({ ...f, skills: (f.skills || []).filter(s => s !== skill) }))
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{staff ? '✏️ Edit Staff Profile' : '➕ Add New Staff'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Photo upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--panel2)', border: '2px dashed var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, cursor: 'pointer', overflow: 'hidden', flexShrink: 0, position: 'relative' }}
          >
            {form.imagePreview ? (
              <img src={form.imagePreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28 }}>📷</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{form.name || 'Staff Member'}</div>
            <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>📁 Upload Photo</button>
            {form.imagePreview && (
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => set('imagePreview', null)}>✕ Remove</button>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG — Max 5MB</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12 }}>Personal Information</div>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name *</label>
              <input className="form-control" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role / Designation *</label>
              <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="">Select Role</option>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email ID *</label>
              <input className="form-control" type="email" placeholder="john@nexa.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Mobile Number *</label>
              <input className="form-control" placeholder="+91 98765 43210" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Department *</label>
              <select className="form-control" value={form.dept} onChange={e => set('dept', e.target.value)}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div></div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date of Birth</label>
              <input className="form-control" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date of Joining</label>
              <input className="form-control" type="date" value={form.doj} onChange={e => set('doj', e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12, marginTop: 8 }}>Professional Details</div>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Experience (Years)</label>
              <input className="form-control" type="number" min="0" placeholder="2" value={form.experience} onChange={e => set('experience', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Skills</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-control"
                  placeholder="Add a skill and press Add"
                  value={form.skillsInput || ''}
                  onChange={e => set('skillsInput', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={addSkill}>Add</button>
              </div>
              {!!form.skills?.length && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {form.skills.map(skill => (
                    <span key={skill} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12 }}
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12, marginTop: 8 }}>Family Information</div>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Father's Name</label>
              <input className="form-control" placeholder="Father's full name" value={form.father} onChange={e => set('father', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Mother's Name</label>
              <input className="form-control" placeholder="Mother's full name" value={form.mother} onChange={e => set('mother', e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12, marginTop: 8 }}>Address Details</div>
          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input className="form-control" placeholder="House No., Street, Area" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="form-grid-3">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select Country</label>
              <select className="form-control" value={form.country} onChange={e => set('country', e.target.value)}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select State</label>
              <select className="form-control" value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select State</option>
                {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Select City</label>
              <select className="form-control" value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Select City</option>
                {(CITIES[form.state] || []).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} style={{ flex: 2 }}>
            {staff ? '💾 Update Profile' : '✅ Add Staff Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewModal({ staff, onClose, onEdit }) {
  const [photoFull, setPhotoFull] = useState(false)
  const fields = [
    { label: 'Email ID', value: staff.email, icon: '📧' },
    { label: 'Mobile No', value: staff.mobile, icon: '📱' },
    { label: 'Department', value: staff.dept, icon: '🏢' },
    { label: 'Skills', value: (staff.skills || []).length ? staff.skills.join(', ') : 'N/A', icon: '🧠' },
    { label: 'Experience', value: staff.experience !== '' && staff.experience != null ? `${staff.experience} Years` : 'N/A', icon: '⏳' },
    { label: 'Date of Birth', value: staff.dob || 'N/A', icon: '🎂' },
    { label: 'Date of Joining', value: staff.doj || 'N/A', icon: '📅' },
    { label: 'Father Name', value: staff.father || 'N/A', icon: '👨' },
    { label: 'Mother Name', value: staff.mother || 'N/A', icon: '👩' },
    { label: 'Address', value: staff.address || 'N/A', icon: '📍' },
    { label: 'Country', value: staff.country || 'N/A', icon: '🌍' },
    { label: 'State', value: staff.state || 'N/A', icon: '🗺️' },
    { label: 'City', value: staff.city || 'N/A', icon: '🏙️' },
  ]

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <div className="modal-title">Staff Profile</div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div style={{ background: 'linear-gradient(135deg, var(--bg3), var(--panel2))', borderRadius: 'var(--radius)', padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{ width: 80, height: 80, borderRadius: 18, background: 'var(--bg3)', border: '2px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', flexShrink: 0, overflow: 'hidden', cursor: staff.imagePreview ? 'zoom-in' : 'default' }}
              onClick={() => staff.imagePreview && setPhotoFull(true)}
            >
              {staff.imagePreview ? (
                <img src={staff.imagePreview} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 28 }}>👤</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{staff.name}</div>
              <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 8 }}>{staff.role}</div>
              <span className="badge badge-info">🏢 {staff.dept}</span>
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={onEdit}>✏️ Edit</button>
          </div>
          <div className="profile-detail-grid">
            {fields.map(f => (
              <div key={f.label} className="profile-detail-item">
                <div className="profile-detail-label">{f.icon} {f.label}</div>
                <div className="profile-detail-value">{f.value}</div>
              </div>
            ))}
          </div>
          {/* Approved Certifications Section */}
          {(staff.certifications?.length > 0 || staff.approvedCertDocs?.length > 0) && (
            <div style={{ marginTop: 20, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--panel-border)' }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12, color: 'var(--primary)' }}>🎓 Certifications</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: staff.approvedCertDocs?.length > 0 ? 12 : 0 }}>
                {(staff.certifications || []).map(c => (
                  <span key={c} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: 'rgba(0,200,150,0.15)', color: '#00c896', border: '1px solid rgba(0,200,150,0.3)' }}>{c}</span>
                ))}
              </div>
              {staff.approvedCertDocs?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>APPROVED DOCUMENTS</div>
                  {staff.approvedCertDocs.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      background: 'var(--panel)', borderRadius: 8, marginBottom: 6,
                      border: '1px solid var(--panel-border)' }}>
                      <span>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.name}</div>
                        {doc.approvedAt && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Approved: {new Date(doc.approvedAt).toLocaleDateString('en-IN')}</div>}
                      </div>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(0,200,150,0.15)', color: '#00c896' }}>✅ Verified</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Close</button>
            <button className="btn btn-primary" onClick={onEdit} style={{ flex: 1 }}>✏️ Edit Profile</button>
          </div>
        </div>
      </div>
      {/* Full resolution photo overlay */}
      {photoFull && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPhotoFull(false)}>
          <img src={staff.imagePreview} alt={staff.name} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }} />
          <button style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 24, borderRadius: '50%', width: 44, height: 44, cursor: 'pointer' }} onClick={() => setPhotoFull(false)}>✕</button>
        </div>
      )}
    </>
  )
}

function normalizeEmp(e) {
  return {
    ...e,
    dept:    e.department || e.dept || '',
    mobile:  e.phone      || e.mobile || '',
    dob:     e.dob        || '',
    doj:     e.joinDate   || e.join_date || e.doj || '',
    father:  e.father     || '',
    mother:  e.mother     || '',
    address: e.address    || '',
    country: e.country    || 'India',
    state:   e.state      || '',
    city:    e.city       || '',
    imagePreview: e.imagePreview || null,
    skills: Array.isArray(e.skills) ? e.skills : [],
    skillsInput: '',
    experience: e.experience ?? '',
    certifications: Array.isArray(e.certifications) ? e.certifications : [],
    availability: e.availability || 'Available',
    pastPerformance: e.pastPerformance ?? 75,
    currentProjects: e.currentProjects ?? 0,
    score: e.score ?? 75,
  }
}

export default function StaffProfiles() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('All')

  useEffect(() => {
    employeeAPI.getAll()
      .then(data => { setStaff(data.map(normalizeEmp)); setLoading(false) })
      .catch(() => { setStaff([]); setLoading(false) })
  }, [])

  const filtered = staff.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || (s.skills || []).some(skill => skill.toLowerCase().includes(q))
    const matchD = filterDept === 'All' || s.dept === filterDept
    return matchQ && matchD
  })

  const handleSave = async (form) => {
    const payload = {
      name: form.name,
      role: form.role,
      email: form.email,
      phone: form.mobile,
      department: form.dept,
      dob: form.dob || '',
      father: form.father || '',
      mother: form.mother || '',
      address: form.address || '',
      country: form.country || 'India',
      state: form.state || '',
      city: form.city || '',
      imagePreview: form.imagePreview || '',
      skills: form.skills || [],
      certifications: form.certifications || [],
      experience: Number(form.experience || 0),
      availability: form.availability || 'Available',
      pastPerformance: Number(form.pastPerformance || 75),
      currentProjects: Number(form.currentProjects || 0),
      score: Number(form.score || 75),
      avatar: form.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2),
      joinDate: form.doj || '',
    }
    try {
      if (editing) {
        const updated = await employeeAPI.update(editing.id, payload)
        setStaff(s => s.map(x => x.id === editing.id ? normalizeEmp(updated) : x))
        setEditing(null)
      } else {
        const created = await employeeAPI.create(payload)
        setStaff(s => [...s, normalizeEmp(created)])
        setShowAdd(false)
      }
    } catch (err) {
      alert('Failed to save employee to MongoDB: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    setStaff(st => st.filter(x => x.id !== id))
    try { await employeeAPI.remove(id) } catch { /**/ }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Staff Profiles 👥</h1>
            <p>{staff.length} employees across {[...new Set(staff.map(s=>s.dept))].length} departments</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>➕ Add Staff</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input className="form-control" placeholder="🔍 Search staff..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <div className="tabs">
          {['All', ...DEPARTMENTS.slice(0,5)].map(d => (
            <button key={d} className={`tab ${filterDept === d ? 'active' : ''}`} onClick={() => setFilterDept(d)}>{d}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><h3>Loading Staff...</h3></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {filtered.map(s => (
            <div key={s.id} className="staff-card" onClick={() => setViewing(s)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg3)', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                  {s.imagePreview ? (
                    <img src={s.imagePreview} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 22 }}>👤</span>
                  )}
                </div>
                <div>
                  <div className="staff-card-name">{s.name}</div>
                  <div className="staff-card-role">{s.role}</div>
                  <span className="badge badge-info" style={{ fontSize: 10 }}>{s.dept}</span>
                </div>
              </div>
              <div className="staff-card-info">
                <span>📧 {s.email}</span>
                <span>📱 {s.mobile}</span>
                {!!s.skills?.length && <span>🧠 {s.skills.slice(0, 3).join(', ')}{s.skills.length > 3 ? '…' : ''}</span>}
                {s.experience !== '' && s.experience != null && <span>⏳ {s.experience} yrs experience</span>}
                {s.city && <span>📍 {s.city}, {s.state}</span>}
                {s.doj && <span>📅 Joined {s.doj}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setViewing(s) }}>👁 View</button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setEditing(s) }}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={e => { e.stopPropagation(); handleDelete(s.id) }}>🗑</button>
              </div>
            </div>
          ))}

          <div className="staff-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, border: '2px dashed var(--panel-border)', cursor: 'pointer', background: 'transparent' }} onClick={() => setShowAdd(true)}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>➕</div>
            <div style={{ fontWeight: 600, color: 'var(--text-soft)' }}>Add New Staff</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Click to create profile</div>
          </div>
        </div>
      )}

      {filtered.length === 0 && !loading && <div className="empty-state"><div className="empty-state-icon">🔍</div><h3>No Staff Found</h3><p>Try adjusting your search or click Add Staff to create the first profile</p></div>}

      {(showAdd || editing) && (
        <StaffModal staff={editing} onClose={() => { setShowAdd(false); setEditing(null) }} onSave={handleSave} />
      )}
      {viewing && !editing && (
        <ViewModal staff={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null) }} />
      )}
    </div>
  )
}
