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
  hotness?: number
  hotnessTag?: string
}

interface Package {
  id: string
  name: string
  price: number
  description: string
}

const LEVEL_EMOJI: Record<string, string> = {
  normal: '🍜', premium: '🥂', michelin: '⭐',
}

function calcHotnessTag(count: number): string {
  if (count >= 20) return '❤️ 超火'
  if (count >= 8) return '🔥 热门'
  if (count >= 2) return '🌟 新晋'
  return ''
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

      // 查询各餐厅约会次数
      const { data: dateCounts } = await supabase
        .from('dates')
        .select('restaurant_id')
        .in('status', ['pending', 'confirmed', 'completed'])

      const countMap: Record<string, number> = {}
      dateCounts?.forEach(d => {
        if (d.restaurant_id) countMap[d.restaurant_id] = (countMap[d.restaurant_id] || 0) + 1
      })

      const list: Restaurant[] = rests && rests.length > 0 ? rests : [
        { id: '1', name: '聚春园大酒店', address: '泉州市鲤城区', description: '泉州老字号，闽菜正宗，约会首选', phone: '0595-12345678', level: 'premium', is_active: true, packages: [{ id: '1', name: '双人约会套餐', price: 288, description: '含双人主菜+甜品+饮品' }] },
        { id: '2', name: '源和堂文创园餐厅', address: '泉州市丰泽区', description: '文艺氛围，适合初次见面', phone: '0595-87654321', level: 'normal', is_active: true, packages: [{ id: '2', name: '浪漫双人套餐', price: 198, description: '轻食+咖啡+甜点' }] },
        { id: '3', name: '西街印象茶馆', address: '西街开元寺附近', description: '传统闽南茶文化，轻松聊天', phone: '0595-11112222', level: 'normal', is_active: true, packages: [{ id: '3', name: '下午茶套餐', price: 128, description: '功夫茶+点心拼盘' }] },
        { id: '4', name: '清源山景观餐厅', address: '清源山风景区内', description: '山景绝佳，浪漫气氛满分', phone: '0595-33334444', level: 'premium', is_active: true, packages: [{ id: '4', name: '山景双人套餐', price: 258, description: '景观位+双人套餐' }] },
      ]

      const withHotness = list.map((r, i) => {
        // 真实数据或模拟热度（让 demo 有内容）
        const realCount = countMap[r.id] || 0
        const demoCount = realCount > 0 ? realCount : [28, 12, 6, 3][i] || 0
        return { ...r, hotness: demoCount, hotnessTag: calcHotnessTag(demoCount) }
      })

      setRestaurants(withHotness)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="empty-browse" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="empty-icon" style={{ animation: 'float 1.5s ease-in-out infinite' }}>🍽️</div>
    </div>
  )

  return (
    <div className="restaurants-page">
      <div className="restaurants-hero">
        <h2>约饭好去处</h2>
        <p>匹配成功？这些餐厅为你们准备了专属套餐</p>
      </div>

      <div className="restaurant-list">
        {restaurants.map(r => (
          <div key={r.id} className="restaurant-card">
            <div className={`restaurant-cover ${r.level}`}>
              <span className="restaurant-cover-emoji">{LEVEL_EMOJI[r.level] || '🍽️'}</span>
              {r.hotnessTag && (
                <span className="hotness-badge">{r.hotnessTag}</span>
              )}
            </div>
            <div className="restaurant-body">
              <div className="restaurant-header">
                <div className="restaurant-info">
                  <h3>{r.name}</h3>
                  <p className="restaurant-addr">📍 {r.address}</p>
                </div>
                {r.phone && (
                  <a href={`tel:${r.phone}`} className="call-btn">预订</a>
                )}
              </div>
              <p className="restaurant-desc">{r.description}</p>
              {r.packages && r.packages.length > 0 && (
                <div className="restaurant-packages">
                  {r.packages.map(p => (
                    <div key={p.id} className="restaurant-package">
                      <span>🎁 {p.name}</span>
                      <span className="package-price">¥{p.price}/位</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="partner-cta">
        <p>🤝 餐厅合作请联系我们</p>
        <p>每成功促成一次约饭，平台获返佣 10%</p>
      </div>
    </div>
  )
}
