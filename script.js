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
  if (greetingEl) greetingEl.textContent = `Olá, ${name.split(' ')[0]}! 👋`

  const dropdownHTML = `
    <div class="user-menu">
      <button class="user-menu-trigger">
        <div class="user-av-sm">${initial}</div>
        <div class="user-menu-info">
          <span class="user-menu-name">${name}</span>
          <span class="user-menu-role">Freelancer</span>
        </div>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="user-menu-dropdown">
        <a href="#" class="umd-item" onclick="navegarPara('perfil');document.querySelectorAll('.user-menu-dropdown').forEach(d=>d.classList.remove('open'));return false"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>O meu perfil</a>
        <a href="#" class="umd-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg>Definições</a>
        <a href="#" class="umd-item" onclick="navegarPara('plano');document.querySelectorAll('.user-menu-dropdown').forEach(d=>d.classList.remove('open'));return false"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Plano e faturação</a>
        <div class="umd-sep"></div>
        <button class="umd-item umd-signout" onclick="signOut()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Terminar sessão</button>
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
    el.removeEventListener('input',clear); el.removeEventListener('change',clear)
  }
  el.addEventListener('input',clear); el.addEventListener('change',clear)
}
function limparErros(modalId){
  const ov=document.getElementById(modalId); if(!ov) return
  ov.querySelectorAll('.invalid').forEach(el=>{el.classList.remove('invalid');el.removeAttribute('aria-invalid')})
  ov.querySelectorAll('.field-err').forEach(el=>el.style.display='none')
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
  const ivaColor=pIVA>=90?'var(--red)':pIVA>=70?'var(--amber)':'var(--green)'
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
  document.querySelector('.cl-left').classList.remove('hidden-mobile')
  document.querySelector('.cd-panel').classList.remove('visible-mobile')
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
  if(p==='estimador') renderEstStrip()
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
        <div class="cl-mt">NIF ${c.nif} · ${(faturas[c.id]||[]).length} recibos</div>
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
  // On tablet/phone: hide list, show detail panel
  if(window.innerWidth<=880){
    document.querySelector('.cl-left').classList.add('hidden-mobile')
    document.querySelector('.cd-panel').classList.add('visible-mobile')
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
  document.getElementById('cdTotSub').textContent=`${fats.length} recibo${fats.length!==1?'s':''}`
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
    rbody.innerHTML='<p style="color:var(--t3);font-size:.82rem;padding:18px 0">Sem recibos registados.</p>'
  } else {
    rbody.innerHTML=`<table class="inv-tbl" style="table-layout:fixed;width:100%">
      <thead><tr><th style="width:130px">Nº</th><th style="width:110px">Data</th><th>Descrição</th><th style="width:100px">Valor</th><th style="width:100px">Estado</th><th style="width:44px"></th></tr></thead>
      <tbody>${fats.map(f=>`
        <tr>
          <td class="mono" style="color:var(--t3)">${escH(f.num)}</td>
          <td>${escH(f.data)}</td>
          <td>${escH(f.desc)}</td>
          <td class="mono">${f2(f.valor)}</td>
          <td><span class="badge ${f.estado==='pago'?'bg-g':f.estado==='pendente'?'bg-a':'bg-n'}">${escH(f.estado)}</span></td>
          <td><div class="user-menu"><button class="ico-btn user-menu-trigger"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="user-menu-dropdown"><button class="umd-item" onclick="toggleEstadoRecibo('${f.id}')">${f.estado==='pago'?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Marcar como pendente':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Marcar como pago'}</button><div class="umd-sep"></div><button class="umd-item umd-signout" onclick="confirmarApagarRecibo('${f.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Apagar recibo</button></div></div></td>
        </tr>`).join('')}
      </tbody></table>`
  }

  // TAB: Contactos
  const ci=document.getElementById('contactosInfo')
  ci.innerHTML=`
    ${c.email?`<span style="display:flex;align-items:center;gap:7px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${escH(c.email)}</span>`:''}
    ${c.tel?`<span style="display:flex;align-items:center;gap:7px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.82-.74a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17z"/></svg>${escH(c.tel)}</span>`:''}
    ${c.morada?`<span style="display:flex;align-items:center;gap:7px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escH(c.morada)}</span>`:''}
  `

  // TAB: Documentos
  const docs=documentos[id]||[]
  document.getElementById('docCount').textContent=docs.length
  const dt=document.getElementById('docTableWrap')
  if(docs.length===0){
    dt.innerHTML='<p style="color:var(--t3);font-size:.82rem;padding:10px 0">Sem documentos carregados.</p>'
  } else {
    dt.innerHTML=`<table class="doc-tbl">
      <thead><tr><th>Nome do documento</th><th>Tipo</th><th>Data</th><th>Tamanho</th><th></th></tr></thead>
      <tbody>${docs.map(d=>`
        <tr>
          <td><div class="doc-nc"><span class="doc-ext de-${d.ext}">${d.ext.toUpperCase()}</span>${escH(d.nome)}</div></td>
          <td style="color:var(--t3)">${escH(d.tipo)}</td>
          <td>${escH(d.data)}</td>
          <td style="color:var(--t3)">${escH(d.tam)}</td>
          <td><div class="user-menu"><button class="ico-btn user-menu-trigger"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="user-menu-dropdown"><button class="umd-item umd-signout" onclick="confirmarApagarDoc('${d.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Apagar documento</button></div></div></td>
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
    flds.innerHTML='<p style="font-size:.78rem;color:var(--t2)">Não foi possível extrair campos. Preenche manualmente.</p>'
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
  if(!nome){erroCampo('cNome','Nome é obrigatório.');ok=false}
  if(!validarNIF(nif)){erroCampo('cNIF','NIF inválido — deve ter 9 dígitos.');ok=false}
  if(!validarEmail(email)){erroCampo('cEmail','Email inválido.');ok=false}
  if(!ok) return
  const { data, error } = await db.from('clients').insert({
    name: nome,
    nif: nif||null,
    email: email||null,
    phone: document.getElementById('cTel').value.trim()||null,
    address: document.getElementById('cMorada').value.trim()||null,
    client_since: document.getElementById('cSince').value||null,
  }).select().single()
  if(error){erroGeral('modalCl','Erro ao guardar. Tenta novamente.');return}
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
      el.style.cssText='font-size:.78rem;color:var(--red);background:var(--red-lt);border-radius:var(--rsm);padding:6px 10px;margin-top:8px'
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
  document.getElementById('mrUploadZone').style.opacity='.5'
  document.getElementById('mrUploadZone').style.pointerEvents='none'
  document.getElementById('mrProcessing').style.display='block'
  document.getElementById('mrExtractedBanner').style.display='none'

  const reader=new FileReader()
  reader.onload=async ev=>{
    const base64=ev.target.result.split(',')[1]
    const mimeType=file.type||'application/octet-stream'
    try {
      const res=await fetch('/.netlify/functions/extract-recibo',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({fileBase64:base64,mimeType})
      })
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
      <div style="width:36px;height:36px;background:var(--blue-lt);border-radius:var(--rsm);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div style="flex:1;text-align:left;min-width:0">
        <div style="font-size:.84rem;font-weight:600;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escH(filename)}</div>
        <div style="font-size:.73rem;color:var(--t3)">Carregado com sucesso</div>
      </div>
      <button onclick="resetReciboUpload()" style="font-size:.75rem;color:var(--t3);background:none;border:none;cursor:pointer;padding:4px">Alterar</button>
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
    <div style="width:40px;height:40px;background:var(--blue-lt);border-radius:var(--r);display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
    </div>
    <div style="font-size:.88rem;font-weight:600;color:var(--blue);margin-bottom:3px">Carregar recibo verde</div>
    <div style="font-size:.75rem;color:var(--t3)">Arrasta ou clica para selecionar · PDF, imagem ou Word</div>
    <div style="margin-top:10px">
      <span style="font-size:.72rem;background:var(--blue-lt);color:var(--blue);border-radius:99px;padding:3px 10px;font-weight:600">Preenche os campos automaticamente</span>
    </div>`
  document.getElementById('mrUploadZone').onclick=()=>document.getElementById('mrFileInput').click()
  document.getElementById('mrExtractedBanner').style.display='none'
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
  uz.style.borderColor='var(--border2)'
  uz.style.background='var(--bg)'
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
  if(!nome){erroCampo('mdNome','Nome do documento é obrigatório.');ok=false}
  if(!clienteId){erroCampo('mdCliente','Seleciona um cliente.');ok=false}
  if(!ok) return
  const { data, error } = await db.from('documents').insert({
    client_id: clienteId,
    name: nome,
    type: tipo,
    url: null,
  }).select().single()
  if(error){erroGeral('modalDoc','Erro ao guardar. Tenta novamente.');return}
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
    let err=document.getElementById('calcEstErr')
    if(!err){
      err=document.createElement('span')
      err.id='calcEstErr'
      err.style.cssText='font-size:.75rem;color:var(--red);margin-left:10px'
      err.setAttribute('role','alert')
      document.getElementById('lastCalcTime').parentElement.appendChild(err)
    }
    err.textContent='Preenche o teu rendimento no perfil antes de calcular.'
    err.style.display='inline'
    setTimeout(()=>{err.style.display='none'},4000)
    return
  }
  const calcErr=document.getElementById('calcEstErr'); if(calcErr) calcErr.style.display='none'

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
  if(pivEl) pivEl.style.color=pIVA>=90?'var(--red)':pIVA>=70?'var(--amber)':'var(--green)'
  setW('eBIVA',pIVA)
  const bivaEl=document.getElementById('eBIVA')
  if(bivaEl) bivaEl.className='pg-fill '+(pIVA>=90?'r':pIVA>=70?'a':'g')
  set('eLIVA',`${f0(tot)} de ${f0(LIMITE_IVA)}`); set('eRIVA',`Restam ${f0(LIMITE_IVA-tot)}`)
  const rivaEl=document.getElementById('eRIVA')
  if(rivaEl) rivaEl.style.color=pIVA>=70?'var(--amber)':'var(--green)'
  set('ePRS',fp(pRS)); setW('eBRS',pRS)
  set('eLRS',`${f0(tot)} de ${f0(LIMITE_RS)}`); set('eRRS',`Restam ${f0(LIMITE_RS-tot)}`)

  const ra=r*12,da=d*12,ia=irs*12,sa=ss*12,la=Math.max(0,ra-ia-sa-da)
  set('bTot',f2(ra)); set('bDesp',`(${f2(da)})`); set('bTrib',f2(ra-da))
  set('bIRS',`(${f2(ia)})`); set('bSS',ss===0?'€0 (Isento)':`(${f2(sa)})`); set('bLiq',f2(la))
  set('dCV',f0(la))

  // Timestamp
  const ts=document.getElementById('lastCalcTime')
  if(ts) ts.textContent=`Calculado às ${new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})}`

  // Recommendations
  const recs=[]
  if(pIVA>=90) recs.push({icon:'alert-triangle',cls:'bg-r',tag:'Urgente',label:'rt-warn',title:'Limite de IVA quase atingido',desc:`Faturaste ${fp(pIVA)} do limite de isenção (€14.500).`})
  else if(pIVA>=70) recs.push({icon:'alert-circle',cls:'bg-a',tag:'Atenção',label:'rt-warn',title:'Aproximas-te do limite de IVA',desc:`Estás a ${fp(pIVA)} do limite. Continua a acompanhar.`})
  if(ss===0&&tco) recs.push({icon:'shield',cls:'bg-g',tag:'Informação',label:'rt-info',title:'Isenção de SS ativa',desc:`O teu rendimento relevante está abaixo de €2.090/mês. Mantém o controlo.`})
  if(ss>0&&tco) recs.push({icon:'trending-up',cls:'bg-a',tag:'Atenção',label:'rt-warn',title:'Passaste o limiar de isenção SS',desc:`Pagas SS sobre o excedente (${f0(ss)}/mês).`})
  recs.push({icon:'briefcase',cls:'bg-b',tag:'Sugestão',label:'rt-sug',title:'Rever despesas dedutíveis',desc:'Podes deduzir despesas de software, formação e equipamento.'})

  const svgIcons={
    'alert-triangle':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    'alert-circle':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/></svg>',
    'shield':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'trending-up':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    'briefcase':'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
  }
  const rlEl=document.getElementById('recList')
  if(rlEl) rlEl.innerHTML=recs.map(rc=>`
    <div class="rec-item">
      <div class="rec-ico ${rc.cls}">${svgIcons[rc.icon]||''}</div>
      <div class="rec-body"><div class="rec-title">${rc.title}</div><div class="rec-desc">${rc.desc}</div></div>
      <span class="rec-tag ${rc.label}">${rc.tag}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" style="flex-shrink:0;margin-left:4px"><polyline points="9 18 15 12 9 6"/></svg>
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
  if(!clienteId){erroCampo('mrCliente','Seleciona um cliente.');ok=false}
  if(valor<=0){erroCampo('mrValor','Introduz um valor válido.');ok=false}
  if(!dataVal){erroCampo('mrData','Seleciona a data do recibo.');ok=false}
  if(!ok) return
  const { data, error } = await db.from('invoices').insert({
    client_id: clienteId,
    invoice_number: num,
    date: dataVal,
    description: desc,
    amount: valor,
    status: estado,
  }).select().single()
  if(error){erroGeral('modalRecibo','Erro ao guardar. Tenta novamente.');return}
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
  if(error){erroGeral('modalApagarCl','Erro ao apagar. Tenta novamente.');return}
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
  if(error){erroGeral('modalApagarRecibo','Erro ao apagar. Tenta novamente.');return}
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
  if(error){erroGeral('modalApagarDoc','Erro ao apagar. Tenta novamente.');return}
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
  if(!nome){erroCampo('ecNome','Nome é obrigatório.');ok=false}
  if(!validarNIF(nif)){erroCampo('ecNIF','NIF inválido — deve ter 9 dígitos.');ok=false}
  if(!validarEmail(email)){erroCampo('ecEmail','Email inválido.');ok=false}
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
  if(error){erroGeral('modalEditCl','Erro ao guardar. Tenta novamente.');return}
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
    events.push({type:'invoice',date:new Date(f.created_at),label:`Recibo ${f.invoice_number||'—'} · ${clNome}`,sub:f2(parseFloat(f.amount)||0)})
    if(f.updated_at){
      const statusLabel=f.status==='pago'?'marcado como pago':'marcado como pendente'
      events.push({type:'paid',date:new Date(f.updated_at),label:`Recibo ${f.invoice_number||'—'} ${statusLabel}`,sub:clNome})
    }
  })
  ;(rDocs||[]).forEach(d=>{
    const cl=clientes.find(x=>x.id===d.client_id)
    events.push({type:'doc',date:new Date(d.created_at),label:d.name||'—',sub:cl?cl.nome:'—'})
  })
  events.sort((a,b)=>b.date-a.date)
  const top=events.slice(0,6)
  const icoCl=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  const icoInv=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
  const icoDoc=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`
  const icoPaid=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
  const icoMap={client:icoCl,invoice:icoInv,doc:icoDoc,paid:icoPaid}
  const clsMap={client:'ai-cl',invoice:'ai-inv',doc:'ai-doc',paid:'ai-inv'}
  el.innerHTML=top.length===0
    ?'<p style="color:var(--t3);font-size:.82rem;padding:8px 0">Sem atividade recente.</p>'
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
    return `<div class="cal-item"><div class="cal-dt"><div class="cal-mo">${mes}</div><div class="cal-d">${dia}</div></div><div class="cal-info"><div class="cal-ev">${o.ev}</div><div class="cal-dc">${o.dc}</div></div><div style="text-align:right;flex-shrink:0"><div class="cal-tag ${tagCls}">${tagText}</div><div style="font-size:.71rem;color:var(--t3);margin-top:4px;white-space:nowrap">${rangeText}</div></div></div>`
  }).join('')
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
