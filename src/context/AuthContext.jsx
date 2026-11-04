import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from './ThemeContext'
import { takePendingAvatar, uploadAvatar } from '../lib/avatar'

// Holds everything about the logged-in user:
//   session      - Supabase login session (null when logged out)
//   profile      - row from public.profiles
//   permissions  - array of permission keys, e.g. ['games.create', ...]
//   settings     - row from public.user_settings (theme + widgets)
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { setTheme } = useTheme()
  const [session, setSession] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [profile, setProfile] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [settings, setSettings] = useState(null)
  const [loadedUserId, setLoadedUserId] = useState(null)

  // Supabase tells us whenever the user logs in / out / refreshes their token.
  // (It also fires once right away with the current session.)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setSessionChecked(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? null
  const userEmail = session?.user?.email ?? null

  // Load profile, permissions and settings for the logged-in user
  const loadUserData = useCallback(async () => {
    if (!userId) return
    try {
      const [profileRes, rolesRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
      ])

      let prof = profileRes.data

      // If they picked a photo while signing up, upload it now that they're logged in
      if (prof && !prof.avatar_url) {
        const pendingBlob = await takePendingAvatar(userEmail)
        if (pendingBlob) {
          try {
            const url = await uploadAvatar(userId, pendingBlob)
            prof = { ...prof, avatar_url: url }
          } catch (err) {
            console.error('Avatar upload failed', err)
          }
        }
      }

      // roles -> permissions
      const roleNames = (rolesRes.data || []).map((r) => r.role)
      let perms = []
      if (roleNames.length > 0) {
        const { data } = await supabase
          .from('role_permissions')
          .select('permission')
          .in('role', roleNames)
        perms = [...new Set((data || []).map((p) => p.permission))]
      }

      setProfile(prof)
      setPermissions(perms)
      setSettings(settingsRes.data)
      if (settingsRes.data?.theme) setTheme(settingsRes.data.theme)
    } finally {
      setLoadedUserId(userId)
    }
  }, [userId, userEmail, setTheme])

  useEffect(() => {
    if (userId) {
      loadUserData()
    } else {
      setProfile(null)
      setPermissions([])
      setSettings(null)
      setLoadedUserId(null)
    }
  }, [userId, loadUserData])

  const hasPermission = useCallback((key) => permissions.includes(key), [permissions])

  // Change theme and remember it in the database (if logged in)
  const saveTheme = useCallback(
    async (newTheme) => {
      setTheme(newTheme)
      if (!userId) return
      setSettings((s) => (s ? { ...s, theme: newTheme } : s))
      await supabase
        .from('user_settings')
        .update({ theme: newTheme, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    },
    [userId, setTheme]
  )

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    permissions,
    settings,
    setSettings,
    // still working out who is logged in?
    loading: !sessionChecked || (userId !== null && loadedUserId !== userId),
    hasPermission,
    isAdmin: permissions.includes('admin.manage_all'),
    refreshProfile: loadUserData,
    saveTheme,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
