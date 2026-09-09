import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';

const API = 'http://localhost:3000';

// â”€â”€â”€ Shared UI Atoms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Pill = ({ label, color = 'gray' }) => {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${colors[color]}`}>
      {label}
    </span>
  );
};

const SectionHeader = ({ icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-2xl bg-[#c59a63]/10 flex items-center justify-center text-[#c59a63]">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      )}
      <div>
        <h2 className="text-xl font-black text-gray-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] ${className}`}>
    {children}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-2xl p-1 mb-6 w-fit">
    {tabs.map(t => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
          active === t.key
            ? 'bg-white shadow text-[#c59a63]'
            : 'text-gray-400 hover:text-gray-700'
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl transition-all ${
    type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'
  }`}>
    <span className="material-symbols-outlined text-[20px]">
      {type === 'success' ? 'check_circle' : 'error'}
    </span>
    <span className="text-sm font-semibold">{message}</span>
    <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
      <span className="material-symbols-outlined text-[18px]">close</span>
    </button>
  </div>
);

// â”€â”€â”€ Panel 1: Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DashboardPanel = () => {
  const [metrics, setMetrics] = useState({ dailyRevenue: 0, theoreticalMargin: 28.4, inventoryValuation: 0, parAlerts: [], totalOrdersToday: 0, pendingOrdersToday: 0, deliveredOrdersToday: 0, floorOccupancy: 0, topSellers: [] });
  const [inventory, setInventory] = useState([]);
  const [toast, setToast] = useState(null);
  const [timeFilter, setTimeFilter] = useState('day');
  const [orderDate, setOrderDate] = useState('');
  const [orderCount, setOrderCount] = useState(0);

  const fetchMetrics = useCallback(() => {
    let url = `${API}/api/admin/metrics?filter=${timeFilter}`;
    if (timeFilter === 'custom' && orderDate) url += `&date=${orderDate}`;
    fetch(url).then(r => r.json()).then(setMetrics).catch(console.error);
    fetch(`${API}/api/admin/inventory`).then(r => r.json()).then(setInventory).catch(console.error);
  }, [timeFilter, orderDate]);

  const fetchOrderCount = useCallback(() => {
    let url = `${API}/api/admin/orders/count?filter=${timeFilter}`;
    if (timeFilter === 'custom' && orderDate) url += `&date=${orderDate}`;
    fetch(url).then(r => r.json()).then(data => setOrderCount(data.count)).catch(console.error);
  }, [timeFilter, orderDate]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchOrderCount(); }, [fetchOrderCount]);

  // Chart Data preparation
  const paymentData = [
    { name: 'Initiated', value: metrics.totalOrdersToday || 0 },
    { name: 'Pending', value: metrics.pendingOrdersToday || 0 },
    { name: 'Delivered', value: metrics.deliveredOrdersToday || 0 },
  ];
  
  const marginData = [
    { name: 'Mon', value: metrics.theoreticalMargin - 4 },
    { name: 'Tue', value: metrics.theoreticalMargin - 2 },
    { name: 'Wed', value: metrics.theoreticalMargin + 1 },
    { name: 'Thu', value: metrics.theoreticalMargin - 1 },
    { name: 'Fri', value: metrics.theoreticalMargin },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Overview</h1>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-800 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[16px]">link</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* --- TOP ROW (4 Cards) --- */}
        
        {/* 1. Gross Volume */}
        <div className="xl:col-span-3 bg-gradient-to-br from-emerald-100 via-white to-white rounded-[24px] p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden min-h-[140px]">
          <div className="relative z-10 flex items-start justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900 shrink-0">Gross Revenue</h2>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg border border-gray-100 text-xs font-medium text-gray-600">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {timeFilter === 'custom' && (
                <input 
                  type="date" 
                  value={orderDate} 
                  onChange={e => setOrderDate(e.target.value)}
                  className="bg-white/50 px-2 py-1 rounded-lg border border-gray-100 text-xs font-medium text-gray-600 outline-none w-[110px]"
                />
              )}
            </div>
          </div>
          <div className="text-4xl font-semibold tracking-tighter text-gray-900 mt-2">
            ₹{metrics.dailyRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* 2. Total Orders */}
        <div className="xl:col-span-3 bg-gradient-to-br from-teal-100 via-white to-white rounded-[24px] p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden min-h-[140px]">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Total Orders</h2>
          </div>
          <div className="flex items-end justify-between w-full mt-2">
            <span className="text-4xl font-bold tracking-tight text-gray-900">{orderCount}</span>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">vs last period</span>
              <span className="text-xs font-bold text-gray-900">+{Math.floor(orderCount * 0.12)}</span>
            </div>
          </div>
        </div>

        {/* 3. Live Floor Occupancy */}
        <div className="xl:col-span-3 bg-gradient-to-br from-indigo-100 via-white to-white rounded-[24px] p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden min-h-[140px]">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Floor Occupancy</h2>
            </div>
            <div className="mt-auto flex items-end gap-3">
              <div className="text-5xl font-bold tracking-tighter text-gray-900 leading-none">
                {metrics.floorOccupancy}%
              </div>
              <p className="text-xs font-medium text-gray-500 pb-1">Full</p>
            </div>
          </div>
        </div>

        {/* 4. Inventory Alerts */}
        <div className="xl:col-span-3 bg-gradient-to-br from-amber-100 via-white to-white rounded-[24px] p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden min-h-[140px]">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Inventory Alerts</h2>
            </div>
            <div className="mt-auto flex items-end gap-3">
              <div className="text-5xl font-bold tracking-tighter text-gray-900 leading-none">
                {metrics.parAlerts.length}
              </div>
              <p className="text-xs font-medium text-gray-500 pb-1">items currently below par</p>
            </div>
          </div>
        </div>

        {/* --- BOTTOM ROW (3 Cards) --- */}

        {/* 5. Orders Funnel (Wide) */}
        <div className="xl:col-span-6 bg-gradient-to-br from-blue-100 via-white to-white rounded-[24px] p-6 pb-4 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden min-h-[280px]">
          <div className="relative z-10 flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Orders Funnel</h2>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Top Sellers Leaderboard */}
        <div className="xl:col-span-3 bg-gradient-to-br from-purple-100 via-white to-white rounded-[24px] p-6 pb-4 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden min-h-[280px]">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Top Sellers</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {metrics.topSellers && metrics.topSellers.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {metrics.topSellers.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 line-clamp-1">{idx + 1}. {item.name}</span>
                        <span className="text-sm font-bold text-gray-900">{item.qty}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${(item.qty / metrics.topSellers[0].qty) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">No orders today</div>
              )}
            </div>
          </div>
        </div>

        {/* 7. Theoretical Margin */}
        <div className="xl:col-span-3 bg-gradient-to-br from-rose-100 via-white to-white rounded-[24px] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden min-h-[280px]">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Margin</h2>
          </div>
          <div className="flex items-end gap-2 mb-4 mt-2">
            <span className="text-4xl font-bold text-gray-900">{metrics.theoreticalMargin}%</span>
            <span className="text-xs font-bold text-green-500 mb-1">+1.2%</span>
          </div>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginData}>
                <Line type="stepAfter" dataKey="value" stroke="#f43f5e" strokeWidth={3} dot={false} fill="#fff1f2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

// â”€â”€â”€ Panel 2: Menu Engineering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MenuEngineeringPanel = () => {
  const [tab, setTab] = useState('catalog');
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [toast, setToast] = useState(null);

  // New item form
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'General', is_veg: false });
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Recipe builder
  const [recipeTarget, setRecipeTarget] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState([{ inventory_id: '', quantity_required: '' }]);

  const fetchAll = useCallback(() => {
    fetch(`${API}/api/admin/menu-items`).then(r => r.json()).then(setMenuItems).catch(console.error);
    fetch(`${API}/api/admin/inventory`).then(r => r.json()).then(setInventory).catch(console.error);
    fetch(`${API}/api/admin/recipes`).then(r => r.json()).then(setRecipes).catch(console.error);
    fetch(`${API}/api/admin/categories`).then(r => r.json()).then(data => setCustomCategories(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return showToast('Name and price required.', 'error');
    const r = await fetch(`${API}/api/admin/menu-items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    if (r.ok) { showToast('Menu item created!'); setNewItem({ name: '', price: '', category: 'General', is_veg: false }); fetchAll(); }
    else { const e = await r.json(); showToast(e.error, 'error'); }
  };

  const saveEdit = async (id) => {
    const r = await fetch(`${API}/api/admin/menu-items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editValues) });
    if (r.ok) { showToast('Item updated!'); setEditingId(null); fetchAll(); }
    else showToast('Update failed.', 'error');
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item and its recipe?')) return;
    const r = await fetch(`${API}/api/admin/menu-items/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Item deleted.'); fetchAll(); }
    else showToast('Delete failed.', 'error');
  };

  const addCategory = async () => {
    if (!newCategory) return;
    const r = await fetch(`${API}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory }) });
    if (r.ok) { showToast('Category added!'); setNewCategory(''); fetchAll(); }
    else { const e = await r.json(); showToast(e.error || 'Failed', 'error'); }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    const r = await fetch(`${API}/api/admin/categories/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Category deleted.'); fetchAll(); }
    else showToast('Delete failed.', 'error');
  };

  const saveRecipe = async () => {
    if (!recipeTarget) return showToast('Select a menu item.', 'error');
    const valid = recipeIngredients.filter(i => i.inventory_id && i.quantity_required);
    if (!valid.length) return showToast('Add at least one ingredient.', 'error');
    const r = await fetch(`${API}/api/admin/recipes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menu_item_id: recipeTarget, ingredients: valid }) });
    if (r.ok) { showToast('Recipe saved!'); fetchAll(); setRecipeTarget(''); setRecipeIngredients([{ inventory_id: '', quantity_required: '' }]); }
    else showToast('Failed to save recipe.', 'error');
  };

  const deleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    const r = await fetch(`${API}/api/admin/recipes/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Recipe deleted.'); fetchAll(); }
    else showToast('Delete failed.', 'error');
  };

  const editRecipe = (recipe) => {
    setRecipeTarget(recipe.menu_item_id?._id || recipe.menu_item_id);
    const ings = recipe.ingredients.map(ing => ({
      inventory_id: ing.inventory_id?._id || ing.inventory_id,
      quantity_required: ing.quantity_required
    }));
    setRecipeIngredients(ings.length > 0 ? ings : [{ inventory_id: '', quantity_required: '' }]);
  };

  const calcCost = (itemId) => {
    const recipe = recipes.find(r => r.menu_item_id?._id === itemId || r.menu_item_id === itemId);
    if (!recipe) return null;
    let cost = 0;
    recipe.ingredients.forEach(ing => {
      const inv = ing.inventory_id;
      if (inv && inv.cost_per_unit) cost += inv.cost_per_unit * ing.quantity_required;
    });
    return cost;
  };

  const allergenTags = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Egg', 'Soy'];

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader icon="menu_book" title="Menu Engineering" subtitle="Manage sellable items, recipes, and cost analysis" />
      <TabBar tabs={[{ key: 'catalog', label: 'Catalog' }, { key: 'recipe', label: 'Recipe Mapping' }, { key: 'categories', label: 'Categories' }]} active={tab} onChange={setTab} />

      {tab === 'catalog' && (
        <div className="flex flex-col gap-5">
          {/* Add form */}
          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Add New Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="col-span-5 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <input value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} placeholder="Price (₹)" type="number" className="col-span-3 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className="col-span-3 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]">
                <option value="General">General</option>
                {customCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <label className="col-span-1 flex flex-col items-center gap-1 cursor-pointer">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Veg</span>
                <input type="checkbox" checked={newItem.is_veg} onChange={e => setNewItem(p => ({ ...p, is_veg: e.target.checked }))} className="w-4 h-4 text-green-500 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer" />
              </label>
            </div>
            <button onClick={addMenuItem} className="mt-3 px-6 py-2.5 rounded-xl bg-[#c59a63] text-white text-sm font-bold hover:bg-[#b8895a] transition-all shadow-md shadow-[#c59a63]/20 self-start">
              + Add to Catalog
            </button>
          </Card>

          {/* Table */}
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Name</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Category</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Price</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Recipe Cost</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Margin</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => {
                  const cost = calcCost(item._id);
                  const margin = cost ? (((item.price - cost) / item.price) * 100).toFixed(1) : null;
                  const isEditing = editingId === item._id;
                  return (
                    <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-800 flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 w-full">
                            <input value={editValues.name} onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm w-full" />
                            <input type="checkbox" checked={editValues.is_veg} onChange={e => setEditValues(p => ({ ...p, is_veg: e.target.checked }))} className="w-4 h-4 cursor-pointer" title="Veg" />
                          </div>
                        ) : (
                          <>
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} title={item.is_veg ? 'Veg' : 'Non-Veg'}></div>
                            {item.name}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <select value={editValues.category} onChange={e => setEditValues(p => ({ ...p, category: e.target.value }))} className="px-2 py-1 rounded-lg border border-gray-200 text-xs">
                            <option value="General">General</option>
                            {customCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                          </select>
                        ) : <Pill label={item.category || 'General'} color="gray" />}
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-800">
                        {isEditing ? <input value={editValues.price} onChange={e => setEditValues(p => ({ ...p, price: e.target.value }))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm w-24" type="number" /> : `₹${item.price.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-4 text-gray-500">{cost ? `₹${cost.toFixed(2)}` : <span className="text-gray-300">â€”</span>}</td>
                      <td className="px-4 py-4">
                        {margin ? <Pill label={`${margin}%`} color={parseFloat(margin) > 60 ? 'green' : parseFloat(margin) > 30 ? 'orange' : 'red'} /> : <span className="text-gray-300 text-xs">No recipe</span>}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(item._id)} className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-bold">Save</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(item._id); setEditValues({ name: item.name, price: item.price, category: item.category, is_veg: item.is_veg }); }} className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold transition-colors">Edit</button>
                            <button onClick={() => deleteItem(item._id)} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors">Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {menuItems.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-12">No menu items yet. Add one above.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'recipe' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Build Recipe / BOM</h3>
            <div className="mb-4">
              <label className="text-xs text-gray-500 font-semibold mb-1 block">Menu Item</label>
              <select value={recipeTarget} onChange={e => setRecipeTarget(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]">
                <option value="">â€” Select item â€”</option>
                {menuItems.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <label className="text-xs text-gray-500 font-semibold">Ingredients</label>
              {recipeIngredients.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select value={row.inventory_id} onChange={e => { const c = [...recipeIngredients]; c[idx].inventory_id = e.target.value; setRecipeIngredients(c); }} className="flex-1 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-xs focus:outline-none focus:border-[#c59a63]">
                    <option value="">â€” Ingredient â€”</option>
                    {inventory.map(i => <option key={i._id} value={i._id}>{i.ingredient_name} ({i.unit})</option>)}
                  </select>
                  <input type="number" value={row.quantity_required} onChange={e => { const c = [...recipeIngredients]; c[idx].quantity_required = e.target.value; setRecipeIngredients(c); }} placeholder="Qty" className="w-20 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-xs text-center focus:outline-none focus:border-[#c59a63]" />
                  {recipeIngredients.length > 1 && <button onClick={() => setRecipeIngredients(p => p.filter((_, i) => i !== idx))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 text-xs font-bold">âœ•</button>}
                </div>
              ))}
              <button onClick={() => setRecipeIngredients(p => [...p, { inventory_id: '', quantity_required: '' }])} className="text-xs text-[#c59a63] font-bold hover:underline text-left">+ Add ingredient row</button>
            </div>
            <button onClick={saveRecipe} className="w-full py-3 rounded-xl bg-[#c59a63] text-white text-sm font-bold hover:bg-[#b8895a] transition-all shadow-md shadow-[#c59a63]/20">
              Save Recipe
            </button>
          </Card>

          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Existing BOM Recipes</h3>
            <div className="flex flex-col gap-4">
              {recipes.map(r => {
                const cost = r.ingredients.reduce((sum, ing) => {
                  const inv = ing.inventory_id;
                  return sum + (inv?.cost_per_unit || 0) * ing.quantity_required;
                }, 0);
                return (
                  <div key={r._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-800">{r.menu_item_id?.name || 'Unknown'}</span>
                      <span className="text-[10px] font-black text-[#c59a63]">Cost: ₹{cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {r.ingredients.map((ing, i) => (
                          <span key={i} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                            {ing.inventory_id?.ingredient_name || '?'} Ã— {ing.quantity_required}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button onClick={() => editRecipe(r)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-[10px] font-bold transition-all">Edit</button>
                        <button onClick={() => deleteRecipe(r._id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold transition-all">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {recipes.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No recipes mapped yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'categories' && (
        <div className="flex flex-col gap-5">
          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Add Custom Category</h3>
            <div className="flex gap-3">
              <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Category Name" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <button onClick={addCategory} className="px-6 py-2.5 rounded-xl bg-[#c59a63] text-white text-sm font-bold hover:bg-[#b8895a] transition-all shadow-md shadow-[#c59a63]/20">
                Add Category
              </button>
            </div>
          </Card>
          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Existing Categories</h3>
            <div className="flex flex-col gap-2">
              {customCategories.map(c => (
                <div key={c._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-sm font-bold text-gray-800">{c.name}</span>
                  <button onClick={() => deleteCategory(c._id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))}
              {customCategories.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No custom categories yet.</p>}
            </div>
          </Card>
        </div>
      )}


    </>
  );
};

// â”€â”€â”€ Panel 3: Inventory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const InventoryPanel = () => {
  const [tab, setTab] = useState('materials');
  const [inventory, setInventory] = useState([]);
  const [wastageLog, setWastageLog] = useState([]);
  const [toast, setToast] = useState(null);
  const [wastageForm, setWastageForm] = useState({ inventory_id: '', quantity: '', reason: 'Spoilage' });
  const [receiveForm, setReceiveForm] = useState({ inventory_id: '', quantity_received: '' });
  const [showReceive, setShowReceive] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ ingredient_name: '', stock_level: '', unit: '', par_level: '', vendor_name: '', cost_per_unit: '' });

  const reasons = ['Spoilage', 'Spillage', 'Burnt', 'Over-prep', 'Theft', 'Quality Rejection'];

  const fetchInventory = useCallback(() => {
    fetch(`${API}/api/admin/inventory`).then(r => r.json()).then(setInventory).catch(console.error);
  }, []);
  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const submitWastage = async () => {
    if (!wastageForm.inventory_id || !wastageForm.quantity) return showToast('Select item and quantity.', 'error');
    const r = await fetch(`${API}/api/admin/inventory/wastage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(wastageForm) });
    const d = await r.json();
    if (r.ok) {
      showToast(d.message);
      setWastageLog(p => [{ ...wastageForm, item: inventory.find(i => i._id === wastageForm.inventory_id), timestamp: new Date().toLocaleTimeString() }, ...p]);
      setWastageForm({ inventory_id: '', quantity: '', reason: 'Spoilage' });
      fetchInventory();
    } else showToast(d.error, 'error');
  };

  const submitReceive = async () => {
    if (!receiveForm.inventory_id || !receiveForm.quantity_received) return showToast('Select item and quantity.', 'error');
    const r = await fetch(`${API}/api/admin/inventory/receive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(receiveForm) });
    const d = await r.json();
    if (r.ok) { showToast(d.message); setReceiveForm({ inventory_id: '', quantity_received: '' }); setShowReceive(false); fetchInventory(); }
    else showToast(d.error, 'error');
  };

  const submitNewItem = async () => {
    if (!newItemForm.ingredient_name || !newItemForm.unit) return showToast('Name and Unit are required.', 'error');
    const r = await fetch(`${API}/api/admin/inventory/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItemForm) });
    const d = await r.json();
    if (r.ok) {
      showToast(d.message);
      setNewItemForm({ ingredient_name: '', stock_level: '', unit: '', par_level: '', vendor_name: '', cost_per_unit: '' });
      setShowNewItem(false);
      fetchInventory();
    } else showToast(d.error || 'Failed to add item.', 'error');
  };

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <SectionHeader
        icon="inventory_2" title="Inventory Management" subtitle="Live raw material tracking and reconciliation"
        action={
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNewItem(p => !p)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c59a63] text-white text-xs font-bold hover:bg-[#b8895a] transition-all shadow-md shadow-[#c59a63]/20">
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Add New Ingredient
            </button>
            <button onClick={() => setShowReceive(p => !p)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-all shadow-md shadow-teal-500/20">
              <span className="material-symbols-outlined text-[16px]">add_box</span>
              Log Receiving
            </button>
          </div>
        }
      />

      {showReceive && (
        <Card className="mb-5 border-2 border-teal-100">
          <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-4">Receive Delivery</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={receiveForm.inventory_id} onChange={e => setReceiveForm(p => ({ ...p, inventory_id: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-teal-400 col-span-2">
              <option value="">â€” Select ingredient â€”</option>
              {inventory.map(i => <option key={i._id} value={i._id}>{i.ingredient_name} (Current: {i.stock_level} {i.unit})</option>)}
            </select>
            <input type="number" value={receiveForm.quantity_received} onChange={e => setReceiveForm(p => ({ ...p, quantity_received: e.target.value }))} placeholder="Qty received" className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-teal-400" />
          </div>
          <button onClick={submitReceive} className="mt-3 px-6 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 transition-all">Confirm Receipt</button>
        </Card>
      )}

      <TabBar tabs={[{ key: 'materials', label: 'Raw Materials' }, { key: 'wastage', label: 'Wastage Log' }]} active={tab} onChange={setTab} />

      {tab === 'materials' && (
        <>
        {showNewItem && (
          <Card className="mb-5 border-2 border-[#c59a63]/20">
            <h3 className="text-xs font-bold text-[#c59a63] uppercase tracking-widest mb-4">Add New Ingredient</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <input type="text" value={newItemForm.ingredient_name} onChange={e => setNewItemForm(p => ({ ...p, ingredient_name: e.target.value }))} placeholder="Ingredient Name" className="col-span-2 w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <input type="text" value={newItemForm.unit} onChange={e => setNewItemForm(p => ({ ...p, unit: e.target.value }))} placeholder="Unit (e.g. kg, L)" className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <input type="number" value={newItemForm.par_level} onChange={e => setNewItemForm(p => ({ ...p, par_level: e.target.value }))} placeholder="Par Level" className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <input type="number" value={newItemForm.stock_level} onChange={e => setNewItemForm(p => ({ ...p, stock_level: e.target.value }))} placeholder="Initial Stock" className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <input type="number" value={newItemForm.cost_per_unit} onChange={e => setNewItemForm(p => ({ ...p, cost_per_unit: e.target.value }))} placeholder="Cost/Unit (₹)" className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
              <input type="text" value={newItemForm.vendor_name} onChange={e => setNewItemForm(p => ({ ...p, vendor_name: e.target.value }))} placeholder="Vendor Name" className="col-span-2 md:col-span-3 lg:col-span-6 w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
            </div>
            <button onClick={submitNewItem} className="mt-4 px-6 py-2.5 rounded-xl bg-[#c59a63] text-white text-sm font-bold hover:bg-[#b8895a] transition-all">Add to Inventory</button>
          </Card>
        )}
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {['Ingredient', 'Stock Level', 'Par Level', 'Unit', 'Vendor', 'Cost/Unit', 'Valuation', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const pct = (item.stock_level / item.par_level) * 100;
                const status = pct < 50 ? { label: 'Reorder', color: 'red' } : pct < 100 ? { label: 'Low', color: 'orange' } : { label: 'Healthy', color: 'green' };
                const val = (item.stock_level * item.cost_per_unit).toFixed(2);
                return (
                  <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-800">{item.ingredient_name}</td>
                    <td className="px-5 py-4 font-bold text-gray-700">{item.stock_level}</td>
                    <td className="px-5 py-4 text-gray-500">{item.par_level}</td>
                    <td className="px-5 py-4 text-gray-400">{item.unit}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{item.vendor_name}</td>
                    <td className="px-5 py-4 text-gray-700 font-semibold">₹{item.cost_per_unit.toFixed(2)}</td>
                    <td className="px-5 py-4 font-bold text-gray-800">₹{val}</td>
                    <td className="px-5 py-4"><Pill label={status.label} color={status.color} /></td>
                  </tr>
                );
              })}
              {inventory.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-12">No inventory data.</td></tr>}
            </tbody>
          </table>
        </Card>
        </>
      )}

      {tab === 'wastage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Log Wastage Entry</h3>
            <div className="flex flex-col gap-3">


              <label className="text-xs text-gray-500 font-semibold">Ingredient & Quantity</label>
              <div className="flex gap-3">
                <select value={wastageForm.inventory_id} onChange={e => setWastageForm(p => ({ ...p, inventory_id: e.target.value }))} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]">
                  <option value="">— Select item —</option>
                  {inventory.map(i => <option key={i._id} value={i._id}>{i.ingredient_name}</option>)}
                </select>
                <input type="number" value={wastageForm.quantity} onChange={e => setWastageForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Qty" className="w-24 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-center focus:outline-none focus:border-[#c59a63]" />
              </div>
              <label className="text-xs text-gray-500 font-semibold mt-2">Reason</label>
              <select value={wastageForm.reason} onChange={e => setWastageForm(p => ({ ...p, reason: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]">
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={submitWastage} className="mt-4 w-full py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-md shadow-red-500/20">
                Log Wastage
              </button>
            </div>
          </Card>
          
          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Recent Wastage History</h3>
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {wastageLog.map((log, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{log.item?.ingredient_name || 'Unknown Item'}</h4>
                    <p className="text-xs text-gray-500 mt-1">Reason: {log.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-500">-{log.quantity} {log.item?.unit}</span>
                    <span className="block text-[10px] text-gray-400 mt-1">{log.timestamp}</span>
                  </div>
                </div>
              ))}
              {wastageLog.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No wastage recorded today.</p>}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

// ─── Panel 4: Procurement ──────────────────────────────────────────────────────────
const ProcurementPanel = () => {
  const [tab, setTab] = React.useState('orders');
  const [inventory, setInventory] = React.useState([]);
  const [pos, setPos] = React.useState([]);
  const [vendors, setVendors] = React.useState([]);
  const [toast, setToast] = React.useState(null);

  const [showManualPo, setShowManualPo] = React.useState(false);
  const [poForm, setPoForm] = React.useState({ vendor_name: '', items: [] });
  const [poItemForm, setPoItemForm] = React.useState({ inventory_id: '', quantity: '' });

  const [showAddVendor, setShowAddVendor] = React.useState(false);
  const [vendorForm, setVendorForm] = React.useState({ name: '', contact_email: '', phone: '' });

  const fetchData = React.useCallback(() => {
    fetch(`${API}/api/admin/inventory`).then(r => r.json()).then(setInventory).catch(console.error);
    fetch(`${API}/api/admin/po`).then(r => r.json()).then(setPos).catch(console.error);
    fetch(`${API}/api/admin/vendors`).then(r => r.json()).then(setVendors).catch(console.error);
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const receivePo = async (id) => {
    const r = await fetch(`${API}/api/admin/po/${id}/receive`, { method: 'POST' });
    const d = await r.json();
    if (r.ok) { showToast(d.message); fetchData(); } else showToast(d.error, 'error');
  };

  const submitVendor = async () => {
    if (!vendorForm.name) return showToast('Vendor name required', 'error');
    const r = await fetch(`${API}/api/admin/vendors`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(vendorForm) });
    const d = await r.json();
    if(r.ok) { showToast('Vendor added'); setVendorForm({name:'', contact_email:'', phone:''}); setShowAddVendor(false); fetchData(); } else showToast(d.error, 'error');
  }

  const addPoItem = () => {
    if(!poItemForm.inventory_id || !poItemForm.quantity) return;
    setPoForm(p => ({ ...p, items: [...p.items, poItemForm] }));
    setPoItemForm({ inventory_id: '', quantity: '' });
  }

  const submitManualPo = async () => {
    if(!poForm.vendor_name || poForm.items.length === 0) return showToast('Vendor and items required', 'error');
    const r = await fetch(`${API}/api/admin/po/manual`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(poForm) });
    const d = await r.json();
    if(r.ok) { showToast('PO Created'); setPoForm({vendor_name: '', items: []}); setShowManualPo(false); fetchData(); } else showToast(d.error, 'error');
  }

  const lowStock = inventory.filter(i => (i.stock_level + (i.on_order || 0)) <= i.par_level);
  const pendingPos = pos.filter(p => p.status === 'pending');
  const historyPos = pos.filter(p => p.status !== 'pending');

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <SectionHeader icon="local_shipping" title="Procurement" subtitle="Purchase orders, vendor directory, and receiving" />
      </div>

      <div className="flex items-center justify-between">
        <TabBar tabs={[{ key: 'orders', label: 'Purchase Orders' }, { key: 'catalog', label: 'Vendor Catalog' }, { key: 'receiving', label: 'Receiving' }]} active={tab} onChange={setTab} />
        
        {tab === 'orders' && (
          <div className="flex gap-2">
            <button onClick={() => setShowManualPo(!showManualPo)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span> Create Manual PO
            </button>
          </div>
        )}

        {tab === 'catalog' && (
          <button onClick={() => setShowAddVendor(!showAddVendor)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Vendor
          </button>
        )}
      </div>

      {tab === 'orders' && (
        <>
          {showManualPo && (
            <Card className="mb-6 border-2 border-gray-900">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Create Manual Purchase Order</h3>
              <div className="flex flex-col gap-4">
                <select value={poForm.vendor_name} onChange={e => setPoForm(p => ({...p, vendor_name: e.target.value}))} className="px-4 py-2 rounded border border-gray-200">
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => <option key={v._id} value={v.vendor_name || v.name}>{v.vendor_name || v.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <select value={poItemForm.inventory_id} onChange={e => setPoItemForm(p => ({...p, inventory_id: e.target.value}))} className="px-4 py-2 rounded border border-gray-200 flex-1">
                    <option value="">-- Select Ingredient --</option>
                    {inventory.map(i => <option key={i._id} value={i._id}>{i.ingredient_name}</option>)}
                  </select>
                  <input type="number" placeholder="Qty" value={poItemForm.quantity} onChange={e => setPoItemForm(p => ({...p, quantity: e.target.value}))} className="w-24 px-4 py-2 rounded border border-gray-200" />
                  <button onClick={addPoItem} className="bg-gray-200 px-4 py-2 rounded font-bold text-sm">Add Item</button>
                </div>
                {poForm.items.length > 0 && (
                  <ul className="text-sm border border-gray-100 rounded p-4">
                    {poForm.items.map((it, idx) => {
                      const inv = inventory.find(i => i._id === it.inventory_id);
                      return <li key={idx} className="flex justify-between border-b py-2"><span>{inv?.ingredient_name}</span><span className="font-bold">Qty: {it.quantity}</span></li>
                    })}
                  </ul>
                )}
                <button onClick={submitManualPo} className="bg-gray-900 text-white px-6 py-2 rounded font-bold text-sm self-end hover:bg-gray-800 transition-colors">Submit PO</button>
              </div>
            </Card>
          )}

          <Card className="p-0 overflow-x-auto mb-6">
            <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Low Stock Items</h3></div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Ingredient</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Vendor</th>
                  <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Current Stock</th>
                  <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Par Level</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Est. Cost</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length > 0 ? lowStock.map(item => {
                  const qty = (item.par_level * 2) - (item.stock_level + (item.on_order || 0));
                  const cost = qty * item.cost_per_unit;
                  return (
                    <tr key={item._id} className="border-b border-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-800">{item.ingredient_name}</td>
                      <td className="px-4 py-4 text-gray-500">{item.vendor_name}</td>
                      <td className="px-4 py-4 text-center font-bold text-red-500">{item.stock_level} {item.unit}</td>
                      <td className="px-4 py-4 text-center text-gray-500">{item.par_level}</td>
                      <td className="px-4 py-4 text-right text-gray-700">₹{cost.toFixed(2)}</td>
                      <td className="px-6 py-4"><Pill label="Needs PO" color="orange" /></td>
                    </tr>
                  );
                }) : <tr><td colSpan={6} className="text-center text-gray-400 py-12">All stock levels are healthy.</td></tr>}
              </tbody>
            </table>
          </Card>

          <Card className="p-0 overflow-x-auto">
            <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dispatched Purchase Orders History</h3></div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Date</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Vendor</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Items</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Total Amount</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyPos.length > 0 ? historyPos.map(po => (
                  <tr key={po._id} className="border-b border-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 font-semibold text-gray-800">{po.vendor_name}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {po.items.map(i => `${i.ingredient_name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900">₹{(po.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Pill label={po.status} color={'green'} />
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="text-center text-gray-400 py-12">No PO history found.</td></tr>}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'catalog' && (
        <>
          {showAddVendor && (
            <Card className="mb-6 border-2 border-gray-900">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Add New Vendor</h3>
              <div className="flex gap-4 items-center">
                <input type="text" placeholder="Vendor Name" value={vendorForm.name} onChange={e=>setVendorForm(p=>({...p, name: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="email" placeholder="Email Address" value={vendorForm.contact_email} onChange={e=>setVendorForm(p=>({...p, contact_email: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="text" placeholder="Phone Number" value={vendorForm.phone} onChange={e=>setVendorForm(p=>({...p, phone: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <button onClick={submitVendor} className="bg-gray-900 text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors">Save</button>
              </div>
            </Card>
          )}
          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Vendor Name</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Contact</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Items Supplied</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length > 0 ? vendors.map(v => (
                  <tr key={v._id} className="border-b border-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{v.vendor_name || v.name}</td>
                    <td className="px-4 py-4 text-gray-500">{v.contact_email} {v.phone ? `| ${v.phone}` : ''}</td>
                    <td className="px-4 py-4 text-gray-500">{v.itemCount || 0} items</td>
                    <td className="px-6 py-4"><Pill label={v.vetted ? 'Vetted' : 'New'} color={v.vetted ? 'green' : 'gray'} /></td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center text-gray-400 py-12">No vendors listed.</td></tr>}
              </tbody>
            </table>
          </Card>
        </>
      )}
      
      {tab === 'receiving' && (
        <Card className="p-0 overflow-x-auto">
          <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending Shipments</h3></div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">PO Date</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Vendor</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Items Expected</th>
                <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingPos.length > 0 ? pendingPos.map(po => (
                <tr key={po._id} className="border-b border-gray-50">
                  <td className="px-6 py-4 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4 font-semibold text-gray-800">{po.vendor_name}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {po.items.map(i => `${i.ingredient_name} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => receivePo(po._id)} className="bg-teal-500 text-white px-4 py-2 rounded text-xs font-bold shadow hover:bg-teal-600 transition-colors">Mark Received</button>
                  </td>
                </tr>
              )) : <tr><td colSpan={4} className="text-center text-gray-400 py-12">No pending purchase orders to receive.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
// ─── Panel 5: Finance ──────────────────────────────────────────────────────────────
const FinancePanel = () => {
  const [tab, setTab] = React.useState('revenue');
  const [filter, setFilter] = React.useState('day');
  const [data, setData] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const [showAddShift, setShowAddShift] = React.useState(false);
  const [shiftForm, setShiftForm] = React.useState({ name: '', startTime: '', endTime: '' });

  const fetchData = React.useCallback(() => {
    fetch(`${API}/api/admin/finance/report?filter=${filter}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [filter]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const submitShift = async () => {
    if(!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) return showToast('All fields required', 'error');
    const r = await fetch(`${API}/api/admin/shifts`, { method: 'POST', headers:{'Content-Type': 'application/json'}, body: JSON.stringify(shiftForm) });
    if(r.ok) {
      showToast('Shift created');
      setShiftForm({ name: '', startTime: '', endTime: ''});
      setShowAddShift(false);
      fetchData();
    } else {
      showToast('Error creating shift', 'error');
    }
  };

  const deleteShift = async (id) => {
    if(!window.confirm('Delete shift?')) return;
    const r = await fetch(`${API}/api/admin/shifts/${id}`, { method: 'DELETE' });
    if(r.ok) { showToast('Shift deleted'); fetchData(); }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <SectionHeader icon="account_balance" title="Global Finance" subtitle="Revenue reconciliation, tax breakdown, and shift audits" />
      </div>

      <div className="flex items-center justify-between">
        <TabBar tabs={[{ key: 'revenue', label: 'Revenue' }, { key: 'shifts', label: 'Shift Audits' }]} active={tab} onChange={setTab} />
        
        {tab === 'revenue' ? (
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-gray-400 text-[18px]">calendar_today</span>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-transparent text-sm font-semibold text-gray-700 outline-none">
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        ) : (
          <button onClick={() => setShowAddShift(!showAddShift)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Shift
          </button>
        )}
      </div>

      {tab === 'revenue' && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">payments</span></div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gross Revenue</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">₹{(data.grossRevenue || 0).toFixed(2)}</div>
            </Card>
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">receipt_long</span></div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GST Collected (18%)</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">₹{(data.gstAmount || 0).toFixed(2)}</div>
            </Card>
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">account_balance_wallet</span></div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net After Tax</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">₹{(data.netAfterTax || 0).toFixed(2)}</div>
            </Card>
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">list_alt</span></div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.orderCount || 0}</div>
            </Card>
          </div>

          <Card className="p-0 overflow-x-auto mt-2">
            <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Orders</h3></div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Order ID</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Amount</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Status</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders && data.recentOrders.length > 0 ? data.recentOrders.map(o => (
                  <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{o._id.substring(o._id.length - 8).toUpperCase()}</td>
                    <td className="px-4 py-4 font-bold text-gray-700">₹{o.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-4"><Pill label={o.status} color="green" /></td>
                    <td className="px-6 py-4 text-right text-gray-500">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center text-gray-400 py-12">No transaction history yet.</td></tr>}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'shifts' && data && (
        <>
          {showAddShift && (
            <Card className="mb-6 border-2 border-gray-900">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Add Shift Profile</h3>
              <div className="flex gap-4 items-center">
                <input type="text" placeholder="Shift Name (e.g. Morning)" value={shiftForm.name} onChange={e=>setShiftForm(p=>({...p, name: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="time" value={shiftForm.startTime} onChange={e=>setShiftForm(p=>({...p, startTime: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="time" value={shiftForm.endTime} onChange={e=>setShiftForm(p=>({...p, endTime: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <button onClick={submitShift} className="bg-gray-900 text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors">Save</button>
              </div>
            </Card>
          )}
          <Card className="p-0 overflow-x-auto">
            <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shift Audits</h3></div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Shift Name</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Hours</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Revenue Generated</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.shifts && data.shifts.length > 0 ? data.shifts.map(s => (
                  <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{s.shift}</td>
                    <td className="px-4 py-4 text-gray-500">{s.hours}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">₹{(s.revenue || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      {s._id && <button onClick={() => deleteShift(s._id)} className="text-red-500 hover:text-red-700 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>}
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center text-gray-400 py-12">No shifts recorded.</td></tr>}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
// ─── Panel 6: System Admin ─────────────────────────────────────────────────────────
const SystemAdminPanel = () => {
  const [tab, setTab] = React.useState('staff');
  const [staff, setStaff] = React.useState([]);
  const [hardware, setHardware] = React.useState([]);
  const [logs, setLogs] = React.useState([]);
  const [toast, setToast] = React.useState(null);

  const [showAddStaff, setShowAddStaff] = React.useState(false);
  const [staffForm, setStaffForm] = React.useState({ username: '', role: 'Host', password: '' });

  const [showAddHardware, setShowAddHardware] = React.useState(false);
  const [hardwareForm, setHardwareForm] = React.useState({ name: '', type: 'Customer Kiosk', mac: '' });

  const fetchData = React.useCallback(() => {
    fetch(`${API}/api/admin/staff`).then(r => r.json()).then(setStaff).catch(console.error);
    fetch(`${API}/api/admin/hardware`).then(r => r.json()).then(setHardware).catch(console.error);
    fetch(`${API}/api/admin/auditlogs`).then(r => r.json()).then(setLogs).catch(console.error);
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const submitStaff = async () => {
    if(!staffForm.username || !staffForm.password) return showToast('Fields required', 'error');
    const r = await fetch(`${API}/api/admin/staff`, { method: 'POST', headers:{'Content-Type': 'application/json'}, body: JSON.stringify(staffForm) });
    if(r.ok) { showToast('Staff added'); setShowAddStaff(false); setStaffForm({username:'', role:'Host', password:''}); fetchData(); } else showToast('Error', 'error');
  };

  const deleteStaff = async (id) => {
    if(!window.confirm('Delete user?')) return;
    const r = await fetch(`${API}/api/admin/staff/${id}`, { method: 'DELETE' });
    if(r.ok) { showToast('Staff deleted'); fetchData(); } else showToast('Error', 'error');
  };

  const submitHardware = async () => {
    if(!hardwareForm.name || !hardwareForm.mac) return showToast('Fields required', 'error');
    const r = await fetch(`${API}/api/admin/hardware`, { method: 'POST', headers:{'Content-Type': 'application/json'}, body: JSON.stringify(hardwareForm) });
    if(r.ok) { showToast('Hardware added'); setShowAddHardware(false); setHardwareForm({name:'', type:'Customer Kiosk', mac:''}); fetchData(); } else showToast('Error', 'error');
  };

  const deleteHardware = async (id) => {
    if(!window.confirm('Deprovision hardware?')) return;
    const r = await fetch(`${API}/api/admin/hardware/${id}`, { method: 'DELETE' });
    if(r.ok) { showToast('Hardware removed'); fetchData(); } else showToast('Error', 'error');
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <SectionHeader icon="admin_panel_settings" title="System Administration" subtitle="User roles, POS integration, and settings" />
      </div>

      <div className="flex items-center justify-between">
        <TabBar tabs={[{ key: 'staff', label: 'Staff' }, { key: 'hardware', label: 'Hardware' }, { key: 'logs', label: 'Audit Logs' }]} active={tab} onChange={setTab} />
        
        {tab === 'staff' && (
          <button onClick={() => setShowAddStaff(!showAddStaff)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Staff
          </button>
        )}

        {tab === 'hardware' && (
          <button onClick={() => setShowAddHardware(!showAddHardware)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Hardware
          </button>
        )}
      </div>

      {tab === 'staff' && (
        <>
          {showAddStaff && (
            <Card className="mb-6 border-2 border-gray-900">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Add Staff Account</h3>
              <div className="flex gap-4 items-center">
                <input type="text" placeholder="Username" value={staffForm.username} onChange={e=>setStaffForm(p=>({...p, username: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <select value={staffForm.role} onChange={e=>setStaffForm(p=>({...p, role: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1">
                  <option value="Admin">Admin</option>
                  <option value="Host">Host</option>
                  <option value="Kitchen">Kitchen</option>
                </select>
                <input type="password" placeholder="Password" value={staffForm.password} onChange={e=>setStaffForm(p=>({...p, password: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <button onClick={submitStaff} className="bg-gray-900 text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors">Save</button>
              </div>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {staff.length > 0 ? staff.map(u => (
              <Card key={u._id} className="flex flex-col gap-3 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteStaff(u._id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    <Pill label={u.role} color={u.role === 'Admin' ? 'indigo' : 'gray'} />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-lg font-bold text-gray-800">{u.username}</h3>
                  <p className="text-xs text-gray-400 mt-1">System Access Granted</p>
                </div>
              </Card>
            )) : <p className="text-gray-400 text-sm">No staff records.</p>}
          </div>
        </>
      )}

      {tab === 'hardware' && (
        <>
          {showAddHardware && (
            <Card className="mb-6 border-2 border-gray-900">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Provision Hardware</h3>
              <div className="flex gap-4 items-center">
                <input type="text" placeholder="Device Name" value={hardwareForm.name} onChange={e=>setHardwareForm(p=>({...p, name: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <select value={hardwareForm.type} onChange={e=>setHardwareForm(p=>({...p, type: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1">
                  <option value="Customer Kiosk">Customer Kiosk</option>
                  <option value="KDS Screen">KDS Screen</option>
                  <option value="Host Tablet">Host Tablet</option>
                </select>
                <input type="text" placeholder="MAC Address (AA:BB:...)" value={hardwareForm.mac} onChange={e=>setHardwareForm(p=>({...p, mac: e.target.value}))} className="px-4 py-2 border border-gray-200 rounded flex-1 font-mono text-sm" />
                <button onClick={submitHardware} className="bg-gray-900 text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors">Save</button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {hardware.length > 0 ? hardware.map(d => (
              <Card key={d._id} className="flex flex-col gap-3 relative overflow-hidden group border-t-4 border-t-teal-500">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500">
                    <span className="material-symbols-outlined">{d.type.includes('Kiosk') ? 'tablet_mac' : 'desktop_windows'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteHardware(d._id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    <Pill label={d.status} color={d.status === 'Online' ? 'green' : 'red'} />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-md font-bold text-gray-800">{d.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{d.type}</p>
                  <p className="text-[10px] font-mono text-gray-400 mt-2">{d.mac}</p>
                </div>
              </Card>
            )) : <p className="text-gray-400 text-sm">No hardware provisioned.</p>}
          </div>
        </>
      )}

      {tab === 'logs' && (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Timestamp</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">User</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Action</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map(l => (
                <tr key={l._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-4 font-semibold text-gray-800">{l.user}</td>
                  <td className="px-4 py-4 text-gray-700">{l.action}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{l.details}</td>
                </tr>
              )) : <tr><td colSpan={4} className="text-center text-gray-400 py-12">No audit logs available.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
// ─── Main Module Container ─────────────────────────────────────────────────────────

const ModuleC = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const navigate = useNavigate();

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPanel />;
      case 'menu': return <MenuEngineeringPanel />;
      case 'inventory': return <InventoryPanel />;
      case 'procurement': return <ProcurementPanel />;
      case 'finance': return <FinancePanel />;
      case 'admin': return <SystemAdminPanel />;
      default: return <DashboardPanel />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'menu', label: 'Menu Engineering' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'procurement', label: 'Procurement' },
    { id: 'finance', label: 'Finance' },
    { id: 'admin', label: 'System Admin' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-[#c59a63]/30 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img src="/techhansa-logo.png" alt="TechHansa Logo" className="h-16 object-contain" />
            <span className="text-lg font-black tracking-tight text-[#c59a63]">Pragati RMS</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
            <button onClick={() => navigate('/sales-and-operations')} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Connect POS
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 overflow-x-hidden">
        {renderPanel()}
      </main>
    </div>
  );
};

export default ModuleC;
