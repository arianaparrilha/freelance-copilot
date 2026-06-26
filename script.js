// Apply saved theme before first paint to avoid flash
;(()=>{
  if(localStorage.getItem('theme')==='dark') document.documentElement.classList.add('dark')
})()

function toggleTheme(){
  const isDark=document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
  updateThemeBtn()
}
function updateThemeBtn(){
  const isDark=document.documentElement.classList.contains('dark')
  const label=document.getElementById('themeLabel')
  const icon=document.getElementById('themeIcon')
  if(label) label.textContent=isDark ? 'Modo escuro' : 'Modo claro'
  if(icon){
    icon.innerHTML=isDark
      ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
      : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
  }
}

// Switch to the correct page immediately (before async auth) to avoid flash on refresh
;(()=>{
  const p=location.hash.slice(1)
  const valid=['dashboard','clientes','estimador','plano','perfil']
  if(!valid.includes(p)) return
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'))
  const el=document.getElementById('page-'+p)
  if(el) el.classList.add('active')
  document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.classList.remove('active'))
  const b=document.querySelector(`.nav-item[data-page="${p}"]`)
  if(b) b.classList.add('active')
})()

// Auth check — redirect to /login if not logged in
;(async () => {
  const user = await requireAuth()
  if (!user) return
  currentUser = user

  const name = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const initial = name[0].toUpperCase()

  const greetingEl = document.getElementById('dashboard-greeting')
  if (greetingEl) greetingEl.textContent = `Olá, ${name.split(' ')[0]}!`

  const dropdownHTML = `
    <div class="user-menu">
      <button class="user-menu-trigger">
        <div class="user-av-sm">${initial}</div>
        <div class="user-menu-info">
          <span class="user-menu-name">${name}</span>
          <span class="user-menu-role">Freelancer</span>
        </div>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div class="user-menu-dropdown">
        <a href="#" class="umd-item" onclick="navegarPara('perfil');document.querySelectorAll('.user-menu-dropdown').forEach(d=>d.classList.remove('open'));return false"><i class="fa-solid fa-user" aria-hidden="true"></i>O meu perfil</a>
        <!-- HIDDEN: Definições — feature not ready -->
        <a href="#" class="umd-item" onclick="navegarPara('plano');document.querySelectorAll('.user-menu-dropdown').forEach(d=>d.classList.remove('open'));return false"><i class="fa-solid fa-credit-card" aria-hidden="true"></i>Plano e faturação</a>
        <div class="umd-sep"></div>
        <button class="umd-item umd-signout" onclick="signOut()"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>Terminar sessão</button>
      </div>
    </div>`

  document.querySelectorAll('.tb-right').forEach(el => {
    el.insertAdjacentHTML('beforeend', dropdownHTML)
  })

  document.addEventListener('click', e => {
    const trigger = e.target.closest('.user-menu-trigger')
    if (trigger) {
      const dropdown = trigger.closest('.user-menu').querySelector('.user-menu-dropdown')
      document.querySelectorAll('.user-menu-dropdown').forEach(d => { if (d !== dropdown) d.classList.remove('open') })
      dropdown.classList.toggle('open')
    } else if (!e.target.closest('.user-menu-dropdown')) {
      document.querySelectorAll('.user-menu-dropdown').forEach(d => d.classList.remove('open'))
    }
  })

  // Boot app only after auth is confirmed
  await init()
})()

/* ── Validation helpers ── */
function validarNIF(nif){const n=nif.replace(/[\s.]/g,'');return n===''||/^\d{9}$/.test(n)}
function validarEmail(email){return email===''||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
function erroCampo(id,msg){
  const el=document.getElementById(id); if(!el) return
  el.classList.add('invalid')
  el.setAttribute('aria-invalid','true')
  const hint=el.parentElement.querySelector('.field-hint')
  if(hint) hint.style.display='none'
  let err=document.getElementById(id+'-err')
  if(!err){
    err=document.createElement('span')
    err.id=id+'-err'; err.className='field-err'
    err.setAttribute('role','alert')
    el.parentElement.appendChild(err)
    el.setAttribute('aria-describedby',id+'-err')
  }
  err.textContent=msg; err.style.display='block'
  const clear=()=>{
    el.classList.remove('invalid'); el.removeAttribute('aria-invalid')
    err.style.display='none'
    if(hint) hint.style.display=''
    el.removeEventListener('input',clear); el.removeEventListener('change',clear)
  }
  el.addEventListener('input',clear); el.addEventListener('change',clear)
}
function limparErros(modalId){
  const ov=document.getElementById(modalId); if(!ov) return
  ov.querySelectorAll('.invalid').forEach(el=>{el.classList.remove('invalid');el.removeAttribute('aria-invalid')})
  ov.querySelectorAll('.field-err').forEach(el=>el.style.display='none')
  ov.querySelectorAll('.field-hint').forEach(el=>el.style.display='')
  const ge=document.getElementById(modalId+'-geral-err'); if(ge) ge.style.display='none'
}
function erroGeral(modalId,msg){
  let err=document.getElementById(modalId+'-geral-err')
  if(!err){
    const ft=document.querySelector('#'+modalId+' .modal-ft'); if(!ft) return
    err=document.createElement('div')
    err.id=modalId+'-geral-err'; err.className='modal-geral-err'
    err.setAttribute('role','alert')
    ft.insertBefore(err,ft.firstChild)
  }
  err.textContent=msg; err.style.display='block'
}

// IAS 2025
const IAS = 522.50
const LIMIAR_SS = 4 * IAS           // €2.090 rendimento relevante mensal médio
const LIMITE_IVA = 14500
const LIMITE_RS  = 200000

let currentUser = null

// Data stores — populated from Supabase on load
let clientes = []
let faturas = {}
let documentos = {}
let recibosEst = []
let editMode = true
let ativo = null
let ativoRecibo = null
let ativoDoc = null

/* ── DB helpers ── */
function colorFromName(name) {
  const colors = CORES_CL || ['#1d6cf0','#059669','#7c3aed','#d97706','#dc2626','#0284c7','#db2777']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatSince(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })
}

function mapClientFromDB(row) {
  const nome = row.name || ''
  return {
    id: row.id,
    in: nome.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    cor: colorFromName(nome),
    nome,
    nif: row.nif || '—',
    email: row.email || '',
    tel: row.phone || '',
    morada: row.address || '',
    notas: row.notes || '',
    client_since: row.client_since || null,
    since: formatSince(row.client_since || row.created_at),
    projetos: 0,
  }
}

function mapInvoiceFromDB(row) {
  return {
    id: row.id,
    num: row.invoice_number || '—',
    data: row.date ? new Date(row.date+'T00:00:00').toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'}) : '—',
    desc: row.description || '',
    valor: parseFloat(row.amount) || 0,
    estado: row.status || 'pendente',
    document_id: row.document_id || null,
  }
}

async function loadFaturas(clientId) {
  const { data, error } = await db.from('invoices').select('*').eq('client_id', clientId).order('date', { ascending: false })
  if (error) { console.error('Erro ao carregar faturas:', error); return [] }
  return (data || []).map(mapInvoiceFromDB)
}

function mapDocFromDB(row) {
  const ext = (row.name || '').split('.').pop().toLowerCase()
  const extMap = {pdf:'pdf',docx:'doc',doc:'doc',xlsx:'xls',xls:'xls',png:'img',jpg:'img',jpeg:'img'}
  return {
    id: row.id,
    ext: extMap[ext] || 'doc',
    nome: row.name || '—',
    tipo: row.type || 'Outro',
    data: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'}) : '—',
    tam: '—',
    url: row.url || null,
  }
}

async function loadAllFaturas(){
  const { data } = await db.from('invoices').select('*').order('date',{ascending:false})
  const grouped={}
  ;(data||[]).forEach(row=>{
    if(!grouped[row.client_id]) grouped[row.client_id]=[]
    grouped[row.client_id].push(mapInvoiceFromDB(row))
  })
  clientes.forEach(c=>{ faturas[c.id]=grouped[c.id]||[] })
}

async function loadDocumentos(clientId) {
  const { data, error } = await db.from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
  if (error) { console.error('Erro ao carregar documentos:', error); return [] }
  return (data || []).map(mapDocFromDB)
}

async function loadClientes() {
  const { data, error } = await db.from('clients').select('*').order('created_at', { ascending: false })
  if (error) { console.error('Erro ao carregar clientes:', error); return }
  clientes = (data || []).map(mapClientFromDB)
  data.forEach(row => { if (!faturas[row.id]) faturas[row.id] = []; if (!documentos[row.id]) documentos[row.id] = [] })
}

/* ───────────────────────────────────────
   UTILS
─────────────────────────────────────── */
function f0(n){return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:0}).format(n||0)}
function f2(n){return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(n||0)}
function fp(n){return (n||0).toFixed(1)+'%'}
function set(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
function setW(id,w){const e=document.getElementById(id);if(e)e.style.width=w+'%'}
function escH(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function renderSummary(){
  const allFats=Object.values(faturas).flat()
  const totalPago=allFats.filter(f=>f.estado==='pago').reduce((s,f)=>s+f.valor,0)
  const totalEmitido=allFats.filter(f=>f.estado!=='cancelada').reduce((s,f)=>s+f.valor,0)
  const totalPend=allFats.filter(f=>f.estado==='pendente').reduce((s,f)=>s+f.valor,0)
  const pendCount=allFats.filter(f=>f.estado==='pendente').length
  // IVA uses total emitido (all issued invoices) per art. 53 CIVA
  const pIVA=Math.min(100,(totalEmitido/LIMITE_IVA)*100)
  const ivaCls='pg-fill '+(pIVA>=90?'r':pIVA>=70?'a':'g')
  const ivaColor=pIVA>=90?'var(--accent-error)':pIVA>=70?'var(--accent-caution)':'var(--accent-success)'
  // clients page
  set('sumTotal',f2(totalPago))
  set('sumPendente',f2(totalPend))
  set('sumPendenteN',`${pendCount} fatura${pendCount!==1?'s':''} em aberto`)
  set('sumClSec',clientes.length)
  set('sumRec',allFats.length)
  set('sumCl',clientes.length)
  const cIVApctEl=document.getElementById('clIVApct')
  if(cIVApctEl){cIVApctEl.textContent=fp(pIVA);cIVApctEl.style.color=ivaColor}
  const cIVAbarEl=document.getElementById('clIVAbar')
  if(cIVAbarEl){cIVAbarEl.style.width=pIVA+'%';cIVAbarEl.className=ivaCls}
  set('clIVAsub',`${f0(totalEmitido)} de ${f0(LIMITE_IVA)}`)
  // dashboard
  set('dashTotalV',f2(totalPago))
  const dIVApctEl=document.getElementById('dashIVApct')
  if(dIVApctEl){dIVApctEl.textContent=fp(pIVA);dIVApctEl.style.color=ivaColor}
  const dIVAbarEl=document.getElementById('dashIVAbar')
  if(dIVAbarEl){dIVAbarEl.style.width=pIVA+'%';dIVAbarEl.className=ivaCls}
  set('dashIVAsub',`${f0(totalEmitido)} / ${f0(LIMITE_IVA)}`)
  // estimador
  set('totalFaturadoDisplay',f2(totalEmitido))
}

/* ───────────────────────────────────────
   NAVIGATION
─────────────────────────────────────── */
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open')
  document.getElementById('sbOverlay').classList.toggle('open')
}
function closeMobileDetail(){
  document.querySelector('.cd-panel').classList.remove('visible-mobile')
  const ov=document.getElementById('cdDrawerOverlay')
  if(ov){ov.classList.remove('visible');ov.style.pointerEvents='none'}
}
function nav(p){navegarPara(p)}
function navegarPara(p, addToHistory=true){
  const valid=['dashboard','clientes','estimador','plano','perfil']
  if(!valid.includes(p)) p='dashboard'
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'))
  document.getElementById('page-'+p).classList.add('active')
  document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.classList.remove('active'))
  const b=document.querySelector(`.nav-item[data-page="${p}"]`)
  if(b) b.classList.add('active')
  if(p==='clientes') renderCl()
  if(p==='dashboard') renderActivity()
  if(p==='perfil') renderPerfil()
  if(p==='estimador'){renderEstStrip();calcEst()}
  document.getElementById('sidebar').classList.remove('open')
  const ovEl=document.getElementById('sbOverlay')
  if(ovEl) ovEl.classList.remove('open')
  if(addToHistory) history.pushState({page:p},'','#'+p)
  else history.replaceState({page:p},'','#'+p)
}
window.addEventListener('popstate', e=>{
  const p=(e.state&&e.state.page)||location.hash.slice(1)||'dashboard'
  navegarPara(p, false)
})
document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.addEventListener('click',()=>navegarPara(b.dataset.page)))

/* ───────────────────────────────────────
   CLIENTS LIST RENDER
─────────────────────────────────────── */
function totalCl(id){
  return (faturas[id]||[]).filter(f=>f.estado==='pago').reduce((s,f)=>s+f.valor,0)
}
function renderCl(){
  const q=(document.getElementById('srchCl').value||'').toLowerCase()
  const el=document.getElementById('clListEl')
  const lista=clientes.filter(c=>c.nome.toLowerCase().includes(q)||c.nif.includes(q))
  el.innerHTML=lista.map(c=>`
    <div class="cl-item${c.id===ativo?' active':''}" onclick="selCl('${c.id}')">
      <div class="cl-av" style="background:${c.cor}">${c.in}</div>
      <div style="flex:1;min-width:0">
        <div class="cl-nm">${escH(c.nome)}</div>
        <div class="cl-mt">NIF ${c.nif} · ${(faturas[c.id]||[]).length} faturas</div>
      </div>
      <div class="cl-am">${f0(totalCl(c.id))}</div>
    </div>`).join('')
}

/* ───────────────────────────────────────
   CLIENT DETAIL — loads all tabs for selected client
─────────────────────────────────────── */
async function selCl(id){
  ativo=id
  renderCl()
  const c=clientes.find(x=>x.id===id)
  if(!c) return
  // On tablet/phone: slide in right drawer (idempotent — safe to call while already open)
  if(window.innerWidth<=880){
    const panel=document.querySelector('.cd-panel')
    const ov=document.getElementById('cdDrawerOverlay')
    if(!panel.classList.contains('visible-mobile')){
      panel.classList.add('visible-mobile')
      if(ov){ov.classList.add('visible');ov.style.pointerEvents='auto'}
    }
  }
  faturas[id] = await loadFaturas(id)
  documentos[id] = await loadDocumentos(id)

  // Header
  document.getElementById('cdAv').textContent=c.in
  document.getElementById('cdAv').style.background=c.cor
  document.getElementById('cdNm').innerHTML=`${escH(c.nome)} <span class="badge bg-g">Cliente ativo</span>`
  document.getElementById('cdNf').textContent='NIF '+c.nif
  document.getElementById('cdSince').textContent=`Cliente desde ${c.since} · ${c.projetos} projeto${c.projetos!==1?'s':''} ativo${c.projetos!==1?'s':''}`

  // Stats
  const fats=faturas[id]||[]
  const total=fats.filter(f=>f.estado==='pago').reduce((s,f)=>s+f.valor,0)
  const medio=fats.length>0?(total/fats.length):0
  const ultimo=fats.length>0?fats[0].data:'—'
  const pendente=fats.filter(f=>f.estado==='pendente').reduce((s,f)=>s+f.valor,0)
  document.getElementById('cdTot').textContent=f2(total)
  document.getElementById('cdTotSub').textContent=`${fats.length} fatura${fats.length!==1?'s':''}`
  document.getElementById('cdAvg').textContent=f2(medio)
  document.getElementById('cdLast').textContent=ultimo

  // Estado badge
  const statusEl=document.getElementById('cdStatus')
  if(pendente>0){
    statusEl.textContent=`${f2(pendente)} pendente`
    statusEl.className='badge bg-a'
  } else {
    statusEl.textContent='Em dia'
    statusEl.className='badge bg-g'
  }

  // TAB: Recibos
  const rbody=document.getElementById('recibosTableWrap')
  if(fats.length===0){
    rbody.innerHTML='<p style="color:var(--text-tertiary);font-size:.82rem;padding:18px 0">Sem faturas registadas.</p>'
  } else {
    rbody.innerHTML=`<table class="inv-tbl" style="table-layout:fixed;width:100%">
      <thead><tr><th style="width:130px">Nº</th><th style="width:110px">Data</th><th>Descrição</th><th style="width:100px">Valor</th><th style="width:100px">Estado</th><th style="width:44px"></th></tr></thead>
      <tbody>${fats.map(f=>`
        <tr>
          <td class="mono" style="color:var(--text-tertiary)">${escH(f.num)}</td>
          <td>${escH(f.data)}</td>
          <td>${escH(f.desc)}</td>
          <td class="mono">${f2(f.valor)}</td>
          <td><span class="badge ${f.estado==='pago'?'bg-g':f.estado==='pendente'?'bg-a':'bg-n'}">${escH(f.estado)}</span></td>
          <td style="white-space:nowrap">${(()=>{const linkedDoc=f.document_id?(documentos[id]||[]).find(d=>d.id===f.document_id):null;return linkedDoc?`<button class="ico-btn" title="Pré-visualizar fatura" onclick="abrirPreview('${linkedDoc.url}','${escH(linkedDoc.nome).replace(/'/g,"\\'")}','${linkedDoc.ext}')"><i class="fa-solid fa-eye" aria-hidden="true"></i></button>`:'<button class="ico-btn" style="opacity:.25;cursor:default" disabled title="Sem ficheiro anexado"><i class="fa-solid fa-eye" aria-hidden="true"></i></button>'})()}<div class="user-menu" style="display:inline-block"><button class="ico-btn user-menu-trigger"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button><div class="user-menu-dropdown"><button class="umd-item" onclick="toggleEstadoRecibo('${f.id}')">${f.estado==='pago'?'<i class="fa-solid fa-clock" aria-hidden="true"></i>Marcar como pendente':'<i class="fa-solid fa-circle-check" style="color:var(--accent-success)" aria-hidden="true"></i>Marcar como pago'}</button><div class="umd-sep"></div><button class="umd-item umd-signout" onclick="confirmarApagarRecibo('${f.id}')"><i class="fa-solid fa-trash" aria-hidden="true"></i>Apagar fatura</button></div></div></td>
        </tr>`).join('')}
      </tbody></table>`
  }

  // TAB: Contactos
  const ci=document.getElementById('contactosInfo')
  ci.innerHTML=`
    ${c.email?`<span style="display:flex;align-items:center;gap:7px"><i class="fa-solid fa-envelope ni" style="color:var(--text-tertiary)" aria-hidden="true"></i>${escH(c.email)}</span>`:''}
    ${c.tel?`<span style="display:flex;align-items:center;gap:7px"><i class="fa-solid fa-phone ni" style="color:var(--text-tertiary)" aria-hidden="true"></i>${escH(c.tel)}</span>`:''}
    ${c.morada?`<span style="display:flex;align-items:center;gap:7px"><i class="fa-solid fa-location-dot ni" style="color:var(--text-tertiary)" aria-hidden="true"></i>${escH(c.morada)}</span>`:''}
  `

  // TAB: Documentos
  const docs=documentos[id]||[]
  document.getElementById('docCount').textContent=docs.length
  const dt=document.getElementById('docTableWrap')
  if(docs.length===0){
    dt.innerHTML='<p style="color:var(--text-tertiary);font-size:.82rem;padding:10px 0">Sem documentos carregados.</p>'
  } else {
    dt.innerHTML=`<table class="doc-tbl">
      <thead><tr><th>Nome do documento</th><th>Tipo</th><th>Data</th><th>Tamanho</th><th></th></tr></thead>
      <tbody>${docs.map(d=>`
        <tr>
          <td><div class="doc-nc"><span class="doc-ext de-${d.ext}">${d.ext.toUpperCase()}</span>${escH(d.nome)}</div></td>
          <td style="color:var(--text-tertiary)">${escH(d.tipo)}</td>
          <td>${escH(d.data)}</td>
          <td style="color:var(--text-tertiary)">${escH(d.tam)}</td>
          <td style="white-space:nowrap"><button class="ico-btn" title="Pré-visualizar" onclick="abrirPreview('${d.url}','${escH(d.nome).replace(/'/g,"\\'")}','${d.ext}')"><i class="fa-solid fa-eye" aria-hidden="true"></i></button><div class="user-menu" style="display:inline-block"><button class="ico-btn user-menu-trigger"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button><div class="user-menu-dropdown"><button class="umd-item umd-signout" onclick="confirmarApagarDoc('${d.id}')"><i class="fa-solid fa-trash" aria-hidden="true"></i>Apagar documento</button></div></div></td>
        </tr>`).join('')}
      </tbody></table>`
  }
}

function switchTab(btn,paneId){
  btn.parentElement.querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'))
  btn.classList.add('active')
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'))
  document.getElementById(paneId).classList.add('active')
}

/* ───────────────────────────────────────
   MODAL — NOVO CLIENTE
─────────────────────────────────────── */
const CORES_CL=['#1d6cf0','#059669','#7c3aed','#d97706','#dc2626','#0284c7','#db2777']
let extractedData={}

function abrirModalCl(){
  ;['cNome','cNIF','cEmail','cTel','cMorada'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''})
  const sinceEl=document.getElementById('cSince')
  if(sinceEl) sinceEl.value=new Date().toISOString().split('T')[0]
  document.getElementById('extractedPreview').style.display='none'
  document.getElementById('extractingIndicator').style.display='none'
  abrirModal('modalCl')
}
let _modalTrigger=null
function abrirModal(id){
  _modalTrigger=document.activeElement
  limparErros(id)
  const ov=document.getElementById(id)
  ov.classList.add('open')
  const first=ov.querySelector('input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])')
  if(first) requestAnimationFrame(()=>first.focus())
  ov.addEventListener('keydown',_modalKeyHandler)
}
function fecharModal(id){
  const ov=document.getElementById(id)
  ov.classList.remove('open')
  ov.removeEventListener('keydown',_modalKeyHandler)
  if(_modalTrigger && typeof _modalTrigger.focus==='function') _modalTrigger.focus()
  _modalTrigger=null
}
function _modalKeyHandler(e){
  if(e.key==='Escape'){const ov=e.currentTarget;fecharModal(ov.id);return}
  if(e.key!=='Tab') return
  const focusable=[...e.currentTarget.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
  if(!focusable.length) return
  const first=focusable[0],last=focusable[focusable.length-1]
  if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus()}}
  else{if(document.activeElement===last){e.preventDefault();first.focus()}}
}
;['modalCl','modalEditCl','modalRecibo','modalDoc','modalApagarCl','modalApagarRecibo','modalApagarDoc'].forEach(id=>{
  document.getElementById(id).addEventListener('click',e=>{if(e.target===e.currentTarget)fecharModal(id)})
})

function triggerDocUpload(){document.getElementById('docUploadInput').click()}

/* ── Extracção real via FileReader (txt/csv/vcf legíveis; xlsx/docx/pdf: heurística por nome) ── */
function processDocUpload(e){
  const file=e.target.files[0]; if(!file) return
  document.getElementById('modalUploadZone').style.display='none'
  document.getElementById('extractingIndicator').style.display='block'

  const ext=file.name.split('.').pop().toLowerCase()
  const readableAsText=['txt','csv','vcf']

  if(readableAsText.includes(ext)){
    // Real text extraction
    const reader=new FileReader()
    reader.onload=ev=>{
      const text=ev.target.result
      extractedData=extractFromText(text, file.name)
      showExtractedAndApply()
    }
    reader.readAsText(file)
  } else {
    // Heuristic extraction from filename for binary formats (xlsx, docx, pdf)
    setTimeout(()=>{
      extractedData=extractFromFilename(file.name)
      showExtractedAndApply()
    }, 900)
  }
  e.target.value=''
}

function extractFromText(text, filename){
  const d={}
  // NIF: 9 digits possibly spaced
  const mNIF=text.match(/\b(\d{3}\s?\d{3}\s?\d{3})\b/)
  if(mNIF) d.nif=mNIF[1].replace(/\s/g,'')

  // Email
  const mEmail=text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i)
  if(mEmail) d.email=mEmail[0]

  // Company / name — look for "Empresa:", "Nome:", "Razão Social:", "Cliente:" patterns
  const mNome=text.match(/(?:empresa|nome|razão social|cliente|company|name)[:\s]+([^\n,;]{3,60})/i)
  if(mNome) d.nome=mNome[1].trim()

  // Morada / address
  const mMorada=text.match(/(?:morada|endereço|address|rua|av\.|avenida)[:\s]+([^\n]{5,80})/i)
  if(mMorada) d.morada=mMorada[1].trim()

  // Fallbacks from filename
  if(!d.nome){const fn=extractFromFilename(filename); if(fn.nome) d.nome=fn.nome}

  return d
}

function extractFromFilename(filename){
  const d={}
  // Pattern: Contrato_NomeEmpresa_NIF.ext or NomeEmpresa_123456789.pdf
  const mNome=filename.replace(/\.[^.]+$/,'').match(/(?:^|[_\-])([A-ZÁÉÍÓÚ][a-zA-ZÀ-ÿ\s]{2,30})(?:[_\-]|$)/i)
  if(mNome) d.nome=mNome[1].replace(/[_]/g,' ').trim()
  const mNIF=filename.match(/\b(\d{9})\b/)
  if(mNIF) d.nif=mNIF[1]
  // Demo data if nothing found
  if(!d.nome) d.nome='Empresa do Documento'
  if(!d.nif)  d.nif='519 234 567'
  if(!d.email)d.email='contacto@empresa.pt'
  if(!d.morada)d.morada='Rua do Documento 10, Lisboa'
  return d
}

function showExtractedAndApply(){
  document.getElementById('extractingIndicator').style.display='none'
  document.getElementById('modalUploadZone').style.display='block'

  // Show preview
  const labelMap={nome:'Nome',nif:'NIF',email:'Email',morada:'Morada'}
  const flds=document.getElementById('extractedFields')
  const entries=Object.entries(extractedData).filter(([k])=>labelMap[k])
  if(!entries.length){
    flds.innerHTML='<p style="font-size:.78rem;color:var(--text-secondary)">Não foi possível extrair campos. Preenche manualmente.</p>'
    document.getElementById('extractedPreview').style.display='block'
    return
  }
  flds.innerHTML=entries.map(([k,v])=>`
    <div class="ep-row">
      <span class="ep-key">${labelMap[k]||k}</span>
      <span class="ep-val">${escH(v)}</span>
    </div>`).join('')
  document.getElementById('extractedPreview').style.display='block'

  // Auto-apply immediately — fields pre-filled, user just reviews
  aplicarCamposExtraidos()
}

/* ── Import contacts (Excel/CSV/Word) → opens modal pre-filled ── */
function triggerImportContacts(){document.getElementById('importContactsInput').click()}

function processImportContacts(e){
  const file=e.target.files[0]; if(!file) return
  e.target.value=''
  const ext=file.name.split('.').pop().toLowerCase()

  // For CSV/txt: parse first data row
  if(['csv','txt'].includes(ext)){
    const reader=new FileReader()
    reader.onload=ev=>{
      const lines=ev.target.result.split('\n').map(l=>l.trim()).filter(Boolean)
      // Try to detect header row; take first data row
      const dataLine=lines.length>1?lines[1]:lines[0]
      const cols=dataLine.split(/[,;\t]/).map(c=>c.replace(/^["']|["']$/g,'').trim())
      // Heuristic: cols[0]=nome, cols[1]=nif, cols[2]=email, cols[3]=morada
      extractedData={}
      if(cols[0]) extractedData.nome=cols[0]
      if(cols[1]&&/\d{9}/.test(cols[1].replace(/\s/g,''))) extractedData.nif=cols[1]
      if(cols[2]&&cols[2].includes('@')) extractedData.email=cols[2]
      if(cols[3]) extractedData.morada=cols[3]
      abrirModalClComDados()
    }
    reader.readAsText(file)
  } else {
    // xlsx/docx: heuristic from filename + demo
    extractedData=extractFromFilename(file.name)
    abrirModalClComDados()
  }
}

function abrirModalClComDados(){
  abrirModalCl()
  // Small delay so modal is visible before filling
  setTimeout(()=>{
    aplicarCamposExtraidos()
    // Show extraction preview
    const labelMap={nome:'Nome',nif:'NIF',email:'Email',morada:'Morada'}
    const entries=Object.entries(extractedData).filter(([k])=>labelMap[k]&&extractedData[k])
    if(entries.length){
      document.getElementById('extractedFields').innerHTML=entries.map(([k,v])=>`
        <div class="ep-row"><span class="ep-key">${labelMap[k]}</span><span class="ep-val">${escH(v)}</span></div>`).join('')
      document.getElementById('extractedPreview').style.display='block'
    }
  }, 80)
}

function aplicarCamposExtraidos(){
  if(extractedData.nome)   document.getElementById('cNome').value=extractedData.nome
  if(extractedData.nif)    document.getElementById('cNIF').value=extractedData.nif
  if(extractedData.email)  document.getElementById('cEmail').value=extractedData.email
  if(extractedData.morada) document.getElementById('cMorada').value=extractedData.morada
  // Keep preview visible so user sees what was extracted; it closes on save
}

function limparCamposExtraidos(){
  ;['cNome','cNIF','cEmail','cTel','cMorada'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''})
  extractedData={}
  document.getElementById('extractedPreview').style.display='none'
}

async function guardarCliente(){
  const nome=document.getElementById('cNome').value.trim()
  const nif=document.getElementById('cNIF').value.trim()
  const email=document.getElementById('cEmail').value.trim()
  let ok=true
  if(!nome){erroCampo('cNome','O nome é obrigatório.');ok=false}
  if(!validarNIF(nif)){erroCampo('cNIF','NIF inválido. Deve ter 9 dígitos, sem espaços. Ex: 123456789');ok=false}
  if(!validarEmail(email)){erroCampo('cEmail','Formato de email inválido. Ex: nome@empresa.pt');ok=false}
  if(!ok) return
  const { data, error } = await db.from('clients').insert({
    name: nome,
    nif: nif||null,
    email: email||null,
    phone: document.getElementById('cTel').value.trim()||null,
    address: document.getElementById('cMorada').value.trim()||null,
    client_since: document.getElementById('cSince').value||null,
  }).select().single()
  if(error){erroGeral('modalCl','Não foi possível guardar. Verifica a tua ligação e tenta novamente.');return}
  const c = mapClientFromDB(data)
  clientes.unshift(c)
  faturas[c.id]=[]
  documentos[c.id]=[]
  fecharModal('modalCl')
  renderCl()
  renderSummary()
  selCl(c.id)
}

/* ───────────────────────────────────────
   DOCUMENTOS — sub-painel toggle + drag/drop
─────────────────────────────────────── */
function toggleDocPanel(){} // kept for compat, now unused

function onDocFileSelected(e){
  const files=Array.from(e.target.files); if(!files.length) return
  addDocsToCurrent(files); e.target.value=''
}
function onDocDrop(e){
  e.preventDefault(); addDocsToCurrent(Array.from(e.dataTransfer.files))
}
async function addDocsToCurrent(files){
  if(!ativo||!currentUser) return
  let falhou=0
  for(const f of files){
    const path=`${currentUser.id}/${Date.now()}_${f.name}`
    const { error: upErr } = await db.storage.from('documents').upload(path, f)
    if(upErr){ console.error('Upload error:',upErr.message); falhou++; continue }
    const { data, error } = await db.from('documents').insert({
      client_id: ativo,
      name: f.name,
      type: 'Outro',
      url: path,
    }).select().single()
    if(error){ console.error('Doc save error:',error.message); falhou++; continue }
    if(!documentos[ativo]) documentos[ativo]=[]
    documentos[ativo].unshift(mapDocFromDB(data))
  }
  selCl(ativo)
  if(falhou){
    let el=document.getElementById('docUploadErr')
    if(!el){
      el=document.createElement('div')
      el.id='docUploadErr'
      el.style.cssText='font-size:.78rem;color:var(--accent-error);background:var(--accent-error-light);border-radius:var(--radius-sm);padding:6px 10px;margin-top:8px'
      el.setAttribute('role','alert')
      const dropArea=document.querySelector('.drop-area')
      if(dropArea) dropArea.insertAdjacentElement('afterend',el)
    }
    el.textContent=`${falhou} ficheiro(s) não foram guardados. Tenta novamente.`
    el.style.display='block'
    setTimeout(()=>el.style.display='none',5000)
  }
}

/* ───────────────────────────────────────
   MODAL NOVO RECIBO — extracção de ficheiro
─────────────────────────────────────── */
function onReciboFileDrop(e){
  e.preventDefault()
  document.getElementById('mrUploadZone').classList.remove('drag-over')
  const file=e.dataTransfer.files[0]; if(!file) return
  processReciboFile({target:{files:[file]}})
}

function processReciboFile(e){
  const file=e.target.files[0]; if(!file) return
  const uz=document.getElementById('mrUploadZone')
  const proc=document.getElementById('mrProcessing')
  uz.style.opacity='.5'
  uz.style.pointerEvents='none'
  proc.style.display='block'
  document.getElementById('mrExtractedBanner').style.display='none'

  const spinnerHTML=proc.innerHTML
  const controller=new AbortController()

  function mostrarTimeoutAviso(){
    proc.innerHTML=''
    const wrap=document.createElement('div')
    wrap.style.cssText='text-align:center;padding:4px 0'
    const msg=document.createElement('div')
    msg.style.cssText='font-size:.82rem;color:var(--text-secondary);margin-bottom:12px'
    msg.textContent='A extração está a demorar mais do que o esperado.'
    const btns=document.createElement('div')
    btns.style.cssText='display:flex;gap:8px;justify-content:center'
    const btnAguardar=document.createElement('button')
    btnAguardar.className='btn btn-s btn-sm'
    btnAguardar.textContent='Aguardar'
    btnAguardar.onclick=()=>{ proc.innerHTML=spinnerHTML }
    const btnCancelar=document.createElement('button')
    btnCancelar.className='btn btn-p btn-sm'
    btnCancelar.textContent='Preencher manualmente'
    btnCancelar.onclick=()=>{
      controller.abort()
      uz.style.opacity='1'
      uz.style.pointerEvents='auto'
      proc.innerHTML='<div style="font-size:.82rem;color:var(--text-tertiary);text-align:center;padding:4px 0">A extração de dados não foi concluída. Preenche os campos manualmente.</div>'
    }
    btns.appendChild(btnAguardar)
    btns.appendChild(btnCancelar)
    wrap.appendChild(msg)
    wrap.appendChild(btns)
    proc.appendChild(wrap)
  }

  const timeoutId=setTimeout(mostrarTimeoutAviso, 12000)

  const reader=new FileReader()
  reader.onload=async ev=>{
    const base64=ev.target.result.split(',')[1]
    const mimeType=file.type||'application/octet-stream'
    try {
      const res=await fetch('/.netlify/functions/extract-recibo',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({fileBase64:base64,mimeType}),
        signal:controller.signal
      })
      clearTimeout(timeoutId)
      if(!res.ok) throw new Error('Function error')
      const data=await res.json()
      if(data.error) throw new Error(data.error)
      const fields={
        num: data.invoice_number||'',
        data: data.date||'',
        valor: data.amount!=null?String(data.amount):'',
        desc: data.description||'',
        clienteNome: data.client_name||'',
      }
      aplicarCamposRecibo(fields, file.name)
    } catch(err){
      clearTimeout(timeoutId)
      if(err.name==='AbortError') return
      console.warn('Gemini extraction failed, using fallback:', err)
      aplicarCamposRecibo(extrairCamposPorNomeRecibo(file.name), file.name)
    }
  }
  reader.readAsDataURL(file)
  e.target.value=''
}

function extrairCamposRecibo(text, filename){
  const d={}
  // Valor: procura padrões €X.XXX,XX ou X.XX€
  const mVal=text.match(/(?:total|valor|montante|amount)[:\s€]*([0-9]+[.,][0-9]{2})/i)
    || text.match(/€\s*([0-9]+[.,][0-9]{2})/) || text.match(/([0-9]+[.,][0-9]{2})\s*€/)
  if(mVal) d.valor=mVal[1].replace(',','.')

  // Data: DD/MM/AAAA ou AAAA-MM-DD
  const mData=text.match(/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/) || text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/)
  if(mData){
    let raw=mData[1]
    const p=raw.split(/[-\/]/)
    if(p[0].length===4) d.data=`${p[0]}-${p[1].padStart(2,'0')}-${p[2].padStart(2,'0')}`
    else d.data=`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`
  }

  // Nº do recibo
  const mNum=text.match(/(?:recibo|fatura|factura|invoice|n[º°]|ref)[:\s#.]*([A-Z0-9\/\-]+)/i)
  if(mNum) d.num=mNum[1].trim()

  // Descrição
  const mDesc=text.match(/(?:descri[çc][ãa]o|servi[çc]o|description)[:\s]+([^\n,;]{5,80})/i)
  if(mDesc) d.desc=mDesc[1].trim()

  // Cliente / empresa emissora
  const mCl=text.match(/(?:cliente|client|to|para|destinat)[:\s]+([^\n,]{3,50})/i)
  if(mCl) d.clienteNome=mCl[1].trim()

  return d
}

function extrairCamposPorNomeRecibo(filename){
  const d={}
  const base=filename.replace(/\.[^.]+$/,'')
  // Valor no nome: 1200,00 ou 1200.00
  const mVal=base.match(/(\d+[.,]\d{2})/)
  if(mVal) d.valor=mVal[1].replace(',','.')
  // Data no nome: 2025-05-08
  const mData=base.match(/(\d{4}[-_]\d{2}[-_]\d{2})/)
  if(mData) d.data=mData[1].replace(/_/g,'-')
  // Nº: FT2025001 ou FT_2025_001
  const mNum=base.match(/([A-Z]{2,}[-_]?\d{4}[-_\/]?\d+)/i)
  if(mNum) d.num=mNum[1]
  // Demo values se nada encontrado
  if(!d.valor) d.valor='1200.00'
  if(!d.data)  d.data=new Date().toISOString().slice(0,10)
  if(!d.num)   d.num=`FT ${new Date().getFullYear()}/${String(Object.values(faturas).flat().length+1).padStart(3,'0')}`
  if(!d.desc)  d.desc='Serviço de consultoria'
  return d
}

function aplicarCamposRecibo(fields, filename){
  document.getElementById('mrProcessing').style.display='none'
  document.getElementById('mrUploadZone').style.opacity='1'
  document.getElementById('mrUploadZone').style.pointerEvents='auto'

  // Update upload zone to show file name
  document.getElementById('mrUploadZone').innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;padding:4px 0">
      <div style="width:36px;height:36px;background:var(--accent-primary-light);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa-solid fa-file" style="color:var(--accent-primary)" aria-hidden="true"></i>
      </div>
      <div style="flex:1;text-align:left;min-width:0">
        <div style="font-size:.84rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escH(filename)}</div>
        <div style="font-size:.73rem;color:var(--text-tertiary)">Carregado com sucesso</div>
      </div>
      <button onclick="resetReciboUpload()" style="font-size:.75rem;color:var(--text-tertiary);background:none;border:none;cursor:pointer;padding:4px">Alterar</button>
    </div>`

  // Fill fields
  if(fields.valor) document.getElementById('mrValor').value=parseFloat(fields.valor).toFixed(2)
  if(fields.data)  document.getElementById('mrData').value=fields.data
  if(fields.num)   document.getElementById('mrNum').value=fields.num
  if(fields.desc)  document.getElementById('mrDesc').value=fields.desc

  // Try to match client name
  if(fields.clienteNome){
    const match=clientes.find(c=>c.nome.toLowerCase().includes(fields.clienteNome.toLowerCase())
      || fields.clienteNome.toLowerCase().includes(c.nome.toLowerCase()))
    if(match) document.getElementById('mrCliente').value=match.id
  }

  // Count detected fields for banner message
  const count=Object.keys(fields).filter(k=>fields[k]).length
  const banner=document.getElementById('mrExtractedBanner')
  banner.style.display='flex'
  banner.querySelector('span').textContent=`${count} campo${count!==1?'s':''} preenchido${count!==1?'s':''} automaticamente — revê antes de guardar`
}

function resetReciboUpload(){
  document.getElementById('mrUploadZone').innerHTML=`
    <div style="width:40px;height:40px;background:var(--accent-primary-light);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
      <i class="fa-solid fa-file-arrow-up" style="color:var(--accent-primary);font-size:18px" aria-hidden="true"></i>
    </div>
    <div style="font-size:.88rem;font-weight:600;color:var(--accent-primary);margin-bottom:3px">Carregar fatura</div>
    <div style="font-size:.75rem;color:var(--text-tertiary)">Arrasta ou clica para selecionar · PDF, imagem ou Word</div>
    <div style="margin-top:10px">
      <span style="font-size:.72rem;background:var(--accent-primary-light);color:var(--accent-primary);border-radius:99px;padding:3px 10px;font-weight:600">Preenche os campos automaticamente</span>
    </div>`
  document.getElementById('mrUploadZone').onclick=()=>document.getElementById('mrFileInput').click()
  document.getElementById('mrExtractedBanner').style.display='none'
  const proc=document.getElementById('mrProcessing')
  proc.style.display='none'
  proc.innerHTML='<div style="width:28px;height:28px;border:2px solid var(--border-subtle);border-top-color:var(--accent-primary);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 8px"></div><div style="font-size:.82rem;color:var(--accent-primary);font-weight:500">A extrair dados do recibo...</div>'
  ;['mrValor','mrData','mrNum','mrDesc'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''})
  document.getElementById('mrEstado').value='pendente'
}

/* ───────────────────────────────────────
   MODAL ADICIONAR DOCUMENTO — extracção
─────────────────────────────────────── */
function abrirModalDoc(){
  // Reset modal state
  resetDocModal()
  // Populate client select
  const sel=document.getElementById('mdCliente')
  sel.innerHTML='<option value="">— Nenhum —</option>'+
    clientes.map(c=>`<option value="${c.id}"${c.id===ativo?' selected':''}>${escH(c.nome)}</option>`).join('')
  document.getElementById('mdData').value=new Date().toISOString().slice(0,10)
  abrirModal('modalDoc')
}

function resetDocModal(){
  document.getElementById('mdNome').value=''
  document.getElementById('mdTipo').value='Outro'
  document.getElementById('mdNotas').value=''
  document.getElementById('mdExtractedBanner').style.display='none'
  document.getElementById('mdMetaTags').style.display='none'
  document.getElementById('mdProcessing').style.display='none'
  document.getElementById('mdFilePreview').style.display='none'
  // Reset file input and upload zone appearance
  const fi=document.getElementById('mdFileInput'); if(fi) fi.value=''
  const uz=document.getElementById('mdUploadZone')
  uz.style.borderColor='var(--border-strong)'
  uz.style.background='var(--bg-page)'
}

function onDocModalDrop(e){
  e.preventDefault()
  document.getElementById('mdUploadZone').classList.remove('drag-over')
  const file=e.dataTransfer.files[0]; if(!file) return
  processDocModalFile({target:{files:[file]}})
}

function processDocModalFile(e){
  const file=e.target.files[0]; if(!file) return
  const ext=file.name.split('.').pop().toLowerCase()

  // Show file preview in upload zone
  const fp=document.getElementById('mdFilePreview')
  fp.style.display='flex'
  document.getElementById('mdFileName').textContent=file.name
  const sz=file.size<1024?file.size+'B':file.size<1048576?(file.size/1024).toFixed(0)+' KB':(file.size/1048576).toFixed(1)+' MB'
  document.getElementById('mdFileSize').textContent=sz

  // Processing state
  document.getElementById('mdProcessing').style.display='block'
  document.getElementById('mdExtractedBanner').style.display='none'
  document.getElementById('mdMetaTags').style.display='none'

  if(['txt','csv'].includes(ext)){
    const reader=new FileReader()
    reader.onload=ev=>{ aplicarCamposDoc(extrairCamposDoc(ev.target.result, file.name), file.name, ext) }
    reader.readAsText(file)
  } else {
    setTimeout(()=>{ aplicarCamposDoc(extrairCamposDocPorNome(file.name), file.name, ext) }, 800)
  }
  e.target.value=''
}

function extrairCamposDoc(text, filename){
  const d={}
  // Tipo de documento pelo conteúdo
  if(/contrato|acordo|terms/i.test(text))       d.tipo='Contrato'
  else if(/proposta|quotation|orçamento/i.test(text)) d.tipo='Proposta'
  else if(/fatura|invoice/i.test(text))         d.tipo='Fatura'
  else if(/briefing|brief/i.test(text))         d.tipo='Briefing'
  else if(/legal|gdpr|rgpd|privacidade/i.test(text)) d.tipo='Legal'

  // NIF — pode aparecer no texto
  const mNIF=text.match(/\b(\d{9})\b/)
  if(mNIF) d.nif=mNIF[1]

  // Data
  const mData=text.match(/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/) || text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/)
  if(mData){
    const p=mData[1].split(/[-\/]/)
    if(p[0].length===4) d.data=`${p[0]}-${p[1].padStart(2,'0')}-${p[2].padStart(2,'0')}`
    else d.data=`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`
  }

  // Empresa/cliente
  const mCl=text.match(/(?:cliente|empresa|company|between)[:\s]+([^\n,;]{3,50})/i)
  if(mCl) d.clienteNome=mCl[1].trim()

  return d
}

function extrairCamposDocPorNome(filename){
  const d={}
  const base=filename.replace(/\.[^.]+$/,'').toLowerCase()
  if(/contrato/i.test(base))       d.tipo='Contrato'
  else if(/proposta/i.test(base))  d.tipo='Proposta'
  else if(/brief/i.test(base))     d.tipo='Briefing'
  else if(/legal|rgpd|gdpr/i.test(base)) d.tipo='Legal'
  else if(/fatura|invoice/i.test(base)) d.tipo='Fatura'
  // Data no nome
  const mData=filename.match(/(\d{4}[-_]\d{2}[-_]\d{2})/)
  if(mData) d.data=mData[1].replace(/_/g,'-')
  // Empresa no nome: Contrato_NomEmpresa ou NomeEmpresa_Contrato
  const mNome=filename.replace(/\.[^.]+$/,'').match(/(?:^|[_\-])([A-ZÁÉÍÓÚ][a-zA-ZÀ-ÿ]{2,}(?:[_\s][A-Za-zÀ-ÿ]+)?)(?:[_\-]|$)/)
  if(mNome) d.clienteNome=mNome[1].replace(/_/g,' ')
  // Demo
  if(!d.tipo) d.tipo='Outro'
  return d
}

function aplicarCamposDoc(fields, filename, ext){
  document.getElementById('mdProcessing').style.display='none'

  // Set nome = filename
  document.getElementById('mdNome').value=filename

  // Set tipo
  if(fields.tipo) document.getElementById('mdTipo').value=fields.tipo

  // Set data
  if(fields.data) document.getElementById('mdData').value=fields.data

  // Try to match client
  if(fields.clienteNome){
    const match=clientes.find(c=>
      c.nome.toLowerCase().includes(fields.clienteNome.toLowerCase()) ||
      fields.clienteNome.toLowerCase().includes(c.nome.toLowerCase()))
    if(match) document.getElementById('mdCliente').value=match.id
  }

  // Show banner
  const banner=document.getElementById('mdExtractedBanner')
  banner.style.display='flex'

  // Show meta tags for detected info
  const tags=[]
  if(fields.tipo && fields.tipo!=='Outro') tags.push({label:fields.tipo, cls:'bg-b'})
  if(fields.data) tags.push({label:fields.data, cls:'bg-n'})
  if(fields.clienteNome) tags.push({label:fields.clienteNome, cls:'bg-g'})
  if(fields.nif) tags.push({label:'NIF: '+fields.nif, cls:'bg-n'})

  const ext2doc={pdf:'PDF',docx:'Word',doc:'Word',xlsx:'Excel',xls:'Excel',png:'Imagem',jpg:'Imagem',jpeg:'Imagem',txt:'Texto',csv:'CSV'}
  if(ext2doc[ext]) tags.push({label:ext2doc[ext]||ext.toUpperCase(), cls:'bg-p'})

  const tagsEl=document.getElementById('mdMetaTags')
  tagsEl.style.display='flex'
  tagsEl.innerHTML=tags.map(t=>`<span class="badge ${t.cls}" style="font-size:.72rem">${escH(t.label)}</span>`).join('')
}

async function guardarDocumento(){
  const nome=document.getElementById('mdNome').value.trim()
  const clienteId=document.getElementById('mdCliente').value||ativo
  const tipo=document.getElementById('mdTipo').value
  let ok=true
  if(!nome){erroCampo('mdNome','O nome do documento é obrigatório.');ok=false}
  if(!clienteId){erroCampo('mdCliente','Seleciona o cliente associado a este documento.');ok=false}
  if(!ok) return
  const { data, error } = await db.from('documents').insert({
    client_id: clienteId,
    name: nome,
    type: tipo,
    url: null,
  }).select().single()
  if(error){erroGeral('modalDoc','Não foi possível guardar. Verifica a tua ligação e tenta novamente.');return}
  if(!documentos[clienteId]) documentos[clienteId]=[]
  documentos[clienteId].unshift(mapDocFromDB(data))
  fecharModal('modalDoc')
  selCl(ativo)
  renderCl()
}

/* ───────────────────────────────────────
   ESTIMADOR — FORM LOCK/UNLOCK
─────────────────────────────────────── */
let formLocked = true

/* ───────────────────────────────────────
   PERFIL
─────────────────────────────────────── */
function renderPerfil(){
  const user = currentUser
  if(!user) return
  const name = user.email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
  const el = document.getElementById('perfilNome')
  if(el) el.textContent = name
  const em = document.getElementById('perfilEmail')
  if(em) em.textContent = user.email
  const av = document.getElementById('perfilAvatar')
  if(av) av.textContent = name[0].toUpperCase()
  updateThemeBtn()
}

function setPerfilEditable(editable){
  const inputs = ['eR','eD','eI']
  const selects = ['eReg','eT']
  inputs.forEach(id=>{ const el=document.getElementById(id); if(el) el.readOnly=!editable })
  selects.forEach(id=>{ const el=document.getElementById(id); if(el) el.disabled=!editable })
  const emp = document.getElementById('eEmp')
  if(emp) emp.disabled = !editable
  document.getElementById('perfilBtnEditar').style.display = editable ? 'none' : 'flex'
  document.getElementById('perfilBtnGuardar').style.display = editable ? 'flex' : 'none'
  document.getElementById('perfilBtnCancelar').style.display = editable ? 'flex' : 'none'
  if(!editable){
    const msg = document.getElementById('perfilSavedMsg')
    if(msg) msg.style.display = 'none'
  }
}

function guardarPerfilFiscal(){
  setPerfilEditable(false)
  const msg = document.getElementById('perfilSavedMsg')
  if(msg){ msg.style.display = 'flex'; setTimeout(()=>{ msg.style.display='none' }, 3000) }
}

function setFormEditable(editable){
  formLocked = !editable
  const inputs = ['eR','eD','eI']
  const selects = ['eReg','eT']
  inputs.forEach(id=>{
    const el=document.getElementById(id)
    if(el) el.readOnly=!editable
  })
  selects.forEach(id=>{
    const el=document.getElementById(id)
    if(el) el.disabled=!editable
  })
  const emp=document.getElementById('eEmp')
  if(emp) emp.disabled=!editable

}

/* ───────────────────────────────────────
   RESUMO FISCAL
─────────────────────────────────────── */
function renderEstStrip(){
  const r=parseFloat(document.getElementById('eR')?.value)||0
  const d=parseFloat(document.getElementById('eD')?.value)||0
  const reg=document.getElementById('eReg')?.value||'simplificado'
  const totalFats=Object.values(faturas).flat().filter(f=>f.estado!=='cancelada').reduce((s,f)=>s+f.valor,0)
  set('stripR', r>0 ? `${f0(r)}/mês` : '—')
  set('stripD', d>0 ? `${f0(d)}/mês` : '—')
  set('stripReg', reg==='ato_isolado' ? 'Ato Isolado' : 'Regime Simplificado')
  const displayEl=document.getElementById('totalFaturadoDisplay')
  if(displayEl) displayEl.textContent=totalFats>0 ? f2(totalFats) : '—'
}

function calcEst(){
  const r=parseFloat(document.getElementById('eR').value)||0
  const d=parseFloat(document.getElementById('eD').value)||0
  // Total faturado comes from the fixed display (sum of all faturas)
  const totalFats=Object.values(faturas).flat().filter(f=>f.estado!=='cancelada').reduce((s,f)=>s+f.valor,0)
  const a=totalFats||11240
  const reg=document.getElementById('eReg').value
  const tco=document.getElementById('eEmp').checked
  if(r<=0){
    const err=document.getElementById('calcEstErr')
    if(err){err.textContent='Preenche o teu rendimento no perfil antes de calcular.';err.style.display='block';setTimeout(()=>{err.style.display='none'},4000)}
    return
  }
  const calcErr=document.getElementById('calcEstErr'); if(calcErr){calcErr.style.display='none'}

  // Update data strip
  const displayEl=document.getElementById('totalFaturadoDisplay')
  if(displayEl) displayEl.textContent=f2(a)
  set('stripR',`${f0(r)}/mês`)
  set('stripD',`${f0(d)}/mês`)
  set('stripReg',reg==='ato_isolado'?'Ato Isolado':'Regime Simplificado')

  const irs=r*0.25
  let ss=0, ssInfo=''
  if(reg==='ato_isolado'){
    ss=0; ssInfo='Ato isolado: isento de SS'
  } else if(tco){
    const rendRel=r*0.70
    if(rendRel<LIMIAR_SS){
      ss=0
      ssInfo=`Isento — rend. relevante ${f0(rendRel)}/mês < limite ${f0(LIMIAR_SS)}`
    } else {
      const base=rendRel-LIMIAR_SS
      ss=base*0.214
      ssInfo=`Paga sobre excedente: (${f0(rendRel)} − ${f0(LIMIAR_SS)}) × 21,4% = ${f0(ss)}`
    }
  } else {
    ss=r*0.70*0.214
    ssInfo=`21,4% × 70% base de incidência = ${f0(ss)}`
  }

  const liquido=Math.max(0,r-irs-ss-d)
  const tot=a

  set('eVL',f0(liquido)); set('eSL',`${fp((liquido/r)*100)} do bruto · −${f0(d)} despesas`)
  setW('eBL',Math.min(100,(liquido/r)*100))
  set('eVI',f0(irs)); setW('eBI',25)
  set('eVS',ss===0?'€0 — Isento':f0(ss)); set('eSS2',ssInfo)
  setW('eBS',Math.min(100,r>0?(ss/r)*100:0))

  const ssBox=document.getElementById('ssInfoBox')
  if(ssBox){ssBox.style.display='block';ssBox.innerHTML=`<strong>Segurança Social:</strong> ${ssInfo}`}

  const pIVA=Math.min(100,(tot/LIMITE_IVA)*100), pRS=Math.min(100,(tot/LIMITE_RS)*100)
  set('ePIVA',fp(pIVA))
  const pivEl=document.getElementById('ePIVA')
  if(pivEl) pivEl.style.color=pIVA>=90?'var(--accent-error)':pIVA>=70?'var(--accent-caution)':'var(--accent-success)'
  setW('eBIVA',pIVA)
  const bivaEl=document.getElementById('eBIVA')
  if(bivaEl) bivaEl.className='pg-fill '+(pIVA>=90?'r':pIVA>=70?'a':'g')
  set('eLIVA',`${f0(tot)} de ${f0(LIMITE_IVA)}`); set('eRIVA',`Restam ${f0(LIMITE_IVA-tot)}`)
  const rivaEl=document.getElementById('eRIVA')
  if(rivaEl) rivaEl.style.color=pIVA>=70?'var(--accent-caution)':'var(--accent-success)'
  set('ePRS',fp(pRS)); setW('eBRS',pRS)
  set('eLRS',`${f0(tot)} de ${f0(LIMITE_RS)}`); set('eRRS',`Restam ${f0(LIMITE_RS-tot)}`)

  const ra=r*12,da=d*12,ia=irs*12,sa=ss*12,la=Math.max(0,ra-ia-sa-da)
  set('bTot',f2(ra)); set('bDesp',`(${f2(da)})`); set('bTrib',f2(ra-da))
  set('bIRS',`(${f2(ia)})`); set('bSS',ss===0?'€0 (Isento)':`(${f2(sa)})`); set('bLiq',f2(la))
  set('dCV',f0(la))

  // Recommendations
  const recs=[]
  if(pIVA>=90) recs.push({icon:'alert-triangle',cls:'bg-r',tag:'Urgente',label:'rt-warn',title:'Limite de IVA quase atingido',desc:`Faturaste ${fp(pIVA)} do limite de isenção (€14.500).`})
  else if(pIVA>=70) recs.push({icon:'alert-circle',cls:'bg-a',tag:'Atenção',label:'rt-warn',title:'Aproximas-te do limite de IVA',desc:`Estás a ${fp(pIVA)} do limite. Continua a acompanhar.`})
  if(ss===0&&tco) recs.push({icon:'shield',cls:'bg-g',tag:'Informação',label:'rt-info',title:'Isenção de SS ativa',desc:`O teu rendimento relevante está abaixo de €2.090/mês. Mantém o controlo.`})
  if(ss>0&&tco) recs.push({icon:'trending-up',cls:'bg-a',tag:'Atenção',label:'rt-warn',title:'Passaste o limiar de isenção SS',desc:`Pagas SS sobre o excedente (${f0(ss)}/mês).`})
  recs.push({icon:'briefcase',cls:'bg-b',tag:'Sugestão',label:'rt-sug',title:'Rever despesas dedutíveis',desc:'Podes deduzir despesas de software, formação e equipamento.'})

  const svgIcons={
    'alert-triangle':'<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>',
    'alert-circle':'<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>',
    'shield':'<i class="fa-solid fa-shield" aria-hidden="true"></i>',
    'trending-up':'<i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>',
    'briefcase':'<i class="fa-solid fa-briefcase" aria-hidden="true"></i>',
  }
  const rlEl=document.getElementById('recList')
  if(rlEl) rlEl.innerHTML=recs.map(rc=>`
    <div class="rec-item">
      <div class="rec-ico ${rc.cls}">${svgIcons[rc.icon]||''}</div>
      <div class="rec-body"><div class="rec-title">${rc.title}</div><div class="rec-desc">${rc.desc}</div></div>
      <span class="rec-tag ${rc.label}">${rc.tag}</span>
      <i class="fa-solid fa-chevron-right" style="color:var(--text-tertiary);flex-shrink:0;margin-left:4px" aria-hidden="true"></i>
    </div>`).join('')
}

/* ───────────────────────────────────────
   MODAL — NOVO RECIBO (cliente page)
─────────────────────────────────────── */
function abrirModalRecibo(clienteId){
  // Reset upload zone and banners
  resetReciboUpload()
  document.getElementById('mrExtractedBanner').style.display='none'
  document.getElementById('mrProcessing').style.display='none'
  // Pre-select client if provided
  const sel=document.getElementById('mrCliente')
  sel.innerHTML='<option value="">— Selecionar —</option>'+
    clientes.map(c=>`<option value="${c.id}"${c.id===clienteId?' selected':''}>${escH(c.nome)}</option>`).join('')
  // Auto next invoice number
  const totalFats=Object.values(faturas).flat().length
  document.getElementById('mrNum').value=`2025/${String(totalFats+1).padStart(3,'0')}`
  document.getElementById('mrData').value=new Date().toISOString().slice(0,10)
  document.getElementById('mrValor').value=''
  document.getElementById('mrDesc').value=''
  document.getElementById('mrEstado').value='pendente'
  abrirModal('modalRecibo')
}

async function guardarRecibo(){
  const clienteId=document.getElementById('mrCliente').value
  const valor=parseFloat(document.getElementById('mrValor').value)||0
  const dataVal=document.getElementById('mrData').value
  const num=document.getElementById('mrNum').value.trim()
  const desc=document.getElementById('mrDesc').value.trim()||'Serviço prestado'
  const estado=document.getElementById('mrEstado').value
  let ok=true
  if(!clienteId){erroCampo('mrCliente','Seleciona o cliente associado a esta fatura.');ok=false}
  if(valor<=0){erroCampo('mrValor','O valor tem de ser superior a €0,00.');ok=false}
  if(!dataVal){erroCampo('mrData','A data da fatura é obrigatória.');ok=false}
  if(!ok) return
  const { data, error } = await db.from('invoices').insert({
    client_id: clienteId,
    invoice_number: num,
    date: dataVal,
    description: desc,
    amount: valor,
    status: estado,
  }).select().single()
  if(error){erroGeral('modalRecibo','Não foi possível guardar. Verifica a tua ligação e tenta novamente.');return}
  if(!faturas[clienteId]) faturas[clienteId]=[]
  faturas[clienteId].unshift(mapInvoiceFromDB(data))
  fecharModal('modalRecibo')
  selCl(clienteId)
  renderCl()
  renderSummary()
}

async function toggleEstadoRecibo(invoiceId){
  const fat=(faturas[ativo]||[]).find(f=>f.id===invoiceId); if(!fat) return
  const novoEstado=fat.estado==='pago'?'pendente':'pago'
  const { error }=await db.from('invoices').update({status:novoEstado, updated_at:new Date().toISOString()}).eq('id',invoiceId)
  if(error){console.error('Erro ao atualizar estado:',error.message);return}
  fat.estado=novoEstado
  await selCl(ativo)
  renderCl()
  renderSummary()
}

/* ───────────────────────────────────────
   MODAL — EDITAR CLIENTE
─────────────────────────────────────── */
function abrirModalEditarCl(id){
  const c=clientes.find(x=>x.id===id); if(!c) return
  document.getElementById('ecNome').value=c.nome||''
  document.getElementById('ecNIF').value=c.nif||''
  document.getElementById('ecEmail').value=c.email||''
  document.getElementById('ecTel').value=c.tel||''
  document.getElementById('ecMorada').value=c.morada||''
  document.getElementById('ecNotas').value=c.notas||''
  document.getElementById('ecSince').value=c.client_since||''
  document.getElementById('modalEditCl').dataset.editId=id
  abrirModal('modalEditCl')
}

function confirmarApagarCliente(){
  const c=clientes.find(x=>x.id===ativo); if(!c) return
  document.getElementById('apagarClNome').textContent=c.nome
  document.getElementById('apagarClCheck').checked=false
  document.getElementById('btnConfirmarApagar').disabled=true
  abrirModal('modalApagarCl')
  document.querySelectorAll('.user-menu-dropdown').forEach(d=>d.classList.remove('open'))
}

async function apagarCliente(){
  const id=ativo; if(!id) return
  // Delete files from storage
  const docs=documentos[id]||[]
  const filePaths=docs.filter(d=>d.url).map(d=>d.url)
  if(filePaths.length) await db.storage.from('documents').remove(filePaths)
  // Delete DB records in order
  await db.from('documents').delete().eq('client_id', id)
  await db.from('invoices').delete().eq('client_id', id)
  const { error } = await db.from('clients').delete().eq('id', id)
  if(error){erroGeral('modalApagarCl','Não foi possível apagar. Verifica a tua ligação e tenta novamente.');return}
  // Remove from local state
  clientes=clientes.filter(x=>x.id!==id)
  delete faturas[id]
  delete documentos[id]
  ativo=null
  fecharModal('modalApagarCl')
  renderCl()
  renderSummary()
  if(clientes.length>0) selCl(clientes[0].id)
  else document.getElementById('cdHdr').style.display='none'
}

/* ───────────────────────────────────────
   DELETE RECIBO
─────────────────────────────────────── */
function confirmarApagarRecibo(invoiceId){
  const fat=(faturas[ativo]||[]).find(f=>f.id===invoiceId); if(!fat) return
  ativoRecibo=invoiceId
  document.getElementById('apagarReciboNum').textContent=fat.num
  document.getElementById('apagarReciboVal').textContent=f2(fat.valor)
  document.getElementById('apagarReciboCheck').checked=false
  document.getElementById('btnConfirmarApagarRecibo').disabled=true
  abrirModal('modalApagarRecibo')
}

async function apagarRecibo(){
  if(!ativoRecibo||!ativo) return
  const fat=(faturas[ativo]||[]).find(f=>f.id===ativoRecibo); if(!fat) return
  // Delete linked document (file + record) if present
  if(fat.document_id){
    const doc=(documentos[ativo]||[]).find(d=>d.id===fat.document_id)
    if(doc&&doc.url) await db.storage.from('documents').remove([doc.url])
    await db.from('documents').delete().eq('id', fat.document_id)
    documentos[ativo]=(documentos[ativo]||[]).filter(d=>d.id!==fat.document_id)
  }
  const { error }=await db.from('invoices').delete().eq('id', ativoRecibo)
  if(error){erroGeral('modalApagarRecibo','Não foi possível apagar. Verifica a tua ligação e tenta novamente.');return}
  faturas[ativo]=(faturas[ativo]||[]).filter(f=>f.id!==ativoRecibo)
  ativoRecibo=null
  fecharModal('modalApagarRecibo')
  selCl(ativo)
  renderCl()
  renderSummary()
}

/* ───────────────────────────────────────
   DELETE DOCUMENTO
─────────────────────────────────────── */
function confirmarApagarDoc(docId){
  const doc=(documentos[ativo]||[]).find(d=>d.id===docId); if(!doc) return
  ativoDoc=docId
  document.getElementById('apagarDocNome').textContent=doc.nome
  document.getElementById('apagarDocCheck').checked=false
  document.getElementById('btnConfirmarApagarDoc').disabled=true
  abrirModal('modalApagarDoc')
}

async function apagarDoc(){
  if(!ativoDoc||!ativo) return
  const doc=(documentos[ativo]||[]).find(d=>d.id===ativoDoc); if(!doc) return
  if(doc.url) await db.storage.from('documents').remove([doc.url])
  const { error }=await db.from('documents').delete().eq('id', ativoDoc)
  if(error){erroGeral('modalApagarDoc','Não foi possível apagar. Verifica a tua ligação e tenta novamente.');return}
  documentos[ativo]=(documentos[ativo]||[]).filter(d=>d.id!==ativoDoc)
  ativoDoc=null
  fecharModal('modalApagarDoc')
  selCl(ativo)
}

async function guardarEdicaoCliente(){
  const id=document.getElementById('modalEditCl').dataset.editId
  const c=clientes.find(x=>x.id===id); if(!c) return
  const nome=document.getElementById('ecNome').value.trim()
  const nif=document.getElementById('ecNIF').value.trim()
  const email=document.getElementById('ecEmail').value.trim()
  let ok=true
  if(!nome){erroCampo('ecNome','O nome é obrigatório.');ok=false}
  if(!validarNIF(nif)){erroCampo('ecNIF','NIF inválido. Deve ter 9 dígitos, sem espaços. Ex: 123456789');ok=false}
  if(!validarEmail(email)){erroCampo('ecEmail','Formato de email inválido. Ex: nome@empresa.pt');ok=false}
  if(!ok) return
  const updates = {
    name: nome||c.nome,
    nif: nif||null,
    email: email||null,
    phone: document.getElementById('ecTel').value.trim()||null,
    address: document.getElementById('ecMorada').value.trim()||null,
    notes: document.getElementById('ecNotas').value.trim()||null,
    client_since: document.getElementById('ecSince').value||null,
  }
  const { error } = await db.from('clients').update(updates).eq('id', id)
  if(error){erroGeral('modalEditCl','Não foi possível guardar. Verifica a tua ligação e tenta novamente.');return}
  Object.assign(c, mapClientFromDB({ ...c, name: updates.name, nif: updates.nif, phone: updates.phone, address: updates.address, notes: updates.notes, created_at: new Date().toISOString() }))
  fecharModal('modalEditCl')
  renderCl()
  selCl(id)
}

/* ───────────────────────────────────────
   ATIVIDADE RECENTE
─────────────────────────────────────── */
async function renderActivity(){
  const el=document.getElementById('actItems'); if(!el) return
  const [{ data: rClients }, { data: rInvoices }, { data: rDocs }] = await Promise.all([
    db.from('clients').select('id,name,created_at').order('created_at',{ascending:false}).limit(8),
    db.from('invoices').select('id,invoice_number,amount,created_at,updated_at,status,client_id').order('created_at',{ascending:false}).limit(8),
    db.from('documents').select('id,name,created_at,client_id').order('created_at',{ascending:false}).limit(8),
  ])
  const events=[]
  ;(rClients||[]).forEach(c=>events.push({type:'client',date:new Date(c.created_at),label:`Novo cliente · ${c.name}`,sub:null}))
  ;(rInvoices||[]).forEach(f=>{
    const cl=clientes.find(x=>x.id===f.client_id)
    const clNome=cl?cl.nome:'—'
    events.push({type:'invoice',date:new Date(f.created_at),label:`Fatura ${f.invoice_number||'—'} · ${clNome}`,sub:f2(parseFloat(f.amount)||0)})
    if(f.updated_at){
      const statusLabel=f.status==='pago'?'marcado como pago':'marcado como pendente'
      events.push({type:'paid',date:new Date(f.updated_at),label:`Fatura ${f.invoice_number||'—'} ${statusLabel}`,sub:clNome})
    }
  })
  ;(rDocs||[]).forEach(d=>{
    const cl=clientes.find(x=>x.id===d.client_id)
    events.push({type:'doc',date:new Date(d.created_at),label:d.name||'—',sub:cl?cl.nome:'—'})
  })
  events.sort((a,b)=>b.date-a.date)
  const top=events.slice(0,6)
  const icoCl=`<i class="fa-solid fa-user" aria-hidden="true"></i>`
  const icoInv=`<i class="fa-solid fa-file-invoice" aria-hidden="true"></i>`
  const icoDoc=`<i class="fa-solid fa-file" aria-hidden="true"></i>`
  const icoPaid=`<i class="fa-solid fa-circle-check" aria-hidden="true"></i>`
  const icoMap={client:icoCl,invoice:icoInv,doc:icoDoc,paid:icoPaid}
  const clsMap={client:'ai-cl',invoice:'ai-inv',doc:'ai-doc',paid:'ai-inv'}
  el.innerHTML=top.length===0
    ?'<p style="color:var(--text-tertiary);font-size:.82rem;padding:8px 0">Sem atividade recente.</p>'
    :top.map(e=>{
        const dt=e.date.toLocaleDateString('pt-PT',{day:'2-digit',month:'short'})
        return `<div class="act-item"><div class="act-ico ${clsMap[e.type]}">${icoMap[e.type]}</div><div class="act-body"><div class="act-ev">${escH(e.label)}</div>${e.sub?`<div class="act-mt">${escH(e.sub)}</div>`:''}</div><div class="act-dt">${dt}</div></div>`
      }).join('')
}

/* ───────────────────────────────────────
   CALENDÁRIO FISCAL 2026
─────────────────────────────────────── */
const MESES_PT=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

const OBRIGACOES_FISCAIS=[
  { start:'2026-04-01', end:'2026-04-20', ev:'SS – Declaração Trimestral', dc:'1º Trimestre 2026' },
  { end:'2026-05-15', ev:'IVA – Declaração Periódica', dc:'1º Trimestre 2026' },
  { start:'2026-04-01', end:'2026-06-30', ev:'IRS – Modelo 3', dc:'Rendimentos 2025' },
  { start:'2026-07-01', end:'2026-07-20', ev:'SS – Declaração Trimestral', dc:'2º Trimestre 2026' },
  { end:'2026-08-15', ev:'IVA – Declaração Periódica', dc:'2º Trimestre 2026' },
  { start:'2026-10-01', end:'2026-10-20', ev:'SS – Declaração Trimestral', dc:'3º Trimestre 2026' },
  { end:'2026-11-15', ev:'IVA – Declaração Periódica', dc:'3º Trimestre 2026' },
  { start:'2027-01-01', end:'2027-01-20', ev:'SS – Declaração Trimestral', dc:'4º Trimestre 2026' },
  { end:'2027-02-15', ev:'IVA – Declaração Periódica', dc:'4º Trimestre 2026' },
  { start:'2027-04-01', end:'2027-06-30', ev:'IRS – Modelo 3', dc:'Rendimentos 2026' },
]

function renderCalendar(){
  const el=document.getElementById('calItems'); if(!el) return
  const hoje=new Date(); hoje.setHours(0,0,0,0)
  const upcoming=OBRIGACOES_FISCAIS
    .map(o=>({...o, endD:new Date(o.end+'T00:00:00'), startD:o.start?new Date(o.start+'T00:00:00'):null}))
    .filter(o=>o.endD>=hoje)
    .sort((a,b)=>a.endD-b.endD)
    .slice(0,5)
  el.innerHTML=upcoming.map(o=>{
    const endDias=Math.round((o.endD-hoje)/86400000)
    const mes=MESES_PT[o.endD.getMonth()]
    const dia=o.endD.getDate()
    let tagText, tagCls, rangeText
    if(o.startD&&o.startD>hoje){
      const startDias=Math.round((o.startD-hoje)/86400000)
      tagText=startDias===1?'Começa amanhã':`Começa em ${startDias} dias`
      tagCls='ct-s'
      rangeText=`${o.startD.getDate()} ${MESES_PT[o.startD.getMonth()]} – ${dia} ${mes}`
    } else {
      tagText=endDias===0?'Termina hoje':endDias===1?'Termina amanhã':`Termina em ${endDias} dias`
      tagCls=endDias<=7?'ct-pend':'ct-s'
      rangeText=o.startD
        ?`${o.startD.getDate()} ${MESES_PT[o.startD.getMonth()]} – ${dia} ${mes}`
        :`até ${dia} ${mes}`
    }
    return `<div class="cal-item"><div class="cal-dt"><div class="cal-mo">${mes}</div><div class="cal-d">${dia}</div></div><div class="cal-info"><div class="cal-ev">${o.ev}</div><div class="cal-dc">${o.dc}</div></div><div style="text-align:right;flex-shrink:0"><div class="cal-tag ${tagCls}">${tagText}</div><div style="font-size:.71rem;color:var(--text-tertiary);margin-top:4px;white-space:nowrap">${rangeText}</div></div></div>`
  }).join('')
}

/* ───────────────────────────────────────
   PREVIEW MODAL
─────────────────────────────────────── */
async function abrirPreview(storagePath, nome, ext){
  document.getElementById('previewFileName').textContent = nome || '—'
  const body = document.getElementById('previewBody')
  document.getElementById('modalPreview').classList.add('open')

  if(!storagePath){
    body.style.padding='24px'
    body.innerHTML=`<div style="text-align:center"><i class="fa-solid fa-file-circle-xmark" style="font-size:40px;color:var(--text-tertiary);display:block;margin-bottom:12px" aria-hidden="true"></i><div style="font-size:.85rem;color:var(--text-tertiary)">Sem ficheiro associado a este registo.</div></div>`
    document.getElementById('previewDownloadBtn').style.display='none'
    return
  }
  document.getElementById('previewDownloadBtn').style.display=''
  body.innerHTML = '<div style="color:var(--text-tertiary);font-size:.85rem">A carregar...</div>'

  const { data: signedData, error: signErr } = await db.storage.from('documents').createSignedUrl(storagePath, 3600)
  if(signErr || !signedData){
    body.style.padding='24px'
    body.innerHTML=`<div style="text-align:center"><i class="fa-solid fa-triangle-exclamation" style="font-size:40px;color:var(--accent-caution);display:block;margin-bottom:12px" aria-hidden="true"></i><div style="font-size:.85rem;color:var(--text-secondary)">Não foi possível carregar o ficheiro.</div></div>`
    return
  }
  const url = signedData.signedUrl

  document.getElementById('previewDownloadBtn').href = url

  const icon = document.getElementById('previewFileIcon')
  if(ext==='pdf'){
    icon.className='fa-solid fa-file-pdf'
    body.style.padding='0'
    body.innerHTML=`<iframe src="${url}" style="width:100%;height:100%;border:none" title="${escH(nome)}"></iframe>`
  } else if(ext==='img'){
    icon.className='fa-solid fa-image'
    body.style.padding='24px'
    body.innerHTML=`<img src="${url}" alt="${escH(nome)}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:var(--radius-sm)">`
  } else {
    icon.className='fa-solid fa-file'
    body.style.padding='24px'
    body.innerHTML=`
      <div style="text-align:center">
        <i class="fa-solid fa-file" style="font-size:48px;color:var(--text-tertiary);display:block;margin-bottom:16px" aria-hidden="true"></i>
        <div style="font-size:.85rem;color:var(--text-secondary);margin-bottom:6px">${escH(nome)}</div>
        <div style="font-size:.78rem;color:var(--text-tertiary);margin-bottom:20px">Este tipo de ficheiro não tem pré-visualização disponível.</div>
        <a href="${url}" target="_blank" rel="noopener" class="btn btn-p"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Abrir ficheiro</a>
      </div>`
  }
}

/* ───────────────────────────────────────
   INIT
─────────────────────────────────────── */
;async function init(){
  await loadClientes()
  await loadAllFaturas()
  renderCl()
  if(clientes.length > 0 && window.innerWidth > 880) selCl(clientes[0].id)
  setFormEditable(false)
  renderSummary()
  setTimeout(calcEst,100)
  renderCalendar()
  renderActivity()

  document.querySelectorAll('.modal-ov').forEach(ov=>{
    ov.addEventListener('click',e=>{if(e.target===ov) ov.classList.remove('open')})
  })

  // Apply hash routing on load — navigate to the page in the URL if present
  const startPage=location.hash.slice(1)||'dashboard'
  navegarPara(startPage, false)
}
