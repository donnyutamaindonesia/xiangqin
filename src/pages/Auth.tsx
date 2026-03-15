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
      if (error) setError('邮箱或密码错误，请重试')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError('注册失败，请检查邮箱格式或稍后重试')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      {/* 背景图层 */}
      <div className="auth-bg" />
      <div className="auth-gradient" />

      {/* 品牌区 */}
      <div className="auth-hero">
        <div className="auth-gem">💎</div>
        <h1 className="auth-title">芯约会</h1>
        <p className="auth-slogan">认真约会 · 遇见真心</p>
      </div>

      {/* 登录卡片 */}
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>登录</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>注册</button>
        </div>

        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-btn" onClick={handle} disabled={loading}>
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>

        <p className="auth-note">泉州本地认真相亲平台</p>
      </div>
    </div>
  )
}
