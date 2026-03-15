import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  dateId: string
  targetName: string
  targetGender: string
  myId: string
  onDone: () => void
}

const SCORE_LABELS = ['', '不想再见', '有点尴尬', '普通朋友', '大方得体', '绅士体贴']
const SCORE_EMOJIS = ['', '😬', '😅', '🙂', '😊', '😍']

export default function DateRatingModal({ dateId, targetName, targetGender, myId, onDone }: Props) {
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!score) return
    setLoading(true)

    // 插入评价
    const { data: date } = await supabase
      .from('dates')
      .select('user_a, user_b')
      .eq('id', dateId)
      .single()

    const targetId = date?.user_a === myId ? date?.user_b : date?.user_a

    await supabase.from('ratings').insert({
      date_id: dateId,
      rater_id: myId,
      target_id: targetId,
      score,
      comment,
    })

    // 额外 +5 EXP（发布评价奖励）
    await supabase.rpc('add_exp_and_update_rank', { p_user_id: myId, p_exp: 5 })

    // 标记已评价
    const isUserA = date?.user_a === myId
    await supabase.from('dates')
      .update(isUserA
        ? (targetGender === 'female' ? { female_rated: true } : { male_rated: true })
        : (targetGender === 'female' ? { female_rated: true } : { male_rated: true })
      )
      .eq('id', dateId)

    setLoading(false)
    onDone()
  }

  return (
    <div className="modal-overlay">
      <div className="rating-modal">
        <h3 className="rating-title">约会完成！给TA打个分</h3>
        <p className="rating-sub">
          你对 <strong>{targetName}</strong> 的印象？
        </p>

        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              className={`star-btn ${s <= score ? 'active' : ''}`}
              onClick={() => setScore(s)}
            >
              ⭐
            </button>
          ))}
        </div>

        {score > 0 && (
          <p className="rating-label">
            {SCORE_EMOJIS[score]} {SCORE_LABELS[score]}
          </p>
        )}

        <textarea
          className="rating-comment"
          placeholder="一句话评价（可选）"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          maxLength={100}
        />

        <div className="rating-btns">
          <button className="rating-submit" onClick={submit} disabled={!score || loading}>
            {loading ? '提交中...' : '提交评价'}
          </button>
          <button className="rating-skip" onClick={onDone}>跳过</button>
        </div>
      </div>
    </div>
  )
}
