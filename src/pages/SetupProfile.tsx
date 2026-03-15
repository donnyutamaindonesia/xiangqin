import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  userId: string
  onDone: () => void
  initialData?: Record<string, any>
}

const TAGS = [
  '😅 我不渣我就是傻', '🍽️ 美食猎人', '💎 认真找对象',
  '🏃 运动达人', '📚 文艺青年', '👔 创业狗',
  '🐱 铲屎官', '✈️ 旅行控',
]

export default function SetupProfile({ userId, onDone, initialData }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    age: String(initialData?.age || ''),
    gender: initialData?.gender || 'male',
    occupation: initialData?.occupation || '',
    height: String(initialData?.height || ''),
    income: initialData?.income || '',
    housing: initialData?.housing || '',
    food_preference: initialData?.food_preference || '',
    bio: initialData?.bio || '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : prev.length < 3 ? [...prev, tag] : prev
    )
  }

  const save = async () => {
    if (!form.name.trim() || !form.age || !form.gender) {
      setError('请填写昵称、年龄和性别')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('profiles').upsert({
      id: userId,
      name: form.name.trim(),
      age: parseInt(form.age),
      gender: form.gender,
      occupation: form.occupation,
      height: parseInt(form.height) || null,
      income: form.income,
      housing: form.housing,
      food_preference: form.food_preference,
      bio: form.bio,
      tags: selectedTags,
      city: '泉州',
    })
    setLoading(false)
    if (err) { setError('保存失败，请重试'); return }
    onDone()
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h2>{initialData ? '编辑资料' : '完善资料'}</h2>
        <p>{initialData ? '更新你的个人信息' : '让对方更了解你 💬'}</p>

        <div className="form-group">
          <label>昵称 *</label>
          <input placeholder="你的昵称" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>年龄 *</label>
            <input type="number" placeholder="年龄" value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className="form-group">
            <label>身高(cm)</label>
            <input type="number" placeholder="身高" value={form.height} onChange={e => set('height', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>性别 *</label>
          <div className="gender-btns">
            <button className={form.gender === 'male' ? 'active' : ''} onClick={() => set('gender', 'male')}>👨 男</button>
            <button className={form.gender === 'female' ? 'active' : ''} onClick={() => set('gender', 'female')}>👩 女</button>
          </div>
        </div>

        <div className="form-group">
          <label>职业</label>
          <input placeholder="职业" value={form.occupation} onChange={e => set('occupation', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>月收入</label>
            <select value={form.income} onChange={e => set('income', e.target.value)}>
              <option value="">请选择</option>
              <option value="5000以下">5000以下</option>
              <option value="5000-10000">5000-10000</option>
              <option value="10000-20000">10000-20000</option>
              <option value="20000以上">20000以上</option>
            </select>
          </div>
          <div className="form-group">
            <label>住房情况</label>
            <select value={form.housing} onChange={e => set('housing', e.target.value)}>
              <option value="">请选择</option>
              <option value="自有住房">自有住房</option>
              <option value="家里住房">家里住房</option>
              <option value="租房">租房</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>口味偏好</label>
          <select value={form.food_preference} onChange={e => set('food_preference', e.target.value)}>
            <option value="">请选择</option>
            <option value="闽菜">闽菜</option>
            <option value="粤菜">粤菜</option>
            <option value="川菜">川菜</option>
            <option value="日料">日料</option>
            <option value="西餐">西餐</option>
            <option value="不挑食">不挑食</option>
          </select>
        </div>

        <div className="form-group">
          <label>自我介绍</label>
          <textarea
            placeholder="简单介绍一下自己..."
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>个性标签（最多3个）</label>
          <div className="tag-selector">
            {TAGS.map(tag => (
              <button
                key={tag}
                className={`tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#f08090', fontSize: 13, marginBottom: 8 }}>{error}</p>}

        <button className="save-btn" onClick={save} disabled={loading}>
          {loading ? '保存中...' : initialData ? '保存修改' : '完成，开始找缘分 💕'}
        </button>
      </div>
    </div>
  )
}
