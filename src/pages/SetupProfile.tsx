import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  userId: string
  onDone: () => void
}

export default function SetupProfile({ userId, onDone }: Props) {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'male', occupation: '',
    height: '', income: '', housing: '', bio: ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name || !form.age || !form.gender) return
    setLoading(true)
    await supabase.from('profiles').upsert({
      id: userId,
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      occupation: form.occupation,
      height: parseInt(form.height) || null,
      income: form.income,
      housing: form.housing,
      bio: form.bio,
      city: '泉州',
    })
    setLoading(false)
    onDone()
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h2>完善资料</h2>
        <p>让对方更了解你 💬</p>

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

        <div className="form-group">
          <label>自我介绍</label>
          <textarea placeholder="简单介绍一下自己..." value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} />
        </div>

        <button className="save-btn" onClick={save} disabled={loading}>
          {loading ? '保存中...' : '完成，开始找缘分 💕'}
        </button>
      </div>
    </div>
  )
}
