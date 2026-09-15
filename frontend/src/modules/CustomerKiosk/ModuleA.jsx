import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API = 'http://localhost:3000';
const GST_RATE = 0.09;
const SERVICE_CHARGE = 0.05;
const LS_KEY = 'pragati_kiosk_table_id';

// ΓöÇΓöÇΓöÇ Live Menu Data (Fetched from backend) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

// ΓöÇΓöÇΓöÇ Small Reusable Components ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const Badge = ({ text, color = 'gold' }) => {
  const cls = { gold: 'bg-[#c59a63]/10 text-[#c59a63]', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-600', gray: 'bg-gray-100 text-gray-500' };
  return <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cls[color] || cls.gray}`}>{text}</span>;
};

const Stepper = ({ qty, onMinus, onPlus }) => (
  <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1">
    <button onClick={onMinus} className="w-7 h-7 rounded-full bg-white shadow-sm text-gray-600 font-bold flex items-center justify-center hover:bg-gray-100 transition-colors">-</button>
    <span className="w-5 text-center font-black text-sm text-gray-800">{qty}</span>
    <button onClick={onPlus} className="w-7 h-7 rounded-full bg-[#c59a63] shadow-sm text-white font-bold flex items-center justify-center hover:bg-[#b8895a] transition-colors">+</button>
  </div>
);

const Toast = ({ message, visible }) => (
  <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-2xl flex items-center gap-2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
    <span className="material-symbols-outlined text-[#c59a63] text-[16px]">check_circle</span>
    {message}
  </div>
);

const BG = () => (
  <>
    <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#c59a63]/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
  </>
);

// ΓöÇΓöÇΓöÇ PHASE 1 : Table Discovery Screen ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const TableDiscoveryScreen = ({ onBound }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [binding, setBinding] = useState(null);
  const [error, setError] = useState('');

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/kiosk/tables`);
      const data = await res.json();
      setTables(data);
    } catch {
      setError('Cannot reach server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleBind = async (tableId) => {
    setBinding(tableId);
    setError('');
    try {
      const res = await fetch(`${API}/api/kiosk/bind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Binding failed.'); setBinding(null); return; }
      // Persist to localStorage — survives refresh / reboot
      localStorage.setItem(LS_KEY, tableId);
      onBound(tableId);
    } catch {
      setError('Network error. Please try again.');
      setBinding(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#c59a6330 2px, transparent 2px)', backgroundSize: '28px 28px' }}>
      <BG />
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <img src="/techhansa-logo.png" alt="Pragati RMS" className="w-14 h-14 object-contain mb-3" />
          <h1 className="text-2xl font-black text-[#c59a63]">Pragati RMS</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Device Setup — Select Table</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[28px] p-8 shadow-[0_8px_32px_rgb(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-black text-lg text-gray-800">Bind This Tablet</h2>
              <p className="text-xs text-gray-400">Tap a table to permanently assign this device.</p>
            </div>
            <button onClick={fetchTables} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">error</span>{error}</div>}

          {loading ? (
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {tables.map(table => {
                const isOccupied = table.status === 'occupied';
                const isBinding = binding === table.id;
                return (
                  <button
                    key={table.id}
                    onClick={() => !isOccupied && handleBind(table.id)}
                    disabled={isOccupied || !!binding}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-sm transition-all border-2 ${isOccupied
                        ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                        : isBinding
                          ? 'bg-[#c59a63] border-[#c59a63] text-white scale-95'
                          : 'bg-white border-gray-100 text-gray-700 hover:border-[#c59a63] hover:text-[#c59a63] hover:shadow-md hover:-translate-y-0.5'
                      }`}
                  >
                    {isBinding
                      ? <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>
                      : <span className="material-symbols-outlined text-[18px]">{isOccupied ? 'person' : 'table_restaurant'}</span>
                    }
                    <span>{table.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#c59a63]/40 inline-block" />Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" />Occupied</span>
          </div>
        </div>

        <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-8">Powered by TechHansa IT</p>
      </div>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ Admin PIN Modal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const AdminPinModal = ({ onSuccess, onCancel }) => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const handleDigit = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError('');
    if (val && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKey = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const handleVerify = async () => {
    const pin = digits.join('');
    if (pin.length < 4) { setError('Enter all 4 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/kiosk/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) { onSuccess(); }
      else { setError('Incorrect PIN. Access denied.'); setDigits(['', '', '', '']); refs[0].current?.focus(); }
    } catch { setError('Server unreachable.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[28px] p-8 w-full max-w-xs shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#c59a63]/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[#c59a63] text-[28px]">admin_panel_settings</span>
        </div>
        <h3 className="font-black text-lg text-gray-800 mb-1">Admin PIN Required</h3>
        <p className="text-xs text-gray-400 mb-6">Enter the 4-digit PIN to unbind this device.</p>

        <div className="flex justify-center gap-3 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type={showPin ? 'text' : 'password'}
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden ${error ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50 focus:border-[#c59a63] focus:bg-white'}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <div className="flex justify-center mb-4">
          <button 
            onClick={() => setShowPin(!showPin)} 
            className="text-[11px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">
              {showPin ? 'visibility_off' : 'visibility'}
            </span>
            {showPin ? 'Hide PIN' : 'Show PIN'}
          </button>
        </div>

        {error && <p className="text-xs font-bold text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-[#c59a63] text-white font-black text-sm mb-3 hover:bg-[#b8895a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>Verifying...</> : 'Confirm Unbind'}
        </button>
        <button onClick={onCancel} className="w-full py-3 rounded-2xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ PHASE 2: Idle / Welcome Screen ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const IdleScreen = ({ tableId, guestName, onStart, onUnbindRequest }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/Screen_saver-video (online-video-cutter.com).mp4" type="video/mp4" />
      </video>
      {/* Overlay for legibility */}
      <div className="absolute inset-0 bg-[#f5f4f0]/30 z-0" />

      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex items-center gap-4 drop-shadow-md">
          <img src="/techhansa-logo.png" alt="Pragati RMS" className="w-20 h-20 object-contain" />
          <h1 className="text-3xl font-black text-[#c59a63] tracking-tight">Pragati RMS</h1>
        </div>
        <div className="text-right drop-shadow-md">
          <div className="text-3xl font-black text-white tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <p className="text-white/90 font-bold text-sm">
            {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 mt-10">
        <div className="text-center max-w-md">
          {guestName ? (
            <div className="bg-white/90 backdrop-blur-md p-10 rounded-[32px] shadow-2xl border border-white/20">
              <div className="mb-4"><Badge text={`Table ${tableId}`} color="gold" /></div>
              <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-2">
                Welcome,<br /><span className="text-[#c59a63]">{guestName}!</span>
              </h2>
              <p className="text-gray-500 font-semibold text-sm mb-10">Your table is ready. Explore our menu and place your order.</p>
              <button onClick={onStart}
                className="px-12 py-4 rounded-full bg-[#c59a63] hover:bg-[#b8895a] text-white font-black text-lg shadow-xl shadow-[#c59a63]/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 mx-auto">
                <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
                Tap to Start
              </button>
            </div>
          ) : (
            <div className="bg-black/40 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-center gap-3 text-white">
                <span className="w-3 h-3 rounded-full bg-[#c59a63] animate-pulse shadow-[0_0_10px_#c59a63]" />
                <p className="text-sm uppercase tracking-widest font-black drop-shadow-md">Awaiting host assignment</p>
              </div>
              <p className="mt-3 text-sm text-white/80 font-mono font-bold drop-shadow-md">Bound to Table {tableId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Discreet unbind trigger at the very bottom */}
      <div className="relative z-10 flex justify-center pb-4">
        <button
          onClick={onUnbindRequest}
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300 hover:text-gray-400 uppercase tracking-widest transition-colors px-4 py-2 rounded-full hover:bg-gray-100/50"
        >
          <span className="material-symbols-outlined text-[14px]">settings</span>
          Device Settings
        </button>
      </div>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ Item Customizer Modal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const CustomizerModal = ({ item, onConfirm, onCancel }) => {
  const [selections, setSelections] = useState({});
  const [note, setNote] = useState('');
  const toggle = (group, value) => setSelections(p => ({ ...p, [group]: p[group] === value ? null : value }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-[32px] w-full max-w-lg p-8 pb-10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#c59a63] uppercase tracking-widest">Customize Order</p>
            <h3 className="text-xl font-black text-gray-800">{item.name}</h3>
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex flex-col gap-5 max-h-64 overflow-y-auto no-scrollbar">
          {Object.entries(item.mods || {}).map(([group, options]) => (
            <div key={group}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{group}</p>
              <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                  <button key={opt} onClick={() => toggle(group, opt)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selections[group] === opt ? 'bg-[#c59a63] text-white border-[#c59a63] shadow-md' : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-200'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Special Instructions</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="e.g., No peanuts, sauce on side..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[#c59a63] resize-none transition-colors" />
          </div>
        </div>
        <button onClick={() => onConfirm({ selections, note })}
          className="mt-6 w-full py-4 rounded-2xl bg-[#c59a63] text-white font-black text-base shadow-lg hover:bg-[#b8895a] transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          Add to Order — &#8377;{item.price}
        </button>
      </div>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ Cart Drawer ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const CartDrawer = ({ cart, onClose, onCheckout, onRemove, onQty, taxConfig, packageData, partySize, isFirstOrder }) => {
  const packageFee = (isFirstOrder && packageData) ? (packageData.pricing_type === 'per_person' ? (packageData.price || 0) * (partySize || 1) : (packageData.price || 0)) : 0;
  
  const itemsSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const subtotal = itemsSubtotal + packageFee;
  
  const activeTaxes = Array.isArray(taxConfig) ? taxConfig.filter(t => t.is_active) : [];
  const taxBreakdown = activeTaxes.map(t => ({
    label: `${t.name} (${(t.rate * 100).toFixed(0)}%)`,
    amount: subtotal * t.rate
  }));
  const totalTaxes = taxBreakdown.reduce((sum, t) => sum + t.amount, 0);
  const total = subtotal + totalTaxes;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#c59a63] text-[22px]">room_service</span>
            <h2 className="font-black text-lg text-gray-800">Your Order</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 flex flex-col gap-3">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <span className="material-symbols-outlined text-5xl mb-3">shopping_bag</span>
              <p className="text-sm font-semibold">Your cart is empty</p>
            </div>
          )}
          {cart.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{item.name}</p>
                  {item.note && <p className="text-xs text-gray-400 mt-0.5 italic">{item.note}</p>}
                  {Object.values(item.selections || {}).filter(Boolean).map((s, si) => (
                    <span key={si} className="inline-block text-[9px] font-bold bg-[#c59a63]/10 text-[#c59a63] px-2 py-0.5 rounded-full mr-1 mt-1">{s}</span>
                  ))}
                </div>
                <button onClick={() => onRemove(i)} className="text-gray-300 hover:text-red-400 transition-colors ml-2">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-[#c59a63]">&#8377;{(item.price * item.qty).toFixed(2)}</span>
                <Stepper qty={item.qty} onMinus={() => onQty(i, -1)} onPlus={() => onQty(i, 1)} />
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="px-6 pb-8 border-t border-gray-50 pt-4">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between text-xs text-gray-400 font-semibold">
                <span>Items Subtotal</span><span>&#8377;{itemsSubtotal.toFixed(2)}</span>
              </div>
              {packageFee > 0 && (
                <div className="flex justify-between text-xs text-[#c59a63] font-semibold">
                  <span>Package Fee</span><span>&#8377;{packageFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-400 font-semibold border-t border-gray-50 pt-2 mt-1">
                <span>Subtotal</span><span>&#8377;{subtotal.toFixed(2)}</span>
              </div>
              {taxBreakdown.map((t, idx) => (
                <div key={idx} className="flex justify-between text-xs text-gray-400 font-semibold">
                  <span>{t.label}</span><span>&#8377;{t.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-gray-800 mt-2 pt-2 border-t border-gray-50">
                <span>Total</span><span className="text-[#c59a63] text-lg">&#8377;{total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => onCheckout(total, taxBreakdown)}
              className="w-full py-4 rounded-2xl bg-[#c59a63] text-white font-black text-base shadow-xl hover:bg-[#b8895a] transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">contactless</span>
              Pay & Send to Kitchen — &#8377;{total.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ Payment Screen ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const PaymentScreen = ({ total, onSuccess, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [status, setStatus] = useState('awaiting');
  const txRef = useRef(`TXN-${Date.now().toString(36).toUpperCase()}`).current;

  useEffect(() => {
    if (!paymentMethod) return;
    setStatus('processing');
    const t1 = setTimeout(() => { setStatus('confirmed'); onSuccess(paymentMethod); }, 3000);
    return () => clearTimeout(t1);
  }, [paymentMethod, onSuccess]);

  if (!paymentMethod) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(#c59a6330 2px, transparent 2px)', backgroundSize: '28px 28px' }}>
        <BG />
        <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-[0_8px_32px_rgb(0,0,0,0.06)] text-center relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Checkout</p>
              <h2 className="text-lg font-black text-gray-800">Select Payment Method</h2>
            </div>
          </div>
          
          <p className="text-3xl font-black text-[#c59a63]">&#8377;{total.toFixed(2)}</p>

          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => setPaymentMethod('upi')} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-[#c59a63] hover:bg-orange-50/50 transition-all text-left">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c59a63]">qr_code_2</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Pay via UPI</h3>
                <p className="text-xs text-gray-500">Scan QR Code</p>
              </div>
            </button>

            <button onClick={() => setPaymentMethod('card')} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-[#c59a63] hover:bg-orange-50/50 transition-all text-left">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c59a63]">credit_card</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Pay via Card</h3>
                <p className="text-xs text-gray-500">Tap or Insert Card</p>
              </div>
            </button>

            <button onClick={() => setPaymentMethod('cash')} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-[#c59a63] hover:bg-orange-50/50 transition-all text-left">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c59a63]">payments</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-base">Pay via Cash</h3>
                <p className="text-xs text-gray-500">Host will collect cash</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#c59a6330 2px, transparent 2px)', backgroundSize: '28px 28px' }}>
      <BG />
      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-[0_8px_32px_rgb(0,0,0,0.06)] text-center relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPaymentMethod(null)} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Checkout</p>
            <h2 className="text-lg font-black text-gray-800">
              {paymentMethod === 'upi' ? 'UPI Payment' : paymentMethod === 'card' ? 'Card Payment' : 'Cash Payment'}
            </h2>
          </div>
        </div>

        {paymentMethod === 'upi' && (
          <div className="w-48 h-48 mx-auto bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-4">
            <span className="material-symbols-outlined text-gray-300 text-6xl">qr_code_2</span>
            <p className="text-xs text-gray-400 mt-2">Scan with any UPI app</p>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="w-48 h-48 mx-auto bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-4">
            <span className="material-symbols-outlined text-gray-300 text-6xl">contactless</span>
            <p className="text-xs text-gray-400 mt-2">Tap your card on the terminal</p>
          </div>
        )}

        {paymentMethod === 'cash' && (
          <div className="w-48 h-48 mx-auto bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-4">
            <span className="material-symbols-outlined text-gray-300 text-6xl">payments</span>
            <p className="text-xs text-gray-400 mt-2 text-center px-4">Our host is on the way to collect cash</p>
          </div>
        )}
        
        <p className="text-2xl font-black text-[#c59a63] mb-1">&#8377;{total.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mb-6 font-mono">Ref: {txRef}</p>
        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold mb-4 transition-all ${status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className={`material-symbols-outlined text-[18px] ${status === 'processing' ? 'animate-spin' : ''}`}>
            {status === 'confirmed' ? 'check_circle' : 'autorenew'}
          </span>
          {status === 'confirmed' ? 'Payment Confirmed!' : 'Processing...'}
        </div>
      </div>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ Phase 3: Success Screen & Modals ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const FeedbackModal = ({ onClose, tableId, guestName }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/api/kiosk/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId, guest_name: guestName, rating, comment })
      });
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  if (submitted) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-emerald-500 text-3xl">favorite</span>
        </div>
        <h3 className="text-lg font-black text-gray-800">Thank You!</h3>
        <p className="text-sm text-gray-500 mt-2">Your feedback helps us improve.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl w-full max-w-sm">
        <h3 className="text-xl font-black text-gray-800 mb-2 text-center">How was your meal?</h3>
        <p className="text-xs text-gray-400 text-center mb-6">Tap a star to rate your experience</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
              <span className={`material-symbols-outlined text-4xl ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`} style={{ fontVariationSettings: `'FILL' ${rating >= star ? 1 : 0}` }}>star</span>
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Any additional comments? (Optional)"
          className="w-full h-24 p-4 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 ring-[#c59a63]/30 resize-none mb-6"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button onClick={handleSubmit} disabled={rating === 0 || submitting} className="flex-1 py-3 rounded-xl font-bold text-white bg-[#c59a63] hover:bg-[#b8895a] disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

const InvoiceModal = ({ total, items, tableId, taxConfig, guestName, packageData, partySize, onClose }) => {
  const [sending, setSending] = useState(false);
  const packageFee = packageData ? (packageData.pricing_type === 'per_person' ? (packageData.price || 0) * (partySize || 1) : (packageData.price || 0)) : 0;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0) + packageFee;
  const activeTaxes = Array.isArray(taxConfig) ? taxConfig.filter(t => t.is_active) : [];
  const taxBreakdown = activeTaxes.map(t => ({
    label: `${t.name} (${(t.rate * 100).toFixed(0)}%)`,
    amount: subtotal * t.rate
  }));
  const orderId = `ORD-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;

  const handleSendReceipt = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API}/api/kiosk/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: tableId, items, total, taxBreakdown })
      });
      if (res.ok) alert('Receipt sent to your email successfully!');
      else alert('Failed to send receipt. Please ensure you provided an email at booking.');
    } catch(e) {
      alert('Network error while sending receipt.');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#faf9f6] p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl relative [&::-webkit-scrollbar]:hidden" style={{ borderRadius: '12px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {/* Receipt jagged edge effect using CSS */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, #faf9f6 11px)', backgroundSize: '20px 20px', marginTop: '-10px' }} />

        <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
          <img src="/techhansa-logo.png" alt="Logo" className="h-10 w-auto mx-auto mb-3 opacity-80 mix-blend-multiply" />
          <h2 className="font-black text-gray-800 text-lg uppercase tracking-widest">Pragati RMS</h2>
          <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">RECEIPT</p>
        </div>

        <div className="flex justify-between items-start text-xs text-gray-500 mb-6 font-medium">
          <div>
            <p>Table: <span className="font-bold text-gray-700">{tableId}</span></p>
            <p>Guest: <span className="font-bold text-gray-700">{guestName || 'Walk-in'}</span></p>
          </div>
          <div className="text-right">
            <p>ID: <span className="font-bold text-gray-700">{orderId}</span></p>
            <p>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {packageData && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                <span className="font-bold mr-2">{packageData.pricing_type === 'per_person' ? `${partySize || 1}x` : '1x'}</span>
                {packageData.name} Package
              </span>
              <span className="font-bold text-gray-800 tabular-nums">&#8377;{packageFee.toFixed(2)}</span>
            </div>
          )}
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600"><span className="font-bold mr-2">{item.qty}x</span>{item.name}</span>
              <span className="font-bold text-gray-800 tabular-nums">&#8377;{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 pt-4 mb-4 space-y-2 text-sm text-gray-500">
          <div className="flex justify-between font-bold text-gray-700">
            <span>Subtotal</span>
            <span className="tabular-nums">&#8377;{subtotal.toFixed(2)}</span>
          </div>
          {taxBreakdown.map((tax, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{tax.label}</span>
              <span className="tabular-nums">&#8377;{tax.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-4 mb-8">
          <div className="flex justify-between text-xl font-black text-gray-900">
            <span>TOTAL</span>
            <span className="tabular-nums">&#8377;{total.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={handleSendReceipt} 
          disabled={sending}
          className="w-full py-4 mb-3 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
        >
          {sending ? <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span> : <span className="material-symbols-outlined text-[18px]">mail</span>}
          {sending ? 'Sending...' : 'Get Receipt via Email'}
        </button>

        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Close</button>
      </div>
    </div>
  );
};

const SuccessScreen = ({ guestName, tableId, total, itemCount, mobile, onOrderMore, socket, cart, taxConfig, packageData, partySize }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    let orderTimeStr = localStorage.getItem('pragati_kiosk_order_time');
    let orderTime;
    if (!orderTimeStr || isNaN(parseInt(orderTimeStr, 10))) {
      orderTime = Date.now();
      localStorage.setItem('pragati_kiosk_order_time', orderTime.toString());
    } else {
      orderTime = parseInt(orderTimeStr, 10);
    }
    const elapsed = Math.floor((Date.now() - orderTime) / 1000);
    return Math.max(0, (15 * 60) - elapsed);
  });
  const [orderStatus, setOrderStatus] = useState(() => localStorage.getItem('pragati_kiosk_order_status') || 'preparing'); // preparing | ready
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    localStorage.setItem('pragati_kiosk_order_status', orderStatus);
  }, [orderStatus]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => { setOrderStatus('ready'); };
    socket.on('order_ready', handler);
    return () => socket.off('order_ready', handler);
  }, [socket]);

  useEffect(() => {
    if (orderStatus === 'ready' || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [orderStatus]);

  const isDelayed = timeLeft <= 0;
  const mins = Math.floor(Math.max(0, timeLeft) / 60);
  const secs = Math.max(0, timeLeft) % 60;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden ${orderStatus === 'ready' ? 'bg-[#f5f4f0]' : ''}`}
      style={orderStatus === 'ready' ? { backgroundImage: 'radial-gradient(#c59a6330 2px, transparent 2px)', backgroundSize: '28px 28px' } : {}}>
      
      {orderStatus !== 'ready' && (
        <>
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
            <source src="/wait-time-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40 z-0"></div>
        </>
      )}

      {orderStatus === 'ready' && <BG />}

      <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <img src="/techhansa-logo.png" alt="Pragati RMS" className="h-12 w-auto object-contain" />
        <span className="text-2xl font-black tracking-tight text-[#c59a63]">
          Pragati RMS
        </span>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} tableId={tableId} guestName={guestName} />}
      {showInvoice && <InvoiceModal total={total} items={cart} tableId={tableId} taxConfig={taxConfig} guestName={guestName} packageData={packageData} partySize={partySize} onClose={() => setShowInvoice(false)} />}

      <div className={`${orderStatus === 'ready' ? 'bg-white shadow-[0_8px_32px_rgb(0,0,0,0.06)]' : 'bg-transparent backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgb(0,0,0,0.1)]'} rounded-[32px] p-8 w-full max-w-sm text-center relative z-10 transition-all duration-500`}>
        {orderStatus === 'ready' ? (
          <img src="/chef.jpg" alt="Chef" className="w-40 h-40 mx-auto object-contain mb-4 mix-blend-multiply" />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 transition-colors duration-500 bg-emerald-50 text-emerald-500">
            <span className="material-symbols-outlined text-5xl">check_circle</span>
          </div>
        )}

        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${orderStatus === 'ready' ? 'text-gray-400' : 'text-white/80'}`}>
          {orderStatus === 'ready' ? 'Order Complete' : 'Order Confirmed'}
        </p>
        <h2 className={`text-2xl font-black mb-1 ${orderStatus === 'ready' ? 'text-gray-800' : 'text-white'}`}>
          {orderStatus === 'ready' ? 'Your food is ready!' : 'Ticket Sent to Kitchen!'}
        </h2>
        <p className={`text-sm mb-6 ${orderStatus === 'ready' ? 'text-gray-500' : 'text-white/80'}`}>
          {orderStatus === 'ready' ? 'Enjoy your tasty meal.' : `${itemCount} item${itemCount > 1 ? 's are' : ' is'} being prepared.`}
        </p>

        {orderStatus === 'preparing' ? (
          isDelayed ? (
            <div className="bg-transparent backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6">
              <p className="text-[12px] font-bold text-amber-400 uppercase tracking-widest mb-1">Apologies for the delay</p>
              <div className="text-sm font-medium text-white/90">Our chefs are working hard on your cravings!</div>
            </div>
          ) : (
            <div className="bg-transparent backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">Estimated Ready In</p>
              <div className="text-4xl font-black text-[#c59a63] tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            <button onClick={() => setShowInvoice(true)} className="w-full py-3.5 rounded-2xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>View Invoice
            </button>
            <button onClick={() => setShowFeedback(true)} className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">rate_review</span>Provide Feedback
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={onOrderMore}
            className="w-full py-3.5 rounded-2xl border-2 border-[#c59a63] text-[#c59a63] font-bold text-sm hover:bg-[#c59a63]/5 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>Order More Items
          </button>

          {orderStatus === 'ready' && (
            <button
              onClick={() => {
                fetch(`${API}/api/sales/session/close`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ device_id: tableId })
                }).catch(console.error);
              }}
              className="w-full py-3.5 rounded-2xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">logout</span>I'm Done / Leave Table
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ Menu Screen ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const MenuScreen = ({ guestName, tableId, mobile, socket, packageData, partySize, onUnbindRequest }) => {
  const [category, setCategory] = useState('All Dishes');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState([]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pragati_kiosk_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orderHistory, setOrderHistory] = useState(() => {
    const saved = localStorage.getItem('pragati_kiosk_order_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [customizerItem, setCustomizerItem] = useState(null);
  const [subScreen, setSubScreen] = useState(() => localStorage.getItem('pragati_kiosk_subscreen') || 'menu'); // menu | payment | success
  const [checkoutTotal, setCheckoutTotal] = useState(() => {
    const saved = localStorage.getItem('pragati_kiosk_checkout_total');
    return saved ? parseFloat(saved) : 0;
  });
  const [checkoutTaxes, setCheckoutTaxes] = useState(() => {
    const saved = localStorage.getItem('pragati_kiosk_checkout_taxes');
    return saved ? JSON.parse(saved) : [];
  });
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [liveMenuItems, setLiveMenuItems] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [taxConfig, setTaxConfig] = useState(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('pragati_kiosk_cart', JSON.stringify(cart));
    localStorage.setItem('pragati_kiosk_subscreen', subScreen);
    localStorage.setItem('pragati_kiosk_checkout_total', checkoutTotal.toString());
    localStorage.setItem('pragati_kiosk_checkout_taxes', JSON.stringify(checkoutTaxes));
    localStorage.setItem('pragati_kiosk_order_history', JSON.stringify(orderHistory));
  }, [cart, subScreen, checkoutTotal, checkoutTaxes, orderHistory]);



  const handleLeaveTable = async () => {
    try {
      await fetch(`${API}/api/sales/session/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: tableId })
      });
    } catch (e) { console.error(e); }
    setLeaveConfirm(false);
    // session_reset socket event will clear state automatically
  };

  const fetchMenu = useCallback(() => {
    fetch(`${API}/api/admin/menu-items`).then(r => r.json()).then(setLiveMenuItems).catch(console.error);
    fetch(`${API}/api/admin/categories`).then(r => r.json()).then(data => setCustomCategories(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  useEffect(() => {
    fetch(`${API}/api/admin/tax-config`)
      .then(res => res.json())
      .then(setTaxConfig)
      .catch(console.error);
  }, []);

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 2500);
  }, []);
  const baseItems = packageData 
    ? liveMenuItems.filter(item => packageData.menu_items.some(pi => pi._id === (item._id || item.id) || pi === (item._id || item.id)))
    : liveMenuItems;

  const uniqueCategories = packageData 
    ? ['All Dishes', ...new Set(baseItems.map(i => i.category || 'General'))]
    : ['All Dishes', ...new Set([...customCategories.map(c => c.name), ...liveMenuItems.map(i => i.category || 'General')])];

  let filtered = baseItems.filter(item => {
    if (category !== 'All Dishes' && category !== 'All' && item.category !== category) return false;

    // Check Veg Only toggle
    if (vegOnly && !item.is_veg) return false;

    // Check Veg/Non-Veg from filter pills
    if (dietFilter.includes('Pure Veg') && !item.is_veg) return false;
    if (dietFilter.includes('Non-Veg') && item.is_veg) return false;

    // Check tags
    const requiredTags = dietFilter.filter(f => f !== 'Pure Veg' && f !== 'Non-Veg');
    if (requiredTags.length > 0) {
      if (!item.tags || !requiredTags.every(rt => item.tags.some(t => t.includes(rt.replace(/ [^\w\s]+$/, ''))))) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !(item.desc || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (packageData && packageData.pricing_type === 'per_person') {
    filtered = filtered.map(item => ({ ...item, price: 0 }));
  }

  const addToCart = (item, { selections, note } = {}) => {
    setCart(prev => {
      const idx = prev.findIndex(c => (c._id || c.id) === (item._id || item.id));
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], qty: u[idx].qty + 1 }; return u; }
      return [...prev, { ...item, qty: 1, selections, note }];
    });
    showToast(`${item.name} added!`);
    setCustomizerItem(null);
  };

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));
  const changeQty = (idx, delta) => setCart(prev => {
    const u = [...prev]; u[idx] = { ...u[idx], qty: Math.max(1, u[idx].qty + delta) }; return u;
  });

  const handleQtyChange = (item, delta) => {
    const idx = cart.findIndex(c => (c._id || c.id) === (item._id || item.id));
    if (idx === -1) return;
    if (cart[idx].qty === 1 && delta === -1) removeFromCart(idx);
    else changeQty(idx, delta);
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = (total, taxes) => { setCartOpen(false); setCheckoutTotal(total); setCheckoutTaxes(taxes); setSubScreen('payment'); };

  const hasActiveOrder = !!localStorage.getItem('pragati_kiosk_order_status');

  const handlePaySuccess = useCallback(async (paymentMethod) => {
    const submittedItems = cart.map(item => ({
      id: item._id || item.id,
      menu_item_id: item._id || item.id,
      name: item.name,
      qty: item.qty,
      mods: item.selections ? Object.values(item.selections).flat() : [],
      note: item.note || '',
      category: item.category,
      price: item.price
    }));

    try {
      await fetch(`${API}/api/kiosk/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          total: checkoutTotal,
          taxes: checkoutTaxes,
          payment_method: paymentMethod,
          items: submittedItems
        })
      });
    } catch (e) {
      console.error('Failed to send order', e);
    }

    setOrderHistory(prev => [...prev, ...submittedItems]);
    localStorage.setItem('pragati_kiosk_order_time', Date.now().toString());
    socket?.emit('payment_confirmed', { table_id: tableId });
    setSubScreen('success');
  }, [checkoutTotal, checkoutTaxes, tableId, socket, cart]);

  const toggleDiet = (tag) => setDietFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const packageFee = packageData ? (packageData.pricing_type === 'per_person' ? (packageData.price || 0) * (partySize || 1) : (packageData.price || 0)) : 0;
  
  // For checkout, we use the current cart's total
  const currentFinalTotal = checkoutTotal;
  
  const activeTaxes = Array.isArray(taxConfig) ? taxConfig.filter(t => t.is_active) : [];

  // For receipts, we compute the cumulative total from all past orders in the session
  const cumulativeSubtotal = orderHistory.reduce((s, i) => s + (i.price * i.qty), 0) + packageFee;
  const cumulativeTotalTaxes = activeTaxes.reduce((s, t) => s + (cumulativeSubtotal * t.rate), 0);
  const cumulativeFinalTotal = cumulativeSubtotal + cumulativeTotalTaxes;

  if (subScreen === 'payment') return <PaymentScreen total={currentFinalTotal} onSuccess={handlePaySuccess} onCancel={() => setSubScreen('menu')} />;
  if (subScreen === 'success') return <SuccessScreen guestName={guestName} tableId={tableId} total={cumulativeFinalTotal} itemCount={orderHistory.reduce((s, i) => s + i.qty, 0)} mobile={mobile} onOrderMore={() => { setCart([]); setSubScreen('menu'); }} socket={socket} cart={orderHistory} taxConfig={taxConfig} packageData={packageData} partySize={partySize} />;

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans antialiased text-gray-800">
      <Toast message={toast.message} visible={toast.visible} />
      {customizerItem && <CustomizerModal item={customizerItem} onConfirm={(opts) => addToCart(customizerItem, opts)} onCancel={() => setCustomizerItem(null)} />}
      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} onRemove={removeFromCart} onQty={changeQty} taxConfig={taxConfig} packageData={packageData} partySize={partySize} isFirstOrder={orderHistory.length === 0} />}

      {/* Leave Table Confirmation Modal */}
      {leaveConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[28px] p-8 w-full max-w-xs shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-[28px]">logout</span>
            </div>
            <h3 className="font-black text-lg text-gray-800 mb-1">Leave Table?</h3>
            <p className="text-xs text-gray-400 mb-6">This will end your session and free the table. Any unordered items in your cart will be lost.</p>
            <button onClick={handleLeaveTable}
              className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-black text-sm mb-3 hover:bg-red-600 transition-colors">
              Yes, I'm Leaving
            </button>
            <button onClick={() => setLeaveConfirm(false)}
              className="w-full py-3 rounded-2xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors">
              Stay & Continue
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#fdfaf6]/90 backdrop-blur-md h-20">
        <div className="h-full px-6 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/techhansa-logo.png" alt="Pragati RMS" className="w-16 h-16 object-contain" />
            <span className="text-3xl font-black text-[#c59a63] tracking-tight">Pragati RMS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <span className={`text-xs font-bold ${vegOnly ? 'text-green-600' : 'text-gray-400'}`}>Veg Only</span>
              <button 
                onClick={() => setVegOnly(!vegOnly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${vegOnly ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${vegOnly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <button onClick={() => setLeaveConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-white transition-all border border-gray-200 bg-white/50">
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Leave Table
            </button>
            {hasActiveOrder && (
              <button onClick={() => setSubScreen('success')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-white bg-[#c59a63] hover:bg-[#b8895a] transition-all shadow-md">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                View Order
              </button>
            )}
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#1a1a1a] text-white font-bold text-xs shadow-xl hover:bg-black transition-all">
              <div className="flex items-center gap-1.5 text-[#b8895a]">
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                <span className="text-white">Cart</span>
              </div>
              <span className="text-[#b8895a]">&#8377;{cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(0)}</span>
              {totalItems > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#b8895a] text-white text-[10px] font-black flex items-center justify-center border-2 border-[#1a1a1a]">{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Welcome Banner */}
        {guestName && (
          <div className="mb-6 rounded-[20px] p-5 sm:p-6 shadow-sm relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fffcf5 0%, #fff7e6 100%)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#b8895a] opacity-5 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="relative z-10 flex flex-col justify-center">
              <p className="text-[9px] font-bold text-[#b8895a] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                TABLE {tableId} <span className="text-gray-300">•</span> FINE DINING LOUNGE
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Welcome, <span className="text-[#a85c3c]">{guestName}!</span>
              </h1>
              <p className="text-xs text-gray-500 max-w-lg leading-snug">
                Freshly crafted artisanal delicacies prepared live by Executive Chef Marco. Tap any dish to place your order.
              </p>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
            <input type="text" placeholder="Search truffle, wagyu, handmade pasta, desserts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm font-medium outline-none focus:border-[#b8895a] transition-colors shadow-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-2 md:pb-0">
            {['Pure Veg', 'Non-Veg', 'Vegan 🌱', "Chef's Choice ✨", 'Gluten-Free 🌾', 'Spicy 🌶️', 'Bestseller 🔥', 'Dairy-Free 🥛', 'Nut-Free 🥜'].map(f => (
              <button key={f} onClick={() => toggleDiet(f)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${dietFilter.includes(f) ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-[#b8895a] hover:text-[#b8895a]'}`}>
                {f.includes('Veg') && !f.includes('Vegan') && <span className={`w-2 h-2 rounded-full ${f === 'Pure Veg' ? 'bg-emerald-400' : 'bg-red-400'}`} />}
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
          {uniqueCategories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${category === cat ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => {
            // Assign a placeholder image based on index/id for demonstration
            let img = '/assets/pasta.jpg';
            let mockTime = '14 mins';
            let timeColor = 'bg-emerald-500';
            if (item.name.toLowerCase().includes('steak') || item.name.toLowerCase().includes('wagyu')) {
              img = '/assets/steak.jpg';
              mockTime = '18 mins';
              timeColor = 'bg-red-500';
            } else if (item.name.toLowerCase().includes('salad') || item.name.toLowerCase().includes('paneer') || item.name.toLowerCase().includes('peach')) {
              img = '/assets/salad.jpg';
              mockTime = '10 mins';
            } else if (item.name.toLowerCase().includes('dessert') || item.name.toLowerCase().includes('chocolate')) {
              img = '/assets/dessert.jpg';
              mockTime = '11 mins';
            }

            const qtyInCart = cart.find(c => (c._id || c.id) === (item._id || item.id))?.qty || 0;

            return (
              <div key={item._id || item.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img src={item.image_url ? `${API}${item.image_url}` : img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {item.category && <span className="px-2.5 py-1 bg-white/90 backdrop-blur text-[10px] font-bold text-gray-800 rounded-full uppercase tracking-wider">{item.category}</span>}
                    {idx % 3 === 0 && <span className="px-2.5 py-1 bg-[#a85c3c] text-white text-[10px] font-bold rounded-full flex items-center gap-1">⭐ Bestseller</span>}
                  </div>

                  {/* Bottom Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between p-4">
                    <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold">
                      <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                      {item.is_veg ? 'Veg' : 'Non-Veg'}
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">&#8377;{item.price}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1">{item.desc}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(item.allergens || []).map(a => <span key={a} className="px-2 py-1 bg-red-50 text-red-600 rounded text-[9px] font-bold uppercase tracking-wide">{a}</span>)}
                    {item.is_veg && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-wide">Vegetarian</span>}
                    {(item.tags || []).map(t => <span key={t} className="px-2 py-1 bg-[#c59a63]/10 text-[#c59a63] rounded text-[9px] font-bold uppercase tracking-wide">{t}</span>)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    {Object.keys(item.mods || {}).length > 0 ? (
                      <button onClick={() => setCustomizerItem(item)} className="text-[11px] font-bold text-[#b8895a] flex items-center gap-1.5 hover:text-[#8a6540] transition-colors">
                        Customize <span className="material-symbols-outlined text-[14px]">tune</span>
                      </button>
                    ) : <div />}

                    <div className="flex items-center gap-3">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-3 bg-gray-50 rounded-full px-1 border border-gray-200">
                          <button onClick={() => handleQtyChange(item, -1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors material-symbols-outlined text-[16px]">remove</button>
                          <span className="text-xs font-bold w-4 text-center">{qtyInCart}</span>
                          <button onClick={() => handleQtyChange(item, 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors material-symbols-outlined text-[16px]">add</button>
                        </div>
                      ) : (
                        <button onClick={() => Object.keys(item.mods || {}).length > 0 ? setCustomizerItem(item) : addToCart(item)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#a85c3c] text-white text-xs font-bold shadow-md hover:bg-[#8e4c30] transition-colors">
                          <span className="material-symbols-outlined text-[16px]">add</span> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Discreet Device Settings */}
        <div className="flex justify-center mt-8">
          <button onClick={onUnbindRequest}
            className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300 hover:text-gray-400 uppercase tracking-widest transition-colors px-4 py-2 rounded-full hover:bg-gray-100">
            <span className="material-symbols-outlined text-[13px]">settings</span>Device Settings
          </button>
        </div>
      </main>
    </div>
  );
};

// ΓöÇΓöÇΓöÇ Root Module — State Machine ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const ModuleA = () => {
  // Phase detection: check localStorage on every mount
  const [tableId, setTableId] = useState(() => localStorage.getItem(LS_KEY) || null);
  const [kioskScreen, setKioskScreen] = useState(() => localStorage.getItem('pragati_kiosk_screen') || 'idle');
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('pragati_kiosk_session');
    return saved ? JSON.parse(saved) : { guestName: null, mobile: null, package: null };
  });
  const [socket, setSocket] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showGuestPinModal, setShowGuestPinModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('pragati_kiosk_screen', kioskScreen);
  }, [kioskScreen]);

  useEffect(() => {
    localStorage.setItem('pragati_kiosk_session', JSON.stringify(session));
  }, [session]);

  // Establish socket whenever we are bound to a table
  useEffect(() => {
    if (!tableId) return;
    const s = io(API);

    // Register this tablet in its table's socket room on connect (and reconnects)
    const joinRoom = () => s.emit('register_device', { device_id: tableId, role: 'Customer' });
    s.on('connect', joinRoom);
    if (s.connected) joinRoom();

    // Host started a session -> wake the kiosk
    s.on('session_started', (data) => {
      setSession({ guestName: data.guest_name, mobile: data.mobile || null, package: data.package || null, party_size: data.party_size || 1 });
      if (!data.is_reconnect) {
        setKioskScreen('idle'); // Show welcome banner only for new sessions
        localStorage.removeItem('pragati_kiosk_cart');
        localStorage.removeItem('pragati_kiosk_subscreen');
        localStorage.removeItem('pragati_kiosk_checkout_total');
        localStorage.removeItem('pragati_kiosk_order_status');
        localStorage.removeItem('pragati_kiosk_order_time');
        localStorage.removeItem('pragati_kiosk_order_history');
      }
    });

    // Table reset / force close from host
    s.on('session_reset', () => {
      setSession({ guestName: null, mobile: null, package: null, party_size: 1 });
      setKioskScreen('idle');
      localStorage.removeItem('pragati_kiosk_cart');
      localStorage.removeItem('pragati_kiosk_subscreen');
      localStorage.removeItem('pragati_kiosk_checkout_total');
      localStorage.removeItem('pragati_kiosk_order_status');
      localStorage.removeItem('pragati_kiosk_order_time');
      localStorage.removeItem('pragati_kiosk_order_history');
      setOrderStatus(null);
    });

    setSocket(s);
    return () => s.disconnect();
  }, [tableId]);

  const GuestPinModal = ({ deviceId, onSuccess, onCancel }) => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const handleDigit = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError('');
    if (val && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleKey = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const handleVerify = async () => {
    const pin = digits.join('');
    if (pin.length < 4) { setError('Enter all 4 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/kiosk/verify-guest-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, pin }),
      });
      if (res.ok) { onSuccess(); }
      else { setError('Incorrect PIN. Access denied.'); setDigits(['', '', '', '']); refs[0].current?.focus(); }
    } catch { setError('Server unreachable.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-[28px] p-8 w-full max-w-xs shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#c59a63]/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[#c59a63] text-[28px]">lock</span>
        </div>
        <h3 className="font-black text-lg text-gray-800 mb-1">Enter 4-Digit Code</h3>
        <p className="text-xs text-gray-400 mb-6">Please enter the code sent to your email or provided by the host.</p>

        <div className="flex justify-center gap-3 mb-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type={showPin ? 'text' : 'password'}
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden ${error ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50 focus:border-[#c59a63] focus:bg-white'}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <div className="flex justify-center mb-4">
          <button 
            onClick={() => setShowPin(!showPin)} 
            className="text-[11px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">
              {showPin ? 'visibility_off' : 'visibility'}
            </span>
            {showPin ? 'Hide PIN' : 'Show PIN'}
          </button>
        </div>

        {error && <p className="text-xs font-bold text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-[#c59a63] text-white font-black text-sm mb-3 hover:bg-[#b8895a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>Verifying...</> : 'Unlock Screen'}
        </button>
        <button onClick={onCancel} className="w-full py-3 rounded-2xl text-xs font-bold text-gray-400 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};

  // ─── PHASE 3: Unbind ────────────────────────────────────────────────────────
  const handleUnbindSuccess = () => {
    socket?.emit('leave_room', { device_id: tableId });
    socket?.disconnect();
    setSocket(null);
    localStorage.removeItem(LS_KEY);
    setTableId(null);
    setKioskScreen('idle');
    setSession({ guestName: null, mobile: null, package: null });
    setShowPinModal(false);
  };

  // ΓöÇΓöÇ PHASE 1: Unbound — show Table Discovery ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (!tableId) {
    return (
      <>
        {showPinModal && (
          <AdminPinModal onSuccess={handleUnbindSuccess} onCancel={() => setShowPinModal(false)} />
        )}
        <TableDiscoveryScreen onBound={(id) => { setTableId(id); setKioskScreen('idle'); }} />
      </>
    );
  }

  // ΓöÇΓöÇ PHASE 2+3: Bound — show Idle or Menu ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  return (
    <>
      {showPinModal && (
        <AdminPinModal onSuccess={handleUnbindSuccess} onCancel={() => setShowPinModal(false)} />
      )}

      {kioskScreen === 'idle' && (
        <IdleScreen
          tableId={tableId}
          guestName={session.guestName}
          onStart={() => setShowGuestPinModal(true)}
          onUnbindRequest={() => setShowPinModal(true)}
        />
      )}

      {showGuestPinModal && (
        <GuestPinModal 
          deviceId={tableId}
          onSuccess={() => {
            setShowGuestPinModal(false);
            if (socket) socket.emit('customer_started_session', { device_id: tableId });
            setKioskScreen('menu');
          }}
          onCancel={() => setShowGuestPinModal(false)}
        />
      )}

      {kioskScreen === 'menu' && (
        <MenuScreen
          guestName={session.guestName}
          tableId={tableId}
          mobile={session.mobile}
          socket={socket}
          packageData={session.package}
          partySize={session.party_size}
          onUnbindRequest={() => setShowPinModal(true)}
        />
      )}
    </>
  );
};

export default ModuleA;
