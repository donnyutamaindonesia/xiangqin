import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  name: string
  gender: string
}

interface Message {
  id: string
  from_user: string
  to_user: string
  content: string
  created_at: string
}

interface Props {
  myId: string
}

export default function Messages({ myId }: Props) {
  const [contacts, setContacts] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')

  // 获取互相喜欢的人（匹配）
  useEffect(() => {
    const load = async () => {
      const { data: iLiked } = await supabase.from('likes').select('to_user').eq('from_user', myId)
      const { data: likedMe } = await supabase.from('likes').select('from_user').eq('to_user', myId)

      const iLikedIds = iLiked?.map(l => l.to_user) || []
      const likedMeIds = likedMe?.map(l => l.from_user) || []
      const matchIds = iLikedIds.filter(id => likedMeIds.includes(id))

      if (matchIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, name, gender').in('id', matchIds)
        setContacts(data || [])
      }
    }
    load()
  }, [myId])

  // 加载消息
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

    // 实时监听
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected, myId])

  const send = async () => {
    if (!text.trim() || !selected) return
    await supabase.from('messages').insert({ from_user: myId, to_user: selected.id, content: text })
    setText('')
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
                <span>{c.name}</span>
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
          </div>
          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`msg ${m.from_user === myId ? 'mine' : 'theirs'}`}>
                <div className="msg-bubble">{m.content}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
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
