const restaurants = [
  {
    id: 1,
    name: '聚春园大酒店',
    address: '泉州市鲤城区',
    description: '泉州老字号，闽菜正宗，约会首选',
    package: '双人约会套餐',
    price: 288,
    emoji: '🏮',
    phone: '0595-12345678',
  },
  {
    id: 2,
    name: '源和堂文创园餐厅',
    address: '泉州市丰泽区',
    description: '文艺氛围，适合初次见面',
    package: '浪漫双人套餐',
    price: 198,
    emoji: '🌿',
    phone: '0595-87654321',
  },
  {
    id: 3,
    name: '西街印象茶馆',
    address: '西街开元寺附近',
    description: '传统闽南茶文化，轻松聊天',
    package: '下午茶套餐',
    price: 128,
    emoji: '🍵',
    phone: '0595-11112222',
  },
  {
    id: 4,
    name: '清源山景观餐厅',
    address: '清源山风景区内',
    description: '山景绝佳，浪漫气氛满分',
    package: '山景双人套餐',
    price: 258,
    emoji: '⛰️',
    phone: '0595-33334444',
  },
]

export default function Restaurants() {
  return (
    <div className="restaurants-page">
      <div className="page-header">
        <h2>🍽️ 约饭合作餐厅</h2>
        <p>匹配成功？去这里见面，专属优惠套餐</p>
      </div>

      <div className="restaurant-list">
        {restaurants.map(r => (
          <div key={r.id} className="restaurant-card">
            <div className="restaurant-emoji">{r.emoji}</div>
            <div className="restaurant-info">
              <h3>{r.name}</h3>
              <p className="restaurant-addr">📍 {r.address}</p>
              <p className="restaurant-desc">{r.description}</p>
              <div className="restaurant-package">
                <span>🎁 {r.package}</span>
                <span className="package-price">¥{r.price}/位</span>
              </div>
            </div>
            <a href={`tel:${r.phone}`} className="call-btn">📞 预订</a>
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
