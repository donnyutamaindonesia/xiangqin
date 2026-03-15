import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DateRatingModal from '../components/DateRatingModal'

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

interface DateRecord {
  id: string
  user_a: string
  user_b: string
  restaurant_name: string
  package_name: string
  package_price: number
  status: string
}

interface Restaurant {
  id: string
  name: string
  packages: { id: string; name: string; price: number }[]
}

interface Props {
  myId: string
}

const RANK_EMOJI: Record<string, string> = {
  '青铜': '🥉', '白银': '🥈', '黄金': '🥇',
  '铂金': '💿', '钻石': '💎', '黑金': '🖤',
}

export default function Messages({ myId }: Props) {
  const [contacts, setContacts] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [showDateInvite, setShowDateInvite] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [pendingDate, setPendingDate] = useState<DateRecord | null>(null)
  const [ratingDate, setRatingDate] = useState<DateRecord | null>(null)

  // 加载匹配联系人
  useEffect(() => {
    const load = async () => {
      const { data: iLiked } = await supabase.from('likes').select('to_user').eq('from_user', myId)
      const { data: likedMe } = await supabase.from('likes').select('from_user').eq('to_user', myId)
      const matchIds = (iLiked?.map(l => l.to_user) || [])
        .filter(id => (likedMe?.map(l => l.from_user) || []).includes(id))
      if (matchIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, name, gender, rank, exp').in('id', matchIds)
        setContacts(data || [])
      }
    }
    load()
  }, [myId])

  // 加载消息 + 实时订阅
  useEffect(() => {
    if (!selected) return
    const loadMsgs = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(from_user.eq.${myId},to_user.eq.${selected.id}),and(from_user.eq.${selected.id},to_user.eq.${myId})`)
        .order('created_at')
      setMessages(data || [])
    }
    loadMsgs()

    const channel = supabase
      .channel('msgs-' + selected.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadMsgs)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected, myId])

  // 加载待确认约会
  useEffect(() => {
    if (!selected) return
    loadPendingDate()
  }, [selected, myId])

  const loadPendingDate = async () => {
    if (!selected) return
    const { data } = await supabase
      .from('dates')
      .select('*')
      .or(`and(user_a.eq.${myId},user_b.eq.${selected.id}),and(user_a.eq.${selected.id},user_b.eq.${myId})`)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setPendingDate(data)
  }

  // 加载餐厅
  useEffect(() => {
    supabase.from('restaurants').select('*, packages(*)').eq('is_active', true)
      .then(({ data }) => setRestaurants(data || []))
  }, [])

  const send = async () => {
    if (!text.trim() || !selected) return
    await supabase.from('messages').insert({ from_user: myId, to_user: selected.id, content: text })
    setText('')
  }

  const sendDateInvite = async (
    restaurantId: string, restaurantName: string,
    packageId: string, packageName: string, price: number
  ) => {
    if (!selected) return
    // 创建约会记录
    await supabase.from('dates').insert({
      user_a: myId,
      user_b: selected.id,
      restaurant_id: restaurantId,
      package_id: packageId,
      restaurant_name: restaurantName,
      package_name: packageName,
      package_price: price,
      status: 'pending',
    })
    // 发送消息通知
    await supabase.from('messages').insert({
      from_user: myId,
      to_user: selected.id,
      content: `💌 约会邀请：想约你去【${restaurantName}】，套餐：${packageName}（¥${price}/位）`,
    })
    setShowDateInvite(false)
    loadPendingDate()
  }

  const acceptDate = async () => {
    if (!pendingDate || !selected) return
    // 调用服务端函数：更新状态 + 双方 +50 EXP
    await supabase.rpc('confirm_date', { p_date_id: pendingDate.id, p_confirmer_id: myId })
    // 发送确认消息
    await supabase.from('messages').insert({
      from_user: myId,
      to_user: selected.id,
      content: `✅ 我接受了约会邀请！期待在【${pendingDate.restaurant_name}】见面 🎉`,
    })
    loadPendingDate()
  }

  const declineDate = async () => {
    if (!pendingDate || !selected) return
    await supabase.from('dates').update({ status: 'cancelled' }).eq('id', pendingDate.id)
    await supabase.from('messages').insert({
      from_user: myId,
      to_user: selected.id,
      content: `😅 这次不太方便，下次再约吧`,
    })
    loadPendingDate()
  }

  const markCompleted = async () => {
    if (!pendingDate) return
    await supabase.from('dates').update({ status: 'completed' }).eq('id', pendingDate.id)
    setRatingDate(pendingDate)
    setPendingDate(null)
  }

  return (
    <div className="messages-page">
      {ratingDate && selected && (
        <DateRatingModal
          dateId={ratingDate.id}
          targetName={selected.name}
          targetGender={selected.gender}
          myId={myId}
          onDone={() => setRatingDate(null)}
        />
      )}

      {!selected ? (
        <div className="contacts-list">
          <h2>我的缘分</h2>
          {contacts.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 50 }}>🔒</div>
              <p>互相感兴趣才能聊天</p>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>去发现页给喜欢的人点 ♥</p>
            </div>
          ) : (
            contacts.map(c => (
              <div key={c.id} className="contact-item" onClick={() => setSelected(c)}>
                <div className="contact-avatar">{c.gender === 'female' ? '👩' : '👨'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 2 }}>
                    {RANK_EMOJI[c.rank] || '🥉'} {c.rank}
                  </div>
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
            <span style={{ fontSize: 12, color: 'var(--gold)', marginLeft: 'auto' }}>
              {RANK_EMOJI[selected.rank]} {selected.rank}
            </span>
          </div>

          {/* 待处理约会横幅 */}
          {pendingDate && (
            <div className={`date-banner ${pendingDate.status}`}>
              <div className="date-banner-info">
                <span className="date-banner-icon">
                  {pendingDate.status === 'pending' ? '💌' : pendingDate.status === 'confirmed' ? '✅' : '🎉'}
                </span>
                <div>
                  <div className="date-banner-title">
                    {pendingDate.status === 'pending'
                      ? (pendingDate.user_a === myId ? '约会邀请已发出' : '收到约会邀请')
                      : pendingDate.status === 'confirmed' ? '约会已确认 🎉'
                      : '约会进行中'}
                  </div>
                  <div className="date-banner-detail">
                    {pendingDate.restaurant_name} · {pendingDate.package_name} · ¥{pendingDate.package_price}/位
                  </div>
                </div>
              </div>
              {pendingDate.status === 'pending' && pendingDate.user_b === myId && (
                <div className="date-banner-btns">
                  <button className="date-accept" onClick={acceptDate}>接受</button>
                  <button className="date-decline" onClick={declineDate}>婉拒</button>
                </div>
              )}
              {pendingDate.status === 'confirmed' && (
                <button className="date-done" onClick={markCompleted}>约会完成</button>
              )}
            </div>
          )}

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
              {restaurants.length === 0 && (
                <p style={{ color: 'var(--text3)', fontSize: 13 }}>暂无合作餐厅，请联系管理员添加</p>
              )}
              {restaurants.map(r => (
                <div key={r.id}>
                  {r.packages?.map(p => (
                    <div
                      key={p.id}
                      className="invite-option"
                      onClick={() => sendDateInvite(r.id, r.name, p.id, p.name, p.price)}
                    >
                      <span>🍽️ {r.name} · {p.name}</span>
                      <span>¥{p.price}/位</span>
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
