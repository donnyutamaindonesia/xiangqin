import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  name: string
  gender: string
  rank: string
  exp: number
}

interface Message {
  id: string
  from_user: string
  to_user: string
  content: string
  created_at: string
}

interface Restaurant {
  id: string
  name: string
  packages: { id: string; name: string; price: number }[]
}

interface Props {
  myId: string
}

export default function Messages({ myId }: Props) {
  const [contacts, setContacts] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [showDateInvite, setShowDateInvite] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: iLiked } = await supabase.from('likes').select('to_user').eq('from_user', myId)
      const { data: likedMe } = await supabase.from('likes').select('from_user').eq('to_user', myId)
      const iLikedIds = iLiked?.map(l => l.to_user) || []
      const likedMeIds = likedMe?.map(l => l.from_user) || []
      const matchIds = iLikedIds.filter(id => likedMeIds.includes(id))
      if (matchIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, name, gender, rank, exp').in('id', matchIds)
        setContacts(data || [])
      }
    }
    load()
  }, [myId])

  useEffect(() => {
    if (!selected) return
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(from_user.eq.${myId},to_user.eq.${selected.id}),and(from_user.eq.${selected.id},to_user.eq.${myId})`)
        .order('created_at')
      setMessages(data || [])
    }
    load()
    const channel = supabase
      .channel('messages-' + selected.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selected, myId])

  useEffect(() => {
    supabase.from('restaurants').select('*, packages(*)').eq('is_active', true)
      .then(({ data }) => setRestaurants(data || []))
  }, [])

  const send = async () => {
    if (!text.trim() || !selected) return
    await supabase.from('messages').insert({ from_user: myId, to_user: selected.id, content: text })
    setText('')
  }

  const sendDateInvite = async (restaurantName: string, packageName: string, price: number) => {
    if (!selected) return
    const content = `💌 约会邀请：我想约你去【${restaurantName}】，套餐：${packageName}（¥${price}/位），你愿意吗？`
    await supabase.from('messages').insert({ from_user: myId, to_user: selected.id, content })
    setShowDateInvite(false)
  }

  const getRankEmoji = (rank: string) => {
    const map: Record<string, string> = { '青铜': '🥉', '白银': '🥈', '黄金': '🥇', '铂金': '💿', '钻石': '💎', '黑金': '🖤' }
    return map[rank] || '🥉'
  }

  return (
    <div className="messages-page">
      {!selected ? (
        <div className="contacts-list">
          <h2>💌 我的缘分</h2>
          {contacts.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 50 }}>🔒</div>
              <p>互相感兴趣才能聊天</p>
              <p style={{ fontSize: 13, color: '#aaa' }}>去浏览页面给喜欢的人点💕</p>
            </div>
          ) : (
            contacts.map(c => (
              <div key={c.id} className="contact-item" onClick={() => setSelected(c)}>
                <div className="contact-avatar">{c.gender === 'female' ? '👩' : '👨'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#e8547a' }}>{getRankEmoji(c.rank)} {c.rank}</div>
                </div>
                <span className="contact-arrow">›</span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="chat-view">
          <div className="chat-header">
            <button onClick={() => setSelected(null)}>‹</button>
            <span>{selected.gender === 'female' ? '👩' : '👨'} {selected.name}</span>
            <span style={{ fontSize: 12, color: '#e8547a', marginLeft: 'auto' }}>{getRankEmoji(selected.rank)} {selected.rank}</span>
          </div>

          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`msg ${m.from_user === myId ? 'mine' : 'theirs'}`}>
                <div className="msg-bubble">{m.content}</div>
              </div>
            ))}
          </div>

          {showDateInvite && (
            <div className="date-invite-panel">
              <p>选择约会餐厅</p>
              {restaurants.map(r => (
                <div key={r.id}>
                  {r.packages?.map(p => (
                    <div key={p.id} className="invite-option" onClick={() => sendDateInvite(r.name, p.name, p.price)}>
                      <span>🍽️ {r.name}</span>
                      <span>{p.name} · ¥{p.price}/位</span>
                    </div>
                  ))}
                </div>
              ))}
              <button className="cancel-btn" onClick={() => setShowDateInvite(false)}>取消</button>
            </div>
          )}

          <div className="chat-input">
            <button className="invite-btn" onClick={() => setShowDateInvite(!showDateInvite)} title="发起约会">🍽️</button>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="说点什么..."
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button onClick={send}>发送</button>
          </div>
        </div>
      )}
    </div>
  )
}
