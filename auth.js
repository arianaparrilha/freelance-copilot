async function signIn(email, password) {
  return await db.auth.signInWithPassword({ email, password })
}

async function signUp(email, password) {
  return await db.auth.signUp({ email, password })
}

async function signOut() {
  await db.auth.signOut()
  window.location.href = '/login'
}

async function getUser() {
  const { data: { user } } = await db.auth.getUser()
  return user
}

async function requireAuth() {
  const user = await getUser()
  if (!user) window.location.href = '/login'
  return user
}
