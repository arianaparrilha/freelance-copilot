const SUPABASE_URL = 'https://tcpgumflmkgdjbowkljh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_oPzuh9Z0bgP_VzXpB_2G-g_vl7uKIqH'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
