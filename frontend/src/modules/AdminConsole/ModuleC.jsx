import React, { useState, useEffect, useCallback, useRef } from 'react';
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
        className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${active === t.key
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
  <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl transition-all ${type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'
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
  const [metrics, setMetrics] = useState({ dailyRevenue: 0, previousRevenue: 0, revenueGrowthPct: null, theoreticalMargin: 28.4, inventoryValuation: 0, parAlerts: [], totalOrdersToday: 0, previousOrderCount: 0, orderCountDelta: 0, pendingOrdersToday: 0, deliveredOrdersToday: 0, dineInCount: 0, takeawayCount: 0, floorOccupancy: 0, activeTables: 0, totalTables: 0, topSellers: [], avgWaitTimeSeconds: 0, cancellationsToday: 0, paymentUpiCardPct: 0, paymentCashPct: 0 });
  const [inventory, setInventory] = useState([]);
  const [toast, setToast] = useState(null);
  const [timeFilter, setTimeFilter] = useState('day');
  const [orderDate, setOrderDate] = useState('');
  const [orderCount, setOrderCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateInputRef = useRef(null);

  const fetchMetrics = useCallback(() => {
    let url = `${API}/api/admin/metrics?filter=${timeFilter}`;
    if (timeFilter === 'custom' && orderDate) url += `&date=${orderDate}`;
    return Promise.all([
      fetch(url).then(r => r.json()).then(setMetrics).catch(console.error),
      fetch(`${API}/api/admin/inventory`).then(r => r.json()).then(setInventory).catch(console.error)
    ]);
  }, [timeFilter, orderDate]);

  const fetchOrderCount = useCallback(() => {
    let url = `${API}/api/admin/orders/count?filter=${timeFilter}`;
    if (timeFilter === 'custom' && orderDate) url += `&date=${orderDate}`;
    return fetch(url).then(r => r.json()).then(data => setOrderCount(data.count)).catch(console.error);
  }, [timeFilter, orderDate]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchOrderCount(); }, [fetchOrderCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchMetrics(), fetchOrderCount()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Overview Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Daily / Weekly / Monthly pill toggle */}
          <div className="flex items-center bg-gray-900 rounded-full p-1">
            {[['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].map(([f, label]) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${timeFilter === f ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="relative flex items-center cursor-pointer" onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm pointer-events-none">
              <span className="material-symbols-outlined text-[16px] text-gray-400">calendar_today</span>
              <span>
                {timeFilter === 'custom' && orderDate
                  ? new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : timeFilter === 'week' ? 'This Week'
                    : timeFilter === 'month' ? 'This Month'
                      : `Today, ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                }
              </span>
              <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={orderDate || new Date().toISOString().split('T')[0]}
              onChange={e => {
                setOrderDate(e.target.value);
                setTimeFilter('custom');
              }}
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', bottom: 0, left: '50%', opacity: 0, pointerEvents: 'none' }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className={`w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm transition-all hover:shadow-md ${isRefreshing ? 'animate-spin opacity-70 pointer-events-none' : ''}`}
            title="Refresh"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* 1. Gross Revenue */}
        <div className="bg-[#FEFDF5] rounded-2xl p-5 border border-amber-100/60 shadow-sm flex flex-col min-h-[150px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-green-600 text-[17px]">payments</span>
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">Gross Revenue</span>
          </div>
          <div className="text-[2.4rem] font-bold tracking-tight text-gray-900 leading-none">
            ₹{metrics.dailyRevenue.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {metrics.revenueGrowthPct !== null ? (
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${metrics.revenueGrowthPct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                <span className="material-symbols-outlined text-[12px]">{metrics.revenueGrowthPct >= 0 ? 'trending_up' : 'trending_down'}</span>
                {metrics.revenueGrowthPct >= 0 ? '+' : ''}{metrics.revenueGrowthPct}%
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-bold">No prior data</span>
            )}
            {metrics.previousRevenue > 0 && (
              <span className="text-xs text-gray-400">vs ₹{metrics.previousRevenue.toLocaleString('en-IN')} prev period</span>
            )}
          </div>
        </div>

        {/* 2. Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col min-h-[150px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-blue-600 text-[17px]">receipt_long</span>
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">Total Orders</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">vs last period</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[2.4rem] font-bold tracking-tight text-gray-900 leading-none">{orderCount}</span>
            {metrics.orderCountDelta !== 0 ? (
              <span className={`mb-1 px-2.5 py-1 rounded-full text-xs font-bold ${metrics.orderCountDelta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                {metrics.orderCountDelta > 0 ? '+' : ''}{metrics.orderCountDelta} orders
              </span>
            ) : (
              <span className="mb-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-bold">No change</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Dine-In: <strong className="text-gray-700">{metrics.dineInCount}</strong></span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500">Takeaway: <strong className="text-gray-700">{metrics.takeawayCount}</strong></span>
          </div>
        </div>

        {/* 3. Floor Occupancy */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col min-h-[150px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-indigo-600 text-[17px]">table_restaurant</span>
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">Floor Occupancy</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
              {metrics.activeTables || 0}/{metrics.totalTables || 0} Tables
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[2.4rem] font-bold tracking-tight text-gray-900 leading-none">{metrics.floorOccupancy}%</span>
            <span className="text-sm font-black text-indigo-500 tracking-wide">FULL</span>
          </div>
          <div className="mt-3 w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${metrics.floorOccupancy}%` }}
            />
          </div>
        </div>

        {/* 4. Inventory Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col min-h-[150px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600 text-[17px]">warning</span>
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]">Inventory Alerts</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">Action Req.</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[2.4rem] font-bold tracking-tight text-gray-900 leading-none">{metrics.parAlerts.length}</span>
            <span className="text-xs text-gray-500">items below par stock</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 truncate">
            {metrics.parAlerts.slice(0, 3).map(a => a.ingredient_name || a.name || String(a)).join(', ')}
          </p>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Orders Funnel — Pipeline */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Orders Funnel</h2>
              <p className="text-xs text-gray-400 mt-0.5">Real-time pipeline progression</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-gray-500">Live Flow</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Stage 1 — Initiated */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span className="text-sm font-bold text-gray-800">1. Initiated &amp; POS Punched</span>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {metrics.totalOrdersToday}&nbsp;<span className="text-gray-400 font-normal text-xs">(100%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 rounded-full w-full" />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Direct table orders: {Math.floor(metrics.totalOrdersToday * 0.8)}</span>
                <span>Takeaway: {Math.floor(metrics.totalOrdersToday * 0.2)}</span>
              </div>
            </div>

            {/* Stage 2 — KOT Pending */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></span>
                  <span className="text-sm font-bold text-gray-800">2. Kitchen KOT (Pending / Cooking)</span>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {metrics.pendingOrdersToday}&nbsp;<span className="text-gray-400 font-normal text-xs">({metrics.totalOrdersToday > 0 ? ((metrics.pendingOrdersToday / metrics.totalOrdersToday) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  style={{ width: metrics.totalOrdersToday > 0 ? `${(metrics.pendingOrdersToday / metrics.totalOrdersToday) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-600 font-semibold">Avg ticket wait: {Math.floor((metrics.avgWaitTimeSeconds || 0) / 60)}m {(metrics.avgWaitTimeSeconds || 0) % 60}s</span>
                <span className="text-orange-600 font-bold">{Math.ceil(metrics.pendingOrdersToday * 0.22) || 0} tickets urgent</span>
              </div>
            </div>

            {/* Stage 3 — Delivered */}
            <div className="p-4 rounded-xl bg-green-50/60 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></span>
                  <span className="text-sm font-bold text-gray-800">3. Delivered &amp; Settled</span>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {metrics.deliveredOrdersToday}&nbsp;<span className="text-gray-400 font-normal text-xs">({metrics.totalOrdersToday > 0 ? ((metrics.deliveredOrdersToday / metrics.totalOrdersToday) * 100).toFixed(1) : 0}%)</span>
                </span>
              </div>
              <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-700"
                  style={{ width: metrics.totalOrdersToday > 0 ? `${(metrics.deliveredOrdersToday / metrics.totalOrdersToday) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{metrics.cancellationsToday || 0} cancellations</span>
                <span>UPI/Card: {metrics.paymentUpiCardPct || 0}%&nbsp;•&nbsp;Cash: {metrics.paymentCashPct || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Sellers — Ranked Leaderboard */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Top Sellers</h2>
              <p className="text-xs text-gray-400 mt-0.5">Highest grossing items today</p>
            </div>
            <button className="text-sm font-bold text-[#c59a63] hover:underline">Rankings →</button>
          </div>

          <div className="flex flex-col divide-y divide-gray-50">
            {metrics.topSellers && metrics.topSellers.length > 0 ? (
              metrics.topSellers.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-300'
                      }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-tight">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.category || 'Main Course'} • {item.qty} portions sold</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{(item.revenue || item.qty * 350).toLocaleString('en-IN')}</p>
                    {item.growthPct !== null && item.growthPct !== undefined ? (
                      <p className={`text-xs font-bold ${item.growthPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {item.growthPct >= 0 ? '+' : ''}{item.growthPct}%
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">New</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">No orders today</div>
            )}
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
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'General', is_veg: false, tags: [], image_url: '' });
  const [newCategory, setNewCategory] = useState({ name: '', tags: [] });
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

  const availableTags = ['Vegan 🌱', 'Chef\'s Choice ✨', 'Gluten-Free 🌾', 'Spicy 🌶️', 'Bestseller 🔥', 'Dairy-Free 🥛', 'Nut-Free 🥜'];

  const handleImageUpload = async (file, isEdit = false) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setEditValues(p => ({ ...p, image_url: data.url }));
        } else {
          setNewItem(p => ({ ...p, image_url: data.url }));
        }
        showToast('Image uploaded successfully');
      } else {
        showToast('Image upload failed', 'error');
      }
    } catch (e) {
      showToast('Image upload failed', 'error');
    }
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return showToast('Name and price required.', 'error');
    const r = await fetch(`${API}/api/admin/menu-items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    if (r.ok) { showToast('Menu item created!'); setNewItem({ name: '', price: '', category: 'General', is_veg: false, tags: [], image_url: '' }); fetchAll(); }
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
    if (!newCategory.name) return;
    const r = await fetch(`${API}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory.name, tags: newCategory.tags }) });
    if (r.ok) { showToast('Category added!'); setNewCategory({ name: '', tags: [] }); fetchAll(); }
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
              <div className="col-span-5 flex flex-col gap-2">
                <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Item name" className="px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
                <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); }} className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                {newItem.image_url && <img src={`${API}${newItem.image_url}`} alt="preview" className="h-12 w-12 object-cover rounded-lg mt-1" />}
              </div>
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
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 mt-1">Tags:</span>
              {availableTags.map(tag => (
                <label key={tag} className="flex items-center gap-1 text-xs cursor-pointer bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 hover:bg-gray-100">
                  <input type="checkbox" checked={newItem.tags.includes(tag)} onChange={e => {
                    const checked = e.target.checked;
                    setNewItem(p => ({ ...p, tags: checked ? [...p.tags, tag] : p.tags.filter(t => t !== tag) }));
                  }} className="w-3 h-3 text-[#c59a63] border-gray-300 rounded focus:ring-[#c59a63]" />
                  {tag}
                </label>
              ))}
            </div>
            <button onClick={addMenuItem} className="mt-4 px-6 py-2.5 rounded-xl bg-[#c59a63] text-white text-sm font-bold hover:bg-[#b8895a] transition-all shadow-md shadow-[#c59a63]/20 self-start">
              + Add to Catalog
            </button>
          </Card>

          {/* Table */}
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4 w-16">Img</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Name & Tags</th>
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
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) handleImageUpload(e.target.files[0], true); }} className="text-[10px] w-24 overflow-hidden" />
                            {editValues.image_url && <img src={`${API}${editValues.image_url}`} className="w-10 h-10 object-cover rounded-lg" />}
                          </div>
                        ) : (
                          item.image_url ? <img src={`${API}${item.image_url}`} className="w-10 h-10 object-cover rounded-lg" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center leading-tight p-1">No img</div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-800">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center gap-2">
                              <input value={editValues.name} onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm w-full" />
                              <input type="checkbox" checked={editValues.is_veg} onChange={e => setEditValues(p => ({ ...p, is_veg: e.target.checked }))} className="w-4 h-4 cursor-pointer flex-shrink-0" title="Veg" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {availableTags.map(tag => (
                                <label key={tag} className="flex items-center gap-1 text-[9px] cursor-pointer bg-gray-50 px-1 py-0.5 rounded border border-gray-100 whitespace-nowrap">
                                  <input type="checkbox" checked={editValues.tags.includes(tag)} onChange={e => {
                                    const checked = e.target.checked;
                                    setEditValues(p => ({ ...p, tags: checked ? [...p.tags, tag] : p.tags.filter(t => t !== tag) }));
                                  }} className="w-2.5 h-2.5" />
                                  {tag}
                                </label>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} title={item.is_veg ? 'Veg' : 'Non-Veg'}></div>
                              {item.name}
                            </div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.map(t => <span key={t} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">{t}</span>)}
                              </div>
                            )}
                          </div>
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
                            <button onClick={() => { setEditingId(item._id); setEditValues({ name: item.name, price: item.price, category: item.category, is_veg: item.is_veg, tags: item.tags || [], image_url: item.image_url || '' }); }} className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold transition-colors">Edit</button>
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
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))} placeholder="Category Name" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63]" />
                <button onClick={addCategory} className="px-6 py-2.5 rounded-xl bg-[#c59a63] text-white text-sm font-bold hover:bg-[#b8895a] transition-all shadow-md shadow-[#c59a63]/20">
                  Add Category
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">Tags:</span>
                {availableTags.map(tag => (
                  <label key={tag} className="flex items-center gap-1 text-xs cursor-pointer bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 hover:bg-gray-100">
                    <input type="checkbox" checked={newCategory.tags.includes(tag)} onChange={e => {
                      const checked = e.target.checked;
                      setNewCategory(p => ({ ...p, tags: checked ? [...p.tags, tag] : p.tags.filter(t => t !== tag) }));
                    }} className="w-3 h-3 text-[#c59a63] border-gray-300 rounded focus:ring-[#c59a63]" />
                    {tag}
                  </label>
                ))}
                {newCategory.tags.filter(t => !availableTags.includes(t)).map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-[#c59a63]/10 text-[#c59a63] px-2 py-1 rounded-lg border border-[#c59a63]/20">
                    {tag}
                    <button onClick={() => setNewCategory(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} className="hover:text-red-500 font-bold ml-1">&times;</button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ New Tag"
                  className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none w-24 focus:border-[#c59a63] transition-colors"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (!newCategory.tags.includes(val)) {
                        setNewCategory(p => ({ ...p, tags: [...p.tags, val] }));
                      }
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Existing Categories</h3>
            <div className="flex flex-col gap-2">
              {customCategories.map(c => (
                <div key={c._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-gray-800">{c.name}</span>
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map(t => <span key={t} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">{t}</span>)}
                      </div>
                    )}
                  </div>
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

  const dispatchPo = async (id) => {
    const r = await fetch(`${API}/api/admin/po/${id}/dispatch`, { method: 'POST' });
    const d = await r.json();
    if (r.ok) { showToast(d.message); fetchData(); } else showToast(d.error, 'error');
  };

  const autoDispatch = async () => {
    const r = await fetch(`${API}/api/admin/po/dispatch`, { method: 'POST' });
    const d = await r.json();
    if (r.ok) { showToast(d.message || 'Auto-dispatch complete'); fetchData(); } else showToast(d.error, 'error');
  };

  const submitVendor = async () => {
    if (!vendorForm.name) return showToast('Vendor name required', 'error');
    const r = await fetch(`${API}/api/admin/vendors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vendorForm) });
    const d = await r.json();
    if (r.ok) { showToast('Vendor added'); setVendorForm({ name: '', contact_email: '', phone: '' }); setShowAddVendor(false); fetchData(); } else showToast(d.error, 'error');
  }

  const addPoItem = () => {
    if (!poItemForm.inventory_id || !poItemForm.quantity) return;
    setPoForm(p => ({ ...p, items: [...p.items, poItemForm] }));
    setPoItemForm({ inventory_id: '', quantity: '' });
  }

  const submitManualPo = async () => {
    if (!poForm.vendor_name || poForm.items.length === 0) return showToast('Vendor and items required', 'error');
    const r = await fetch(`${API}/api/admin/po/manual`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(poForm) });
    const d = await r.json();
    if (r.ok) { showToast('PO Created'); setPoForm({ vendor_name: '', items: [] }); setShowManualPo(false); fetchData(); } else showToast(d.error, 'error');
  }

  const lowStock = inventory.filter(i => (i.stock_level + (i.on_order || 0)) <= i.par_level);
  const pendingPos = pos.filter(p => p.status === 'pending');
  const dispatchedPos = pos.filter(p => p.status === 'dispatched');
  const historyPos = pos.filter(p => p.status === 'received');

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
            <button onClick={autoDispatch} className="flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500 text-white text-sm font-bold shadow-md hover:bg-amber-600 transition-all">
              <span className="material-symbols-outlined text-[18px]">send</span> Auto-Dispatch Low Stock
            </button>
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
                <select value={poForm.vendor_name} onChange={e => setPoForm(p => ({ ...p, vendor_name: e.target.value }))} className="px-4 py-2 rounded border border-gray-200">
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => <option key={v._id} value={v.vendor_name || v.name}>{v.vendor_name || v.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <select value={poItemForm.inventory_id} onChange={e => setPoItemForm(p => ({ ...p, inventory_id: e.target.value }))} className="px-4 py-2 rounded border border-gray-200 flex-1">
                    <option value="">-- Select Ingredient --</option>
                    {inventory.map(i => <option key={i._id} value={i._id}>{i.ingredient_name}</option>)}
                  </select>
                  <input type="number" placeholder="Qty" value={poItemForm.quantity} onChange={e => setPoItemForm(p => ({ ...p, quantity: e.target.value }))} className="w-24 px-4 py-2 rounded border border-gray-200" />
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

          {/* Pending POs — awaiting dispatch */}
          {pendingPos.length > 0 && (
            <Card className="p-0 overflow-x-auto">
              <div className="p-6 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending Purchase Orders</h3>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full">{pendingPos.length} pending</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Date</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Vendor</th>
                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Items</th>
                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Total</th>
                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPos.map(po => (
                    <tr key={po._id} className="border-b border-gray-50">
                      <td className="px-6 py-4 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 font-semibold text-gray-800">{po.vendor_name}</td>
                      <td className="px-4 py-4 text-xs text-gray-500">{po.items.map(i => `${i.ingredient_name} (${i.quantity})`).join(', ')}</td>
                      <td className="px-4 py-4 text-right font-bold text-gray-900">₹{(po.total_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => dispatchPo(po._id)} className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-amber-600 transition-colors">
                          Mark Dispatched
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* PO History — dispatched and received */}
          <Card className="p-0 overflow-x-auto">
            <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Purchase Order History</h3></div>
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
                {[...dispatchedPos, ...historyPos].length > 0 ? [...dispatchedPos, ...historyPos].map(po => (
                  <tr key={po._id} className="border-b border-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 font-semibold text-gray-800">{po.vendor_name}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">{po.items.map(i => `${i.ingredient_name} (${i.quantity})`).join(', ')}</td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900">₹{(po.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Pill label={po.status} color={po.status === 'received' ? 'green' : 'orange'} />
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
                <input type="text" placeholder="Vendor Name" value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="email" placeholder="Email Address" value={vendorForm.contact_email} onChange={e => setVendorForm(p => ({ ...p, contact_email: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="text" placeholder="Phone Number" value={vendorForm.phone} onChange={e => setVendorForm(p => ({ ...p, phone: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
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
          <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dispatched — Awaiting Delivery</h3></div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">PO Date</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Vendor</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Items Expected</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Status</th>
                <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...dispatchedPos, ...pendingPos].length > 0 ? [...dispatchedPos, ...pendingPos].map(po => (
                <tr key={po._id} className="border-b border-gray-50">
                  <td className="px-6 py-4 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4 font-semibold text-gray-800">{po.vendor_name}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">{po.items.map(i => `${i.ingredient_name} (${i.quantity})`).join(', ')}</td>
                  <td className="px-4 py-4"><Pill label={po.status} color={po.status === 'dispatched' ? 'orange' : 'gray'} /></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => receivePo(po._id)} className="bg-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-teal-600 transition-colors">Mark Received</button>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="text-center text-gray-400 py-12">No dispatched orders awaiting delivery.</td></tr>}
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

  const [taxes, setTaxes] = React.useState([]);
  const [taxForm, setTaxForm] = React.useState({ name: '', rate: '' });
  const [showAddTax, setShowAddTax] = React.useState(false);

  const fetchTaxes = React.useCallback(() => {
    fetch(`${API}/api/admin/tax-config`)
      .then(res => res.json())
      .then(setTaxes)
      .catch(console.error);
  }, []);

  const submitTax = async () => {
    if (!taxForm.name || !taxForm.rate) return showToast('All fields required', 'error');
    const r = await fetch(`${API}/api/admin/tax-config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: taxForm.name, rate: parseFloat(taxForm.rate) / 100 }) });
    if (r.ok) { showToast('Tax created'); setTaxForm({ name: '', rate: '' }); setShowAddTax(false); fetchTaxes(); fetchData(); }
    else showToast('Error creating tax', 'error');
  };

  const deleteTax = async (id) => {
    if (!window.confirm('Delete this tax?')) return;
    const r = await fetch(`${API}/api/admin/tax-config/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Tax deleted'); fetchTaxes(); fetchData(); }
  };

  const fetchData = React.useCallback(() => {
    fetch(`${API}/api/admin/finance/report?filter=${filter}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, [filter]);

  React.useEffect(() => { fetchData(); fetchTaxes(); }, [fetchData, fetchTaxes]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const submitShift = async () => {
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) return showToast('All fields required', 'error');
    const r = await fetch(`${API}/api/admin/shifts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(shiftForm) });
    if (r.ok) {
      showToast('Shift created');
      setShiftForm({ name: '', startTime: '', endTime: '' });
      setShowAddShift(false);
      fetchData();
    } else {
      showToast('Error creating shift', 'error');
    }
  };

  const deleteShift = async (id) => {
    if (!window.confirm('Delete shift?')) return;
    const r = await fetch(`${API}/api/admin/shifts/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Shift deleted'); fetchData(); }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <SectionHeader icon="account_balance" title="Global Finance" subtitle="Revenue reconciliation, tax breakdown, and shift audits" />
      </div>

      <div className="flex items-center justify-between">
        <TabBar tabs={[{ key: 'revenue', label: 'Revenue' }, { key: 'taxes', label: 'Taxes' }, { key: 'shifts', label: 'Shift Audits' }]} active={tab} onChange={setTab} />

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
        ) : tab === 'shifts' ? (
          <button onClick={() => setShowAddShift(!showAddShift)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Shift
          </button>
        ) : null}
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
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax Collected</h3>
              </div>
              <div className="text-3xl font-bold text-gray-900">₹{(data.totalTaxAmount || 0).toFixed(2)}</div>
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

      {tab === 'taxes' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddTax(!showAddTax)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-bold shadow-md hover:bg-gray-800 transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span> Add Tax
            </button>
          </div>
          {showAddTax && (
            <Card className="mb-6 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">New Tax Configuration</h3>
              <div className="flex gap-4 items-center">
                <input type="text" placeholder="Tax Name (e.g. SGST)" value={taxForm.name} onChange={e => setTaxForm(p => ({ ...p, name: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="number" step="0.1" placeholder="Rate (e.g. 10 for 10%)" value={taxForm.rate} onChange={e => setTaxForm(p => ({ ...p, rate: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <button onClick={submitTax} className="bg-gray-900 text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors">Save</button>
              </div>
            </Card>
          )}
          <Card className="p-0 overflow-x-auto">
            <div className="p-6 pb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Taxes</h3></div>
            <table className="w-full text-left text-sm whitespace-nowrap mt-2">
              <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-4 py-4">Rate</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes && taxes.length > 0 ? taxes.map(t => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-800">{t.name}</td>
                    <td className="px-4 py-4 font-semibold text-gray-700">{(t.rate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-4"><Pill label={t.is_active ? 'Active' : 'Inactive'} color={t.is_active ? 'green' : 'gray'} /></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteTax(t._id)} className="text-gray-400 hover:text-red-500 transition-colors p-2"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center text-gray-400 py-12">No taxes configured. Defaults will apply.</td></tr>}
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
                <input type="text" placeholder="Shift Name (e.g. Morning)" value={shiftForm.name} onChange={e => setShiftForm(p => ({ ...p, name: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="time" value={shiftForm.startTime} onChange={e => setShiftForm(p => ({ ...p, startTime: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <input type="time" value={shiftForm.endTime} onChange={e => setShiftForm(p => ({ ...p, endTime: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
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

// ─── Panel 5.5: Packages ─────────────────────────────────────────────────────────

const PackagesPanel = () => {
  const [packages, setPackages] = React.useState([]);
  const [menuItems, setMenuItems] = React.useState([]);
  const [toast, setToast] = React.useState(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', description: '', pricing_type: 'free', price: 0, menu_items: [] });

  const fetchData = React.useCallback(() => {
    fetch(`${API}/api/admin/packages`).then(r => r.json()).then(setPackages).catch(console.error);
    fetch(`${API}/api/admin/menu-items`).then(r => r.json()).then(setMenuItems).catch(console.error);
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const submitForm = async () => {
    if (!form.name) return showToast('Name is required', 'error');
    const r = await fetch(`${API}/api/admin/packages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (r.ok) {
      showToast('Package created');
      setShowAddForm(false);
      setForm({ name: '', description: '', pricing_type: 'free', price: 0, menu_items: [] });
      fetchData();
    } else showToast('Error', 'error');
  };

  const deletePackage = async (id) => {
    if (!window.confirm('Delete package?')) return;
    const r = await fetch(`${API}/api/admin/packages/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Package deleted'); fetchData(); } else showToast('Error', 'error');
  };

  const toggleMenuItem = (id) => {
    setForm(p => {
      const exists = p.menu_items.includes(id);
      return { ...p, menu_items: exists ? p.menu_items.filter(x => x !== id) : [...p.menu_items, id] };
    });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <SectionHeader icon="loyalty" title="Packages" subtitle="Manage special packages like Birthdays and Anniversaries" />
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#c59a63] text-white text-sm font-bold shadow-md shadow-[#c59a63]/30 hover:bg-[#b8895a] transition-all">
          <span className="material-symbols-outlined text-[18px]">{showAddForm ? 'close' : 'add'}</span> {showAddForm ? 'Cancel' : 'Create Package'}
        </button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Create New Package</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Package Name (e.g. Birthday Special)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded" />
            <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded" />
            <select value={form.pricing_type} onChange={e => setForm(p => ({ ...p, pricing_type: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded">
              <option value="free">Free Add-on</option>
              <option value="per_person">Price Per Person</option>
            </select>
            {form.pricing_type === 'per_person' && (
              <input type="number" placeholder="Price (₹)" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} className="px-4 py-2 border border-gray-200 rounded" />
            )}

            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Included Menu Items</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                {menuItems.map(item => (
                  <label key={item._id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm">
                    <input type="checkbox" checked={form.menu_items.includes(item._id)} onChange={() => toggleMenuItem(item._id)} className="w-4 h-4 text-gray-900 border-gray-300 rounded" />
                    <span>{item.name} <span className="text-gray-400">₹{item.price}</span></span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={submitForm} className="bg-[#c59a63] text-white px-6 py-2 rounded-full font-bold shadow-md shadow-[#c59a63]/30 hover:bg-[#b8895a] transition-all">Save Package</button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {packages.length > 0 ? packages.map(pkg => (
          <Card key={pkg._id} className="flex flex-col gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                <span className="material-symbols-outlined">loyalty</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => deletePackage(pkg._id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
                <Pill label={pkg.pricing_type === 'free' ? 'Free' : `₹${pkg.price}/person`} color={pkg.pricing_type === 'free' ? 'green' : 'indigo'} />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-lg font-bold text-gray-800">{pkg.name}</h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{pkg.description || 'No description'}</p>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500">{pkg.menu_items?.length || 0} items included</p>
            </div>
          </Card>
        )) : <p className="text-gray-400 text-sm">No packages created yet.</p>}
      </div>
    </div>
  );
};

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
    if (!staffForm.username || !staffForm.password) return showToast('Fields required', 'error');
    const r = await fetch(`${API}/api/admin/staff`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staffForm) });
    if (r.ok) { showToast('Staff added'); setShowAddStaff(false); setStaffForm({ username: '', role: 'Host', password: '' }); fetchData(); } else showToast('Error', 'error');
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Delete user?')) return;
    const r = await fetch(`${API}/api/admin/staff/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Staff deleted'); fetchData(); } else showToast('Error', 'error');
  };

  const submitHardware = async () => {
    if (!hardwareForm.name || !hardwareForm.mac) return showToast('Fields required', 'error');
    const r = await fetch(`${API}/api/admin/hardware`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hardwareForm) });
    if (r.ok) { showToast('Hardware added'); setShowAddHardware(false); setHardwareForm({ name: '', type: 'Customer Kiosk', mac: '' }); fetchData(); } else showToast('Error', 'error');
  };

  const deleteHardware = async (id) => {
    if (!window.confirm('Deprovision hardware?')) return;
    const r = await fetch(`${API}/api/admin/hardware/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Hardware removed'); fetchData(); } else showToast('Error', 'error');
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
                <input type="text" placeholder="Username" value={staffForm.username} onChange={e => setStaffForm(p => ({ ...p, username: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1">
                  <option value="Admin">Admin</option>
                  <option value="Host">Host</option>
                  <option value="Kitchen">Kitchen</option>
                </select>
                <input type="password" placeholder="Password" value={staffForm.password} onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
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
                <input type="text" placeholder="Device Name" value={hardwareForm.name} onChange={e => setHardwareForm(p => ({ ...p, name: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1" />
                <select value={hardwareForm.type} onChange={e => setHardwareForm(p => ({ ...p, type: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1">
                  <option value="Customer Kiosk">Customer Kiosk</option>
                  <option value="KDS Screen">KDS Screen</option>
                  <option value="Host Tablet">Host Tablet</option>
                </select>
                <input type="text" placeholder="MAC Address (AA:BB:...)" value={hardwareForm.mac} onChange={e => setHardwareForm(p => ({ ...p, mac: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded flex-1 font-mono text-sm" />
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
      case 'packages': return <PackagesPanel />;
      case 'admin': return <SystemAdminPanel />;
      default: return <DashboardPanel />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'menu', label: 'Menu Engineering' },
    { id: 'packages', label: 'Packages' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'procurement', label: 'Procurement' },
    { id: 'finance', label: 'Finance' },
    { id: 'admin', label: 'System Admin' },
  ];

  return (
    <div
      className="min-h-screen font-sans selection:bg-[#c59a63]/30 flex flex-col"
      style={{
        backgroundColor: '#f8f9ff',
        backgroundImage: [
          'radial-gradient(ellipse 65% 55% at 0% 0%, rgba(255, 210, 150, 0.28) 0%, transparent 65%)',
          'radial-gradient(ellipse 70% 60% at 100% 100%, rgba(196, 215, 255, 0.22) 0%, transparent 65%)',
          'linear-gradient(rgba(148, 163, 200, 0.12) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(148, 163, 200, 0.12) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '100% 100%, 100% 100%, 28px 28px, 28px 28px',
      }}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-5 h-[90px] flex items-center justify-between gap-4">

          {/* Logo Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/techhansa-logo.png" alt="Pragati RMS" className="h-16 w-auto object-contain" />
            <span className="text-3xl font-black tracking-tight text-[#c59a63] hidden sm:block">
              Pragati RMS
            </span>
          </div>

          {/* Navigation Links — pill tab bar */}
          <nav className="hidden lg:flex items-center bg-gray-100 rounded-full p-1 gap-0.5 mx-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${activeTab === item.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/sales-and-operations')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-gray-200 text-[13px] font-bold text-gray-700 hover:border-green-400 hover:text-green-700 transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></span>
              Connect POS
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-[13px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 transition-all"
              title="Log Out"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 pt-3 pb-6 md:px-8 md:pt-4 md:pb-8 overflow-x-hidden">
        {renderPanel()}
      </main>
    </div>
  );
};

export default ModuleC;
