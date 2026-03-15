import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Restaurant {
  id: string
  name: string
  address: string
  description: string
  phone: string
  level: string
  commission_rate: number
  is_active: boolean
}

interface Package {
  id: string
  restaurant_id: string
  name: string
  price: number
  description: string
  stock: number
}

export default function Admin() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [tab, setTab] = useState<'restaurants' | 'packages'>('restaurants')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const [rForm, setRForm] = useState({ name: '', address: '', description: '', phone: '', level: 'normal', commission_rate: '10' })
  const [pForm, setPForm] = useState({ name: '', price: '', description: '', stock: '99' })

  useEffect(() => { loadRestaurants() }, [])

  const loadRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })
    setRestaurants(data || [])
  }

  const loadPackages = async (restaurantId: string) => {
    const { data } = await supabase.from('packages').select('*').eq('restaurant_id', restaurantId)
    setPackages(data || [])
  }

  const addRestaurant = async () => {
    if (!rForm.name || !rForm.address) return
    setLoading(true)
    await supabase.from('restaurants').insert({
      name: rForm.name,
      address: rForm.address,
      description: rForm.description,
      phone: rForm.phone,
      level: rForm.level,
      commission_rate: parseFloat(rForm.commission_rate),
    })
    setRForm({ name: '', address: '', description: '', phone: '', level: 'normal', commission_rate: '10' })
    await loadRestaurants()
    setLoading(false)
  }

  const addPackage = async () => {
    if (!pForm.name || !pForm.price || !selectedRestaurant) return
    setLoading(true)
    await supabase.from('packages').insert({
      restaurant_id: selectedRestaurant,
      name: pForm.name,
      price: parseFloat(pForm.price),
      description: pForm.description,
      stock: parseInt(pForm.stock),
    })
    setPForm({ name: '', price: '', description: '', stock: '99' })
    await loadPackages(selectedRestaurant)
    setLoading(false)
  }

  const toggleRestaurant = async (id: string, active: boolean) => {
    await supabase.from('restaurants').update({ is_active: !active }).eq('id', id)
    loadRestaurants()
  }

  return (
    <div className="admin-page">
      <h2>⚙️ 后台管理</h2>

      <div className="admin-tabs">
        <button className={tab === 'restaurants' ? 'active' : ''} onClick={() => setTab('restaurants')}>餐厅管理</button>
        <button className={tab === 'packages' ? 'active' : ''} onClick={() => setTab('packages')}>套餐管理</button>
      </div>

      {tab === 'restaurants' && (
        <div>
          <div className="admin-form">
            <h3>新增餐厅</h3>
            <input placeholder="餐厅名称 *" value={rForm.name} onChange={e => setRForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="地址 *" value={rForm.address} onChange={e => setRForm(f => ({ ...f, address: e.target.value }))} />
            <input placeholder="简介" value={rForm.description} onChange={e => setRForm(f => ({ ...f, description: e.target.value }))} />
            <input placeholder="电话" value={rForm.phone} onChange={e => setRForm(f => ({ ...f, phone: e.target.value }))} />
            <div className="form-row">
              <select value={rForm.level} onChange={e => setRForm(f => ({ ...f, level: e.target.value }))}>
                <option value="normal">普通</option>
                <option value="premium">高端</option>
                <option value="michelin">米其林</option>
              </select>
              <input placeholder="佣金% (默认10)" value={rForm.commission_rate} onChange={e => setRForm(f => ({ ...f, commission_rate: e.target.value }))} />
            </div>
            <button onClick={addRestaurant} disabled={loading}>添加餐厅</button>
          </div>

          <div className="admin-list">
            {restaurants.map(r => (
              <div key={r.id} className="admin-item">
                <div>
                  <strong>{r.name}</strong>
                  <span className="admin-tag">{r.level}</span>
                  <span className="admin-tag">佣金 {r.commission_rate}%</span>
                </div>
                <p>{r.address}</p>
                <div className="admin-actions">
                  <button className="small-btn" onClick={() => { setSelectedRestaurant(r.id); loadPackages(r.id); setTab('packages') }}>
                    套餐管理
                  </button>
                  <button className={`small-btn ${r.is_active ? 'danger' : 'success'}`} onClick={() => toggleRestaurant(r.id, r.is_active)}>
                    {r.is_active ? '下架' : '上架'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'packages' && (
        <div>
          <div className="admin-form">
            <h3>新增套餐</h3>
            <select value={selectedRestaurant} onChange={e => { setSelectedRestaurant(e.target.value); loadPackages(e.target.value) }}>
              <option value="">选择餐厅</option>
              {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input placeholder="套餐名称 *" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="价格（元/位）*" type="number" value={pForm.price} onChange={e => setPForm(f => ({ ...f, price: e.target.value }))} />
            <input placeholder="套餐描述" value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))} />
            <input placeholder="库存（默认99）" type="number" value={pForm.stock} onChange={e => setPForm(f => ({ ...f, stock: e.target.value }))} />
            <button onClick={addPackage} disabled={loading || !selectedRestaurant}>添加套餐</button>
          </div>

          <div className="admin-list">
            {packages.map(p => (
              <div key={p.id} className="admin-item">
                <strong>{p.name}</strong>
                <span className="admin-tag price">¥{p.price}/位</span>
                <p>{p.description}</p>
                <p style={{ fontSize: 12, color: '#aaa' }}>库存: {p.stock}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
