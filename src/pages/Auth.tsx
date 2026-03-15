import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    setLoading(true)
    setError('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💎</div>
        <h1>芯约会</h1>
        <p className="auth-sub">认真约会 · 遇见真心</p>

        <div className="auth-tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>登录</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>注册</button>
        </div>

        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-btn" onClick={handle} disabled={loading}>
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>
      </div>
    </div>
  )
}
