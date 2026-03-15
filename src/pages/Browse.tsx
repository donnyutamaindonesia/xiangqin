import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  name: string
  age: number
  gender: string
  occupation: string
  height: number
  income: string
  housing: string
  bio: string
  photos: string[]
  rank?: string
}

interface Props {
  myId: string
  myGender: string
}

// 占位背景图（按性别+序号确定，给没上传照片的用户）
const FEMALE_PHOTOS = [
  'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80',
]
const MALE_PHOTOS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80',
]

const RANK_COLOR: Record<string, string> = {
  '青铜': '#cd7f32', '白银': '#c0c0c0', '黄金': '#ffd700',
  '铂金': '#e5e4e2', '钻石': '#b9f2ff', '黑金': '#1a1a1a',
}

export default function Browse({ myId, myGender }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    const targetGender = myGender === 'male' ? 'female' : 'male'
    supabase
      .from('profiles')
      .select('*')
      .eq('gender', targetGender)
      .neq('id', myId)
      .then(({ data }) => setProfiles(data || []))
  }, [myId, myGender])

  const current = profiles[index]

  const getPhoto = (p: Profile, idx: number) => {
    if (p.photos?.[0]) return p.photos[0]
    const arr = p.gender === 'female' ? FEMALE_PHOTOS : MALE_PHOTOS
    return arr[idx % arr.length]
  }

  const sendLike = async () => {
    if (!current) return
    await supabase.from('likes').insert({ from_user: myId, to_user: current.id })
    setLiked(true)
    setTimeout(() => { setLiked(false); setIndex(i => i + 1) }, 700)
  }

  const skip = () => {
    setSkipped(true)
    setTimeout(() => { setSkipped(false); setIndex(i => i + 1) }, 400)
  }

  if (!current) return (
    <div className="empty-browse">
      <div className="empty-icon">✨</div>
      <h3>今日缘分已尽</h3>
      <p>稍后会有新的缘分出现</p>
    </div>
  )

  const photo = getPhoto(current, index)
  const rank = current.rank || '青铜'

  return (
    <div className="browse-wrap">
      <div className={`swipe-card ${liked ? 'anim-like' : ''} ${skipped ? 'anim-skip' : ''}`}>
        {/* 全屏照片 */}
        <div className="swipe-photo" style={{ backgroundImage: `url(${photo})` }}>
          {/* 顶部段位标 */}
          <div className="swipe-rank" style={{ color: RANK_COLOR[rank] || '#ffd700' }}>
            {rank}
          </div>

          {/* 底部渐变信息层 */}
          <div className="swipe-overlay">
            <div className="swipe-name">
              {current.name}
              <span className="swipe-age">{current.age}岁</span>
            </div>
            {current.occupation && (
              <div className="swipe-occ">{current.occupation}</div>
            )}
            <div className="swipe-tags">
              {current.height && <span>{current.height}cm</span>}
              {current.income && <span>{current.income}</span>}
              {current.housing && <span>{current.housing}</span>}
            </div>
            {current.bio && (
              <p className="swipe-bio">"{current.bio}"</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="swipe-actions">
          <button className="btn-skip" onClick={skip}>
            <span>✕</span>
            <small>跳过</small>
          </button>
          <button className="btn-like" onClick={sendLike}>
            <span>♥</span>
            <small>喜欢</small>
          </button>
        </div>
      </div>

      {/* 进度提示 */}
      <div className="browse-progress">
        {profiles.slice(0, 5).map((_, i) => (
          <div key={i} className={`progress-dot ${i === index ? 'active' : i < index ? 'done' : ''}`} />
        ))}
      </div>
    </div>
  )
}
