import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import SetupProfile from './pages/SetupProfile'
import Browse from './pages/Browse'
import Messages from './pages/Messages'
import Restaurants from './pages/Restaurants'
import './App.css'

type Tab = 'browse' | 'messages' | 'restaurants' | 'profile'

function getRankEmoji(rank: string) {
  const map: Record<string, string> = {
    '青铜': '🥉', '白银': '🥈', '黄金': '🥇',
    '铂金': '💿', '钻石': '💎', '黑金': '🖤'
  }
  return map[rank] || '🥉'
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('browse')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null)
        setProfile(null)
      } else if (session) {
        setUserId(session.user.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => setProfile(data))
  }, [userId])

  if (loading) return <div className="loading">💑</div>
  if (!userId) return <Auth />
  if (!profile) return <SetupProfile userId={userId} onDone={() => {
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => setProfile(data))
  }} />

  return (
    <div className="app">
      <header className="top-bar">
        <div className="logo">💎 芯约会</div>
        <button className="logout-btn" onClick={() => supabase.auth.signOut()}>退出</button>
      </header>

      <main className="main-content">
        {tab === 'browse' && <Browse myId={userId} myGender={profile.gender} />}
        {tab === 'messages' && <Messages myId={userId} />}
        {tab === 'restaurants' && <Restaurants />}
        {tab === 'profile' && (
          <div className="my-profile">
            <div className="profile-avatar">{profile.gender === 'female' ? '👩' : '👨'}</div>
            <h2>{profile.name}</h2>
            <div className="rank-badge rank-{profile.rank || '青铜'}">
              {getRankEmoji(profile.rank)} {profile.rank || '青铜'} · {profile.exp || 0} EXP
            </div>
            <div className="profile-tags">
              <span>🎂 {profile.age}岁</span>
              {profile.occupation && <span>💼 {profile.occupation}</span>}
              {profile.height && <span>📏 {profile.height}cm</span>}
              {profile.income && <span>💰 {profile.income}</span>}
              {profile.housing && <span>🏠 {profile.housing}</span>}
            </div>
            {profile.bio && <p className="profile-bio">"{profile.bio}"</p>}
            <div className="rank-progress">
              <p>约会次数：{profile.total_dates || 0} 次</p>
              <p>累计消费：¥{profile.total_spend || 0}</p>
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={tab === 'browse' ? 'active' : ''} onClick={() => setTab('browse')}>
          <span>💘</span><small>发现</small>
        </button>
        <button className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}>
          <span>💌</span><small>消息</small>
        </button>
        <button className={tab === 'restaurants' ? 'active' : ''} onClick={() => setTab('restaurants')}>
          <span>🍽️</span><small>约饭</small>
        </button>
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
          <span>👤</span><small>我的</small>
        </button>
      </nav>
    </div>
  )
}
