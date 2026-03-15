import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { getRankInfo, getNextRank, getRankProgress } from './lib/rank'
import Auth from './pages/Auth'
import SetupProfile from './pages/SetupProfile'
import Browse from './pages/Browse'
import Messages from './pages/Messages'
import Restaurants from './pages/Restaurants'
import Admin from './pages/Admin'
import RankGuideModal from './components/RankGuideModal'
import './App.css'

type Tab = 'browse' | 'messages' | 'restaurants' | 'profile' | 'admin'

export default function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('browse')
  const [loading, setLoading] = useState(true)
  const [showRankGuide, setShowRankGuide] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { setUserId(null); setProfile(null) }
      else if (session) setUserId(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    loadProfile()
  }, [userId])

  const loadProfile = () => {
    if (!userId) return
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => setProfile(data))
  }

  if (loading) return <div className="loading">💎</div>
  if (!userId) return <Auth />
  if (!profile) return <SetupProfile userId={userId} onDone={loadProfile} />
  if (editingProfile) return (
    <SetupProfile
      userId={userId}
      initialData={profile}
      onDone={() => { loadProfile(); setEditingProfile(false) }}
    />
  )

  const rank = profile.rank || '青铜'
  const rankInfo = getRankInfo(rank)
  const nextRank = getNextRank(rank)
  const progress = getRankProgress(profile.exp || 0, rank)

  return (
    <div className="app">
      {showRankGuide && (
        <RankGuideModal
          profile={{ rank, exp: profile.exp || 0, total_dates: profile.total_dates || 0 }}
          onClose={() => setShowRankGuide(false)}
          onGoDate={() => { setShowRankGuide(false); setTab('restaurants') }}
        />
      )}

      <header className="top-bar">
        <div className="logo">💎 芯约会</div>
        {profile.is_admin && (
          <button className="admin-entry" onClick={() => setTab('admin')}>⚙️</button>
        )}
        <button className="logout-btn" onClick={() => supabase.auth.signOut()}>退出</button>
      </header>

      <main className="main-content">
        {tab === 'browse' && (
          <Browse
            myId={userId}
            myGender={profile.gender}
            onGoMessages={() => setTab('messages')}
          />
        )}
        {tab === 'messages' && <Messages myId={userId} />}
        {tab === 'restaurants' && <Restaurants />}
        {tab === 'admin' && <Admin />}
        {tab === 'profile' && (
          <div className="my-profile">
            {/* ── 头像 + 段位区 ── */}
            <div className="profile-hero">
              <div className="profile-avatar">
                {profile.gender === 'female' ? '👩' : '👨'}
              </div>
              <h2 className="profile-name">{profile.name}</h2>
              <button
                className="rank-badge"
                style={{ background: `linear-gradient(135deg, ${rankInfo.color}33, ${rankInfo.color}66)`, borderColor: rankInfo.color + '55', color: rankInfo.color }}
                onClick={() => setShowRankGuide(true)}
              >
                {rankInfo.emoji} {rank} · {profile.exp || 0} EXP
              </button>
            </div>

            {/* ── EXP 进度条 ── */}
            {nextRank && (
              <div className="profile-progress-wrap" onClick={() => setShowRankGuide(true)}>
                <div className="rank-progress-labels">
                  <span>{rank}</span>
                  <span style={{ color: 'var(--gold)' }}>还差 {nextRank.minExp - (profile.exp || 0)} EXP → {nextRank.name}</span>
                </div>
                <div className="rank-bar">
                  <div className="rank-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="progress-hint">点击查看升级指南 →</p>
              </div>
            )}

            {/* ── 数据卡片 ── */}
            <div className="rank-stats">
              <div className="stat-item">
                <div className="stat-num">{profile.total_dates || 0}</div>
                <div className="stat-label">约会次数</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">¥{profile.total_spend || 0}</div>
                <div className="stat-label">累计消费</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">{profile.exp || 0}</div>
                <div className="stat-label">经验值</div>
              </div>
            </div>

            {/* ── 基本信息标签 ── */}
            <div className="profile-tags" style={{ marginTop: 20 }}>
              <span>🎂 {profile.age}岁</span>
              {profile.occupation && <span>💼 {profile.occupation}</span>}
              {profile.height && <span>📏 {profile.height}cm</span>}
              {profile.income && <span>💰 {profile.income}</span>}
              {profile.housing && <span>🏠 {profile.housing}</span>}
              {profile.food_preference && <span>🍜 {profile.food_preference}</span>}
            </div>

            {/* ── 个性标签 ── */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="profile-user-tags">
                {profile.tags.map((t: string, i: number) => (
                  <span key={i} className="user-tag">{t}</span>
                ))}
              </div>
            )}

            {/* ── 简介 ── */}
            {profile.bio && (
              <p className="profile-bio">"{profile.bio}"</p>
            )}

            {/* ── 操作按钮 ── */}
            <div className="profile-actions">
              <button className="profile-edit-btn" onClick={() => setEditingProfile(true)}>
                ✏️ 编辑资料
              </button>
              <button className="profile-date-btn" onClick={() => setTab('restaurants')}>
                🍽️ 去约饭
              </button>
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
