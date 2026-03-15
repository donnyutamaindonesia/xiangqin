import { getRankInfo, getNextRank, getRankProgress } from '../lib/rank'

interface Props {
  profile: {
    rank: string
    exp: number
    total_dates: number
  }
  onClose: () => void
  onGoDate: () => void
}

const RANK_PRIVILEGES: Record<string, string[]> = {
  '白银': ['优先出现在发现页', '查看谁喜欢了我', '"约会达人"徽章'],
  '黄金': ['解锁全部筛选条件', '约会历史记录', '"黄金单身"徽章'],
  '铂金': ['专属铂金标识', '优先客服支持', '"品质男士"徽章'],
  '钻石': ['钻石专属页面', '无限喜欢次数', '"钻石之选"徽章'],
  '黑金': ['顶级黑金标识', '专属线下活动', '"黑金传奇"徽章'],
}

export default function RankGuideModal({ profile, onClose, onGoDate }: Props) {
  const rank = profile.rank || '青铜'
  const rankInfo = getRankInfo(rank)
  const nextRank = getNextRank(rank)
  const progress = getRankProgress(profile.exp || 0, rank)
  const expNeeded = nextRank ? nextRank.minExp - (profile.exp || 0) : 0
  const privileges = nextRank ? (RANK_PRIVILEGES[nextRank.name] || []) : []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rank-guide-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h3 className="rank-guide-title">段位升级指南</h3>

        {/* 当前 → 下一段位 */}
        <div className="rank-route">
          <div className="rank-node current" style={{ color: rankInfo.color }}>
            <span className="rank-node-emoji">{rankInfo.emoji}</span>
            <span>{rank}</span>
          </div>
          <div className="rank-arrow">→</div>
          {nextRank ? (
            <div className="rank-node next" style={{ color: nextRank.color }}>
              <span className="rank-node-emoji">{nextRank.emoji}</span>
              <span>{nextRank.name}</span>
            </div>
          ) : (
            <div className="rank-node next" style={{ color: '#ffd700' }}>
              <span className="rank-node-emoji">👑</span>
              <span>已满级</span>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {nextRank && (
          <div className="rank-guide-progress">
            <div className="rank-guide-bar">
              <div className="rank-guide-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="rank-guide-exp">
              {profile.exp || 0} / {nextRank.minExp} EXP &nbsp;·&nbsp; 还差 <strong>{expNeeded}</strong> EXP
            </p>
          </div>
        )}

        <div className="rank-divider" />

        {/* 升级任务 */}
        <p className="rank-section-title">✨ 如何获得 EXP？</p>
        <div className="rank-tasks">
          <div className="rank-task">
            <span className="task-check">✅</span>
            <span className="task-name">完成一次约会</span>
            <span className="task-exp">+50 EXP</span>
          </div>
          <div className="rank-task">
            <span className="task-check">✅</span>
            <span className="task-name">女生给你打高分</span>
            <span className="task-exp">+20% 加成</span>
          </div>
          <div className="rank-task">
            <span className="task-check">✅</span>
            <span className="task-name">去新餐厅约会</span>
            <span className="task-exp">+10 EXP</span>
          </div>
          <div className="rank-task">
            <span className="task-check">✅</span>
            <span className="task-name">发布约会评价</span>
            <span className="task-exp">+5 EXP</span>
          </div>
        </div>

        {/* 下一段位特权 */}
        {nextRank && privileges.length > 0 && (
          <>
            <div className="rank-divider" />
            <p className="rank-section-title">🏆 {nextRank.name}特权</p>
            <ul className="rank-privileges">
              {privileges.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </>
        )}

        <div className="rank-guide-btns">
          <button className="rank-btn-date" onClick={onGoDate}>🍽️ 去约饭</button>
          <button className="rank-btn-close" onClick={onClose}>知道了</button>
        </div>
      </div>
    </div>
  )
}
