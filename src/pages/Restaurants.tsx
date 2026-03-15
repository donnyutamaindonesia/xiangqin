import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Restaurant {
  id: string
  name: string
  address: string
  description: string
  phone: string
  level: string
  is_active: boolean
  packages?: Package[]
}

interface Package {
  id: string
  name: string
  price: number
  description: string
}

const LEVEL_EMOJI: Record<string, string> = {
  normal: '🍽️',
  premium: '⭐',
  michelin: '🌟',
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: rests } = await supabase
        .from('restaurants')
        .select('*, packages(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (rests && rests.length > 0) {
        setRestaurants(rests)
      } else {
        // 默认示例数据（未添加真实餐厅前显示）
        setRestaurants([
          { id: '1', name: '聚春园大酒店', address: '泉州市鲤城区', description: '泉州老字号，闽菜正宗，约会首选', phone: '0595-12345678', level: 'premium', is_active: true, packages: [{ id: '1', name: '双人约会套餐', price: 288, description: '含双人主菜+甜品+饮品' }] },
          { id: '2', name: '源和堂文创园餐厅', address: '泉州市丰泽区', description: '文艺氛围，适合初次见面', phone: '0595-87654321', level: 'normal', is_active: true, packages: [{ id: '2', name: '浪漫双人套餐', price: 198, description: '轻食+咖啡+甜点' }] },
          { id: '3', name: '西街印象茶馆', address: '西街开元寺附近', description: '传统闽南茶文化，轻松聊天', phone: '0595-11112222', level: 'normal', is_active: true, packages: [{ id: '3', name: '下午茶套餐', price: 128, description: '功夫茶+点心拼盘' }] },
          { id: '4', name: '清源山景观餐厅', address: '清源山风景区内', description: '山景绝佳，浪漫气氛满分', phone: '0595-33334444', level: 'premium', is_active: true, packages: [{ id: '4', name: '山景双人套餐', price: 258, description: '景观位+双人套餐' }] },
        ])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="empty-state">加载中...</div>

  return (
    <div className="restaurants-page">
      <div className="page-header">
        <h2>🍽️ 约饭合作餐厅</h2>
        <p>匹配成功？去这里见面，专属优惠套餐</p>
      </div>

      <div className="restaurant-list">
        {restaurants.map(r => (
          <div key={r.id} className="restaurant-card">
            <div className="restaurant-emoji">{LEVEL_EMOJI[r.level] || '🍽️'}</div>
            <div className="restaurant-info">
              <h3>{r.name}</h3>
              <p className="restaurant-addr">📍 {r.address}</p>
              <p className="restaurant-desc">{r.description}</p>
              {r.packages?.map(p => (
                <div key={p.id} className="restaurant-package">
                  <span>🎁 {p.name}</span>
                  <span className="package-price">¥{p.price}/位</span>
                </div>
              ))}
            </div>
            {r.phone && (
              <a href={`tel:${r.phone}`} className="call-btn">📞 预订</a>
            )}
          </div>
        ))}
      </div>

      <div className="partner-cta">
        <p>🤝 餐厅合作请联系我们</p>
        <p style={{ fontSize: 13, color: '#aaa' }}>每成功促成一次约饭，平台获返佣 10%</p>
      </div>
    </div>
  )
}
