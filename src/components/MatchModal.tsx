interface Profile {
  id: string
  name: string
  gender: string
  age: number
  occupation?: string
}

interface Props {
  matched: Profile
  onClose: () => void
  onMessage: () => void
}

export default function MatchModal({ matched, onClose, onMessage }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={e => e.stopPropagation()}>
        <div className="match-hearts">💕</div>
        <h2 className="match-title">缘分到了！</h2>
        <p className="match-sub">你和 <strong>{matched.name}</strong> 互相感兴趣</p>

        <div className="match-avatars">
          <div className="match-avatar">💘</div>
          <div className="match-avatar-other">
            {matched.gender === 'female' ? '👩' : '👨'}
          </div>
        </div>

        <div className="match-info">
          <span>{matched.age}岁</span>
          {matched.occupation && <span>{matched.occupation}</span>}
        </div>

        <button className="match-btn-primary" onClick={onMessage}>
          💌 发第一句话
        </button>
        <button className="match-btn-secondary" onClick={onClose}>
          继续浏览
        </button>
      </div>
    </div>
  )
}
