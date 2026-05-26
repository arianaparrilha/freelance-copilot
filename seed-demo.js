// One-time demo data seed script
// Run: DEMO_EMAIL=demo@fiscalcopilot.pt DEMO_PASSWORD=yourpassword node seed-demo.js

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tcpgumflmkgdjbowkljh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_oPzuh9Z0bgP_VzXpB_2G-g_vl7uKIqH'

const email = process.env.DEMO_EMAIL
const password = process.env.DEMO_PASSWORD

if (!email || !password) {
  console.error('Set DEMO_EMAIL and DEMO_PASSWORD environment variables.')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function seed() {
  // Sign in as demo user
  const { error: authErr } = await db.auth.signInWithPassword({ email, password })
  if (authErr) { console.error('Auth failed:', authErr.message); process.exit(1) }
  console.log('Signed in as demo user.')

  // Abort if data already exists
  const { data: existing } = await db.from('clients').select('id').limit(1)
  if (existing && existing.length > 0) {
    console.log('Demo data already exists — skipping.')
    process.exit(0)
  }

  // ── Clients ──────────────────────────────────────────────
  const { data: clients, error: clErr } = await db.from('clients').insert([
    {
      name: 'Empresa Exemplo, Lda',
      nif: '508123456',
      email: 'geral@empresaexemplo.pt',
      phone: '+351 21 000 0000',
      address: 'Av. da Liberdade 110, 1269-046 Lisboa',
      client_since: '2024-01-15',
    },
    {
      name: 'StartupXYZ, Lda',
      nif: '509876543',
      email: 'financeiro@startupxyz.pt',
      phone: '+351 91 234 5678',
      address: 'Rua do Ouro 25, 4000-123 Porto',
      client_since: '2024-06-01',
    },
    {
      name: 'João Silva',
      nif: '123456789',
      email: 'joao.silva@email.pt',
      phone: '+351 96 555 4321',
      address: 'Rua das Flores 8, 2700-001 Amadora',
      client_since: '2025-01-10',
    },
  ]).select()

  if (clErr) { console.error('Clients insert failed:', clErr.message); process.exit(1) }
  console.log('Clients created.')

  const [c1, c2, c3] = clients

  // ── Invoices ─────────────────────────────────────────────
  const { error: invErr } = await db.from('invoices').insert([
    // Empresa Exemplo
    { client_id: c1.id, invoice_number: '2025/001', date: '2025-01-20', description: 'Consultoria UX — Janeiro 2025', amount: 1200.00, status: 'pago' },
    { client_id: c1.id, invoice_number: '2025/003', date: '2025-03-18', description: 'Consultoria UX — Março 2025', amount: 1500.00, status: 'pago' },
    { client_id: c1.id, invoice_number: '2025/006', date: '2025-05-05', description: 'Consultoria UX — Maio 2025', amount: 1800.00, status: 'pago' },
    // StartupXYZ
    { client_id: c2.id, invoice_number: '2025/002', date: '2025-02-10', description: 'Design de produto — Sprint 1', amount: 800.00, status: 'pago' },
    { client_id: c2.id, invoice_number: '2025/004', date: '2025-04-22', description: 'Design de produto — Sprint 2', amount: 950.00, status: 'pago' },
    { client_id: c2.id, invoice_number: '2025/007', date: '2025-05-30', description: 'Design de produto — Sprint 3', amount: 950.00, status: 'pendente' },
    // João Silva
    { client_id: c3.id, invoice_number: '2025/005', date: '2025-04-05', description: 'Sessão de mentoria — Abril', amount: 300.00, status: 'pago' },
    { client_id: c3.id, invoice_number: '2025/008', date: '2025-05-20', description: 'Sessão de mentoria — Maio', amount: 300.00, status: 'pendente' },
  ])

  if (invErr) { console.error('Invoices insert failed:', invErr.message); process.exit(1) }
  console.log('Invoices created.')

  console.log('\nSeed complete! Total faturado: €7.800 (€6.550 pago, €1.250 pendente)')
}

seed()
