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
}

interface Props {
  myId: string
  myGender: string
}

export default function Browse({ myId, myGender }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState(false)

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

  const sendLike = async () => {
    if (!current) return
    await supabase.from('likes').insert({ from_user: myId, to_user: current.id })
    setLiked(true)
    setTimeout(() => {
      setLiked(false)
      setIndex(i => i + 1)
    }, 800)
  }

  const skip = () => setIndex(i => i + 1)

  if (!current) return (
    <div className="empty-state">
      <div style={{ fontSize: 60 }}>💤</div>
      <p>暂时没有更多人了，稍后再来看看</p>
    </div>
  )

  return (
    <div className="browse-page">
      <div className={`profile-card ${liked ? 'liked-anim' : ''}`}>
        <div className="profile-photo">
          {current.photos?.[0]
            ? <img src={current.photos[0]} alt={current.name} />
            : <div className="photo-placeholder">{current.gender === 'female' ? '👩' : '👨'}</div>
          }
          <div className="profile-badge">{current.age}岁</div>
        </div>

        <div className="profile-info">
          <h2>{current.name}</h2>
          <div className="profile-tags">
            {current.occupation && <span>💼 {current.occupation}</span>}
            {current.height && <span>📏 {current.height}cm</span>}
            {current.income && <span>💰 {current.income}</span>}
            {current.housing && <span>🏠 {current.housing}</span>}
          </div>
          {current.bio && <p className="profile-bio">"{current.bio}"</p>}
        </div>

        <div className="action-btns">
          <button className="skip-btn" onClick={skip}>👎 跳过</button>
          <button className="like-btn" onClick={sendLike}>💕 感兴趣</button>
        </div>
      </div>
    </div>
  )
}
