import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API = 'http://localhost:3000';
const GST_RATE = 0.09;
const SERVICE_CHARGE = 0.05;
const LS_KEY = 'pragati_kiosk_table_id';

// ─── Live Menu Data (Fetched from backend) ────────────────────────────────────

// ─── Small Reusable Components ────────────────────────────────────────────────

const Badge = ({ text, color = 'gold' }) => {
  const cls = { gold: 'bg-[#c59a63]/10 text-[#c59a63]', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-600', gray: 'bg-gray-100 text-gray-500' };
  return <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cls[color] || cls.gray}`}>{text}</span>;
};

const Stepper = ({ qty, onMinus, onPlus }) => (
  <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1">
    <button onClick={onMinus} className="w-7 h-7 rounded-full bg-white shadow-sm text-gray-600 font-bold flex items-center justify-center hover:bg-gray-100 transition-colors">−</button>
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

// ─── PHASE 1 : Table Discovery Screen ────────────────────────────────────────

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
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-sm transition-all border-2 ${
                      isOccupied
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

// ─── Admin PIN Modal ──────────────────────────────────────────────────────────

const AdminPinModal = ({ onSuccess, onCancel }) => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
              type="password"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50 focus:border-[#c59a63] focus:bg-white'
              }`}
              autoFocus={i === 0}
            />
          ))}
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

// ─── PHASE 2: Idle / Welcome Screen ──────────────────────────────────────────

const IdleScreen = ({ tableId, guestName, onStart, onUnbindRequest }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#c59a6330 2px, transparent 2px)', backgroundSize: '28px 28px' }}>
      <BG />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <div className="flex flex-col items-center gap-2 mb-12">
          <img src="/techhansa-logo.png" alt="Pragati RMS" className="w-16 h-16 object-contain mb-2" />
          <h1 className="text-3xl font-black text-[#c59a63] tracking-tight">Pragati RMS</h1>
        </div>

        <div className="text-center max-w-md">
          {guestName ? (
            <>
              <div className="mb-4"><Badge text={`Table ${tableId}`} color="gold" /></div>
              <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-2">
                Welcome,<br /><span className="text-[#c59a63]">{guestName}!</span>
              </h2>
              <p className="text-gray-400 text-sm mb-10">Your table is ready. Explore our menu and place your order.</p>
              <button onClick={onStart}
                className="px-12 py-4 rounded-full bg-[#c59a63] hover:bg-[#b8895a] text-white font-black text-lg shadow-xl shadow-[#c59a63]/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 mx-auto">
                <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
                Tap to Start
              </button>
            </>
          ) : (
            <>
              <div className="text-7xl font-black text-[#c59a63] mb-2 tabular-nums">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <p className="text-gray-400 font-semibold text-sm mb-2">{time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-300">
                <span className="w-2 h-2 rounded-full bg-[#c59a63]/40 animate-pulse inline-block" />
                <p className="text-xs uppercase tracking-widest font-bold">Awaiting host assignment</p>
              </div>
              <p className="mt-2 text-xs text-gray-300 font-mono">Bound to Table {tableId}</p>
            </>
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

// ─── Item Customizer Modal ────────────────────────────────────────────────────

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
          Add to Order — ₹{item.price}
        </button>
      </div>
    </div>
  );
};

// ─── Cart Drawer ──────────────────────────────────────────────────────────────

const CartDrawer = ({ cart, onClose, onCheckout, onRemove, onQty }) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const gst = subtotal * GST_RATE;
  const svc = subtotal * SERVICE_CHARGE;
  const total = subtotal + gst + svc;

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
                <span className="font-black text-sm text-[#c59a63]">₹{(item.price * item.qty).toFixed(2)}</span>
                <Stepper qty={item.qty} onMinus={() => onQty(i, -1)} onPlus={() => onQty(i, 1)} />
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="px-6 pb-8 border-t border-gray-50 pt-4">
            <div className="flex flex-col gap-2 mb-4">
              {[['Subtotal', subtotal], ['CGST + SGST (9%)', gst], ['Service Charge (5%)', svc]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-xs text-gray-400 font-semibold">
                  <span>{l}</span><span>₹{v.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-gray-800 mt-2 pt-2 border-t border-gray-50">
                <span>Total</span><span className="text-[#c59a63] text-lg">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => onCheckout(total)}
              className="w-full py-4 rounded-2xl bg-[#c59a63] text-white font-black text-base shadow-xl hover:bg-[#b8895a] transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">contactless</span>
              Pay & Send to Kitchen — ₹{total.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Payment Screen ───────────────────────────────────────────────────────────

const PaymentScreen = ({ total, onSuccess, onCancel }) => {
  const [status, setStatus] = useState('awaiting');
  const txRef = `TXN-${Date.now().toString(36).toUpperCase()}`;

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('processing'), 2000);
    const t2 = setTimeout(() => { setStatus('confirmed'); onSuccess(); }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#c59a6330 2px, transparent 2px)', backgroundSize: '28px 28px' }}>
      <BG />
      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-[0_8px_32px_rgb(0,0,0,0.06)] text-center relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div className="text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Checkout</p>
            <h2 className="text-lg font-black text-gray-800">Payment Gateway</h2>
          </div>
        </div>
        <div className="w-48 h-48 mx-auto bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-4">
          <span className="material-symbols-outlined text-gray-300 text-6xl">qr_code_2</span>
          <p className="text-xs text-gray-400 mt-2">UPI QR Code</p>
        </div>
        <p className="text-2xl font-black text-[#c59a63] mb-1">₹{total.toFixed(2)}</p>
        <p className="text-xs text-gray-400 mb-6 font-mono">Ref: {txRef}</p>
        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold mb-4 transition-all ${status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : status === 'processing' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
          <span className={`material-symbols-outlined text-[18px] ${status === 'processing' ? 'animate-spin' : ''}`}>
            {status === 'confirmed' ? 'check_circle' : status === 'processing' ? 'autorenew' : 'schedule'}
          </span>
          {status === 'confirmed' ? 'Payment Confirmed!' : status === 'processing' ? 'Processing...' : 'Awaiting Scan'}
        </div>
        <div className="flex justify-center gap-4 text-xs text-gray-400">
          {[['qr_code_2', 'UPI'], ['contactless', 'NFC'], ['credit_card', 'Card']].map(([icon, label]) => (
            <span key={label} className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">{icon}</span>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Phase 3: Success Screen & Modals ──────────────────────────────────────────

const FeedbackModal = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
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
          <button onClick={handleSubmit} disabled={rating === 0} className="flex-1 py-3 rounded-xl font-bold text-white bg-[#c59a63] hover:bg-[#b8895a] disabled:opacity-50 transition-colors">Submit</button>
        </div>
      </div>
    </div>
  );
};

const InvoiceModal = ({ total, items, tableId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6 border-b border-gray-100 pb-6">
          <img src="/techhansa-logo.png" alt="Logo" className="h-10 w-auto mx-auto mb-3" />
          <h2 className="font-black text-gray-800">Pragati RMS</h2>
          <p className="text-xs text-gray-400">Table {tableId}</p>
        </div>
        
        <div className="space-y-3 mb-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600"><span className="font-bold mr-1">{item.qty}x</span>{item.name}</span>
              <span className="font-bold text-gray-800">₹{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-100 pt-4 mb-8">
          <div className="flex justify-between text-lg font-black text-gray-900">
            <span>Total Paid</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button className="w-full py-4 mb-3 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
          <span className="material-symbols-outlined text-[20px]">chat</span>
          Get this on your device
        </button>
        
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">Close</button>
      </div>
    </div>
  );
};

const SuccessScreen = ({ guestName, tableId, total, itemCount, mobile, onOrderMore, socket, cart }) => {
  const [mins, setMins] = useState(15);
  const [secs, setSecs] = useState(0);
  const [orderStatus, setOrderStatus] = useState('preparing'); // preparing | ready
  const [showFeedback, setShowFeedback] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handler = () => { setOrderStatus('ready'); };
    socket.on('order_ready', handler);
    return () => socket.off('order_ready', handler);
  }, [socket]);

  useEffect(() => {
    if (orderStatus === 'ready') return;
    const t = setInterval(() => {
      setSecs(s => {
        if (s === 0) {
          if (mins === 0) { clearInterval(t); return 0; }
          setMins(m => m - 1); return 59;
        } return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mins, orderStatus]);

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(#c59a6330 2px, transparent 2px)', backgroundSize: '28px 28px' }}>
      <BG />
      
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showInvoice && <InvoiceModal total={total} items={cart} tableId={tableId} onClose={() => setShowInvoice(false)} />}

      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-[0_8px_32px_rgb(0,0,0,0.06)] text-center relative z-10 transition-all duration-500">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 transition-colors duration-500 ${orderStatus === 'ready' ? 'bg-amber-100 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
          <span className="material-symbols-outlined text-5xl">{orderStatus === 'ready' ? 'room_service' : 'check_circle'}</span>
        </div>
        
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          {orderStatus === 'ready' ? 'Order Complete' : 'Order Confirmed'}
        </p>
        <h2 className="text-2xl font-black text-gray-800 mb-1">
          {orderStatus === 'ready' ? 'Your food is ready!' : 'Ticket Sent to Kitchen!'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {orderStatus === 'ready' ? 'Enjoy your meal.' : `${itemCount} item${itemCount > 1 ? 's are' : ' is'} being prepared.`}
        </p>

        {orderStatus === 'preparing' ? (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Ready In</p>
            <div className="text-4xl font-black text-[#c59a63] tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</div>
          </div>
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

// ─── Menu Screen ──────────────────────────────────────────────────────────────

const MenuScreen = ({ guestName, tableId, mobile, socket, onUnbindRequest }) => {
  const [category, setCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customizerItem, setCustomizerItem] = useState(null);
  const [subScreen, setSubScreen] = useState('menu'); // menu | payment | success
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [liveMenuItems, setLiveMenuItems] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);

  const fetchMenu = useCallback(() => {
    fetch(`${API}/api/admin/menu-items`).then(r => r.json()).then(setLiveMenuItems).catch(console.error);
    fetch(`${API}/api/admin/categories`).then(r => r.json()).then(data => setCustomCategories(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 2500);
  }, []);

  const uniqueCategories = ['All', ...new Set([...customCategories.map(c => c.name), ...liveMenuItems.map(i => i.category || 'General')])];

  const filtered = liveMenuItems.filter(item => {
    if (category !== 'All' && item.category !== category) return false;
    if (dietFilter.includes('Veg') && !item.is_veg) return false;
    return true;
  });

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
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = (total) => { setCartOpen(false); setCheckoutTotal(total); setSubScreen('payment'); };

  const handlePaySuccess = useCallback(async () => {
    try {
      await fetch(`${API}/api/kiosk/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          total: checkoutTotal,
          items: cart.map(item => ({
            id: item._id || item.id,
            name: item.name,
            qty: item.qty,
            mods: item.selections ? Object.values(item.selections).flat() : [],
            note: item.note || '',
            category: item.category
          }))
        })
      });
    } catch (e) {
      console.error('Failed to send order', e);
    }
    
    socket?.emit('payment_confirmed', { table_id: tableId });
    setSubScreen('success');
  }, [checkoutTotal, tableId, socket, cart]);

  const toggleDiet = (tag) => setDietFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  if (subScreen === 'payment') return <PaymentScreen total={checkoutTotal} onSuccess={handlePaySuccess} onCancel={() => setSubScreen('menu')} />;
  if (subScreen === 'success') return <SuccessScreen guestName={guestName} tableId={tableId} total={checkoutTotal} itemCount={cart.reduce((s, i) => s + i.qty, 0)} mobile={mobile} onOrderMore={() => { setCart([]); setSubScreen('menu'); }} socket={socket} cart={cart} />;

  return (
    <div className="min-h-screen bg-[#f5f4f0] font-sans antialiased">
      <Toast message={toast.message} visible={toast.visible} />
      {customizerItem && <CustomizerModal item={customizerItem} onConfirm={(opts) => addToCart(customizerItem, opts)} onCancel={() => setCustomizerItem(null)} />}
      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} onRemove={removeFromCart} onQty={changeQty} />}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/techhansa-logo.png" alt="Pragati RMS" className="h-9 w-auto object-contain" />
            <span className="text-base font-black text-[#c59a63]">Pragati RMS</span>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <span className="material-symbols-outlined text-[14px]">table_restaurant</span>{tableId}
            </span>
          </div>
          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#c59a63] text-white font-bold text-xs shadow-lg hover:bg-[#b8895a] transition-all">
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            <span>{totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''}` : 'Cart'}</span>
            {totalItems > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{totalItems}</span>}
          </button>
        </div>
      </header>

      <main className="pt-20 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Welcome Banner */}
        {guestName && (
          <div className="mt-6 mb-6 bg-white rounded-[24px] px-6 py-5 shadow-[0_4px_24px_rgb(0,0,0,0.04)] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Session</p>
              <h1 className="text-xl font-black text-gray-800 mt-0.5">Welcome, <span className="text-[#c59a63]">{guestName}</span>!</h1>
            </div>
            <div className="flex items-center gap-2 bg-[#c59a63]/10 px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-[#c59a63] text-[16px]">table_restaurant</span>
              <span className="text-xs font-black text-[#c59a63] uppercase tracking-widest">{tableId}</span>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {uniqueCategories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all ${category === cat ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-400 hover:text-gray-800 border border-gray-100 hover:border-gray-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Diet Filters */}
        <div className="flex gap-2 mb-6">
          {['Veg', 'Vegan'].map(f => (
            <button key={f} onClick={() => toggleDiet(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${dietFilter.includes(f) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{f}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item._id || item.id} className="bg-white rounded-[24px] shadow-[0_4px_24px_rgb(0,0,0,0.04)] overflow-hidden hover:-translate-y-1 transition-transform duration-200 flex flex-col">
              <div className="relative h-44 overflow-hidden bg-gray-50">
                {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-cover" />}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`} title={item.is_veg ? 'Veg' : 'Non-Veg'} />
                  <span className="text-sm font-black text-[#c59a63]">₹{item.price}</span>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.category && <Badge text={item.category} color="gray" />}
                  {(item.allergens || []).map(a => <Badge key={a} text={a} color="red" />)}
                </div>
                <h3 className="font-black text-sm text-gray-800 mb-1">{item.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 flex-1">{item.desc}</p>
                <div className="flex items-center justify-between mt-4">
                  {Object.keys(item.mods || {}).length > 0 ? (
                    <button onClick={() => setCustomizerItem(item)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">tune</span>Customize
                    </button>
                  ) : <div />}
                  <button onClick={() => Object.keys(item.mods || {}).length > 0 ? setCustomizerItem(item) : addToCart(item)}
                    className="w-9 h-9 rounded-xl bg-[#c59a63] text-white flex items-center justify-center shadow-md hover:bg-[#b8895a] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call Waiter Bar */}
        <div className="mt-8 bg-white rounded-[24px] px-6 py-5 shadow-[0_4px_24px_rgb(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c59a63]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#c59a63] text-[20px]">support_agent</span>
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">Need Assistance?</p>
              <p className="text-xs text-gray-400">Tap to signal your server</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[['water_drop', 'Water'], ['flatware', 'Cutlery'], ['notifications_active', 'Call Server']].map(([icon, label]) => (
              <button key={label} onClick={() => { socket?.emit('request_service', { message: label }); showToast(`${label} requested!`); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-600 border border-gray-100 transition-colors">
                <span className="material-symbols-outlined text-[14px] text-[#c59a63]">{icon}</span>{label}
              </button>
            ))}
          </div>
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

// ─── Root Module — State Machine ──────────────────────────────────────────────

const ModuleA = () => {
  // Phase detection: check localStorage on every mount
  const [tableId, setTableId] = useState(() => localStorage.getItem(LS_KEY) || null);
  const [kioskScreen, setKioskScreen] = useState('idle'); // idle | menu
  const [session, setSession] = useState({ guestName: null, mobile: null });
  const [socket, setSocket] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // Establish socket whenever we are bound to a table
  useEffect(() => {
    if (!tableId) return;
    const s = io(API);

    // Register this tablet in its table's socket room
    s.emit('register_device', { device_id: tableId, role: 'Customer' });

    // Host started a session → wake the kiosk
    s.on('session_started', (data) => {
      setSession({ guestName: data.guest_name, mobile: data.mobile || null });
      setKioskScreen('idle'); // Show welcome banner
    });

    // Table reset / force close from host
    s.on('session_reset', () => {
      setSession({ guestName: null, mobile: null });
      setKioskScreen('idle');
    });

    setSocket(s);
    return () => s.disconnect();
  }, [tableId]);

  // ── PHASE 3: Unbind ──────────────────────────────────────────────────────
  const handleUnbindSuccess = () => {
    socket?.emit('leave_room', { device_id: tableId });
    socket?.disconnect();
    setSocket(null);
    localStorage.removeItem(LS_KEY);
    setTableId(null);
    setKioskScreen('idle');
    setSession({ guestName: null, mobile: null });
    setShowPinModal(false);
  };

  // ── PHASE 1: Unbound — show Table Discovery ──────────────────────────────
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

  // ── PHASE 2+3: Bound — show Idle or Menu ────────────────────────────────
  return (
    <>
      {showPinModal && (
        <AdminPinModal onSuccess={handleUnbindSuccess} onCancel={() => setShowPinModal(false)} />
      )}

      {kioskScreen === 'idle' && (
        <IdleScreen
          tableId={tableId}
          guestName={session.guestName}
          onStart={() => setKioskScreen('menu')}
          onUnbindRequest={() => setShowPinModal(true)}
        />
      )}

      {kioskScreen === 'menu' && (
        <MenuScreen
          guestName={session.guestName}
          tableId={tableId}
          mobile={session.mobile}
          socket={socket}
          onUnbindRequest={() => setShowPinModal(true)}
        />
      )}
    </>
  );
};

export default ModuleA;
