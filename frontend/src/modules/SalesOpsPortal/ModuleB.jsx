import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:3000';

// ─── Shared UI Atoms ──────────────────────────────────────────────────────────

const Pill = ({ label, color = 'gray' }) => {
  const colors = {
    green:  'bg-green-50 text-green-700 border-green-100',
    red:    'bg-red-50 text-red-700 border-red-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    gray:   'bg-gray-50 text-gray-600 border-gray-100',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${colors[color]}`}>
      {label}
    </span>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl ${
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

// ─── SLA Timer ────────────────────────────────────────────────────────────────

const SLATimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(() => Date.now() - startTime);

  useEffect(() => {
    const iv = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  let colorClass = 'bg-green-100 text-green-700';
  if (elapsed > 600000) colorClass = 'bg-red-100 text-red-700 font-black animate-pulse';
  else if (elapsed > 300000) colorClass = 'bg-amber-100 text-amber-700 font-bold';

  return (
    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${colorClass}`}>
      <span className="material-symbols-outlined text-[13px]">timer</span>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

// ─── Panel 1: Host Stand ──────────────────────────────────────────────────────

const TABLE_DATA = [
  { id: 'T-01', zone: 'Main Hall', status: 'available', guest: null, mobile: null, party: null, capacity: 2 },
  { id: 'T-02', zone: 'Main Hall', status: 'seated',    guest: 'Julian Vance',   mobile: '9876543210', party: 4, capacity: 4 },
  { id: 'T-03', zone: 'Main Hall', status: 'available', guest: null, mobile: null, party: null, capacity: 4 },
  { id: 'T-04', zone: 'Main Hall', status: 'cleaning',  guest: null, mobile: null, party: null, capacity: 6 },
  { id: 'T-05', zone: 'Terrace',   status: 'reserved',  guest: 'Sarah Jenkins',  mobile: '9123456789', party: 2, capacity: 2 },
  { id: 'T-06', zone: 'Terrace',   status: 'seated',    guest: 'Marcus Cole',    mobile: '9000011111', party: 3, capacity: 4 },
  { id: 'T-07', zone: 'Terrace',   status: 'available', guest: null, mobile: null, party: null, capacity: 2 },
  { id: 'T-08', zone: 'Bar',       status: 'available', guest: null, mobile: null, party: null, capacity: 2 },
  { id: 'T-09', zone: 'Bar',       status: 'seated',    guest: 'Priya Anand',    mobile: '9988776655', party: 1, capacity: 2 },
  { id: 'T-10', zone: 'Private',   status: 'reserved',  guest: 'Corp Event',     mobile: '9001234567', party: 12, capacity: 12 },
];

const STATUS_STYLES = {
  available: { ring: 'border-emerald-400', bg: 'bg-white',      text: 'text-gray-700',   label: 'Available', labelColor: 'green',  dot: 'bg-emerald-400' },
  seated:    { ring: 'border-indigo-400',  bg: 'bg-indigo-50',  text: 'text-indigo-800', label: 'Seated',    labelColor: 'indigo', dot: 'bg-indigo-500'  },
  reserved:  { ring: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-800',  label: 'Reserved',  labelColor: 'amber',  dot: 'bg-amber-500'   },
  cleaning:  { ring: 'border-red-400',     bg: 'bg-red-50',     text: 'text-red-800',    label: 'Cleaning',  labelColor: 'red',    dot: 'bg-red-500'     },
  occupied:  { ring: 'border-indigo-400',  bg: 'bg-indigo-50',  text: 'text-indigo-800', label: 'Occupied',  labelColor: 'indigo', dot: 'bg-indigo-500'  },
};

const HostStandPanel = ({ socket }) => {
  const [tables, setTables] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ guestName: '', mobile: '', party: '', bookingMode: 'now', bookingTime: '', packageId: '' });
  const [toast, setToast] = useState(null);
  const [zoneFilter, setZoneFilter] = useState('All');

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/tables`);
      const data = await res.json();
      // Map API shape to local state shape
      setTables(data.map(t => ({
        id: t.table_id,
        zone: t.zone,
        capacity: t.capacity,
        status: t.sessionStatus === 'occupied' ? 'seated' : (t.sessionStatus === 'reserved' ? 'reserved' : 'available'),
        guest: t.guest_name || null,
        mobile: null,
        party: null,
      })));
    } catch (e) {
      console.error('Failed to fetch tables', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/packages`);
      const data = await res.json();
      setPackages(data);
    } catch (e) {
      console.error('Failed to fetch packages', e);
    }
  }, []);

  const fetchBookingsCount = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/bookings`);
      const data = await res.json();
      const activeBookings = data.filter(b => !['cancelled', 'completed'].includes(b.status));
      setBookingsCount(activeBookings.length);
    } catch (e) {
      console.error('Failed to fetch bookings', e);
    }
  }, []);

  useEffect(() => { fetchTables(); fetchPackages(); fetchBookingsCount(); }, [fetchTables, fetchPackages, fetchBookingsCount]);

  // Listen for socket events to refresh
  useEffect(() => {
    if (!socket) return;
    socket.on('session_started', fetchTables);
    socket.on('session_reset', fetchTables);
    socket.on('refresh_tables', fetchTables);
    socket.on('refresh_tables', fetchBookingsCount);
    return () => { 
      socket.off('session_started', fetchTables); 
      socket.off('session_reset', fetchTables); 
      socket.off('refresh_tables', fetchTables); 
      socket.off('refresh_tables', fetchBookingsCount);
    };
  }, [socket, fetchTables, fetchBookingsCount]);

  const zones = ['All', ...new Set(tables.map(t => t.zone))];
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (table) => {
    if (table.status !== 'available') return;
    setSelected(table);
    setModal(true);
    
    // Set default booking time to next 30 min block
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
    
    setForm({ guestName: '', mobile: '', party: '', bookingMode: 'now', bookingTime: localISOTime, packageId: '' });
  };

  const startSession = async (e) => {
    e.preventDefault();
    if (!selected) return;

    if (form.bookingMode === 'future') {
      // Create a booking
      try {
        const res = await fetch(`${API}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_id: selected.id,
            guest_name: form.guestName,
            mobile: form.mobile,
            party_size: parseInt(form.party) || 1,
            booking_time: new Date(form.bookingTime).toISOString(),
            package_id: form.packageId || undefined
          })
        });
        if (res.ok) {
          showToast(`Future booking scheduled for ${form.guestName} at ${selected.id}`);
          setModal(false);
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to schedule booking', 'error');
        }
      } catch (err) {
        showToast('Error scheduling booking', 'error');
      }
    } else {
      // Start session now
      socket.emit('start_session', { 
        device_id: selected.id, 
        guest_name: form.guestName, 
        mobile: form.mobile,
        package_id: form.packageId || undefined 
      });
      setTables(prev => prev.map(t => t.id === selected.id
        ? { ...t, status: 'seated', guest: form.guestName, mobile: form.mobile, party: parseInt(form.party) || 1 }
        : t));
      setModal(false);
      showToast(`Session started for ${form.guestName} at ${selected.id}`);
    }
  };

  const markCleaned = (tableId) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'available', guest: null, mobile: null, party: null } : t));
    showToast(`Table ${tableId} marked as available.`);
  };

  const forceClose = (tableId) => {
    fetch(`${API}/api/sales/session/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: tableId }) }).catch(console.error);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'cleaning', guest: null, mobile: null, party: null } : t));
    showToast(`Session closed. Table ${tableId} needs cleaning.`, 'error');
  };

  const filtered = zoneFilter === 'All' ? tables : tables.filter(t => t.zone === zoneFilter);
  const counts = { available: tables.filter(t => t.status === 'available').length, seated: tables.filter(t => t.status === 'seated').length, bookings: bookingsCount, cleaning: tables.filter(t => t.status === 'cleaning').length };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-300">
      <span className="material-symbols-outlined text-4xl animate-spin">autorenew</span>
    </div>
  );

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Session Modal */}
      {modal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-md mx-4 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-800">Initialize {selected.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selected.zone} · {selected.capacity} covers</p>
              </div>
              <button onClick={() => setModal(false)} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={startSession} className="flex flex-col gap-4">
              <div className="flex bg-gray-100 p-1 rounded-xl w-full mb-2">
                <button type="button" onClick={() => setForm(p => ({...p, bookingMode: 'now'}))} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${form.bookingMode === 'now' ? 'bg-white shadow text-[#c59a63]' : 'text-gray-400'}`}>Now</button>
                <button type="button" onClick={() => setForm(p => ({...p, bookingMode: 'future'}))} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${form.bookingMode === 'future' ? 'bg-white shadow text-[#c59a63]' : 'text-gray-400'}`}>Future Booking</button>
              </div>

              {form.bookingMode === 'future' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Date & Time *</label>
                  <input type="datetime-local" required value={form.bookingTime} onChange={e => setForm(p => ({ ...p, bookingTime: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Guest Name *</label>
                <input required value={form.guestName} onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))} placeholder="e.g. Vance Party" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Mobile Number</label>
                  <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="e.g. 9876543210" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Party Size</label>
                  <input type="number" min="1" max={selected.capacity} value={form.party} onChange={e => setForm(p => ({ ...p, party: e.target.value }))} placeholder={`Max ${selected.capacity}`} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Apply Package (Optional)</label>
                <select value={form.packageId} onChange={e => setForm(p => ({ ...p, packageId: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors appearance-none">
                  <option value="">-- No Package --</option>
                  {packages.map(pkg => (
                    <option key={pkg._id} value={pkg._id}>{pkg.name} {pkg.pricing_type === 'free' ? '(Free)' : `(₹${pkg.price}/pp)`}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full py-3.5 rounded-xl bg-[#c59a63] hover:bg-[#b8895a] text-white font-bold text-sm shadow-lg shadow-[#c59a63]/30 flex items-center justify-center gap-2 transition-all mt-2">
                <span className="material-symbols-outlined text-[18px]">{form.bookingMode === 'now' ? 'play_arrow' : 'calendar_month'}</span>
                {form.bookingMode === 'now' ? 'Start Dining Session' : 'Schedule Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Available', count: counts.available, icon: 'check_circle', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Seated',    count: counts.seated,    icon: 'people',        color: 'text-indigo-500', bg: 'bg-indigo-50'  },
          { label: 'Bookings',  count: counts.bookings,  icon: 'calendar_today',color: 'text-amber-500', bg: 'bg-amber-50'   },
          { label: 'Cleaning',  count: counts.cleaning,  icon: 'cleaning_services', color: 'text-red-500', bg: 'bg-red-50'  },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-2xl flex items-center justify-center`}>
              <span className={`material-symbols-outlined ${s.color} text-[20px]`}>{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-800">{s.count}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone Filter + Legend */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1.5 bg-gray-50 border border-gray-100 rounded-2xl p-1">
          {zones.map(z => (
            <button key={z} onClick={() => setZoneFilter(z)} className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${zoneFilter === z ? 'bg-white shadow text-[#c59a63]' : 'text-gray-400 hover:text-gray-700'}`}>{z}</button>
          ))}
        </div>

      </div>

      {/* Floor Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(table => {
          const style = STATUS_STYLES[table.status] || STATUS_STYLES.available;
          const isClickable = table.status === 'available';
          return (
            <div
              key={table.id}
              onClick={() => isClickable && openModal(table)}
              className={`${style.bg} ${style.ring} border rounded-2xl p-5 flex flex-col gap-3 shadow-sm transition-all duration-200 ${isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${style.text}`}>table_restaurant</span>
                  <span className={`font-black text-base ${style.text}`}>{table.id}</span>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${style.text} opacity-60`}>
                  <span className="material-symbols-outlined text-[12px]">person</span>
                  {table.capacity}
                </div>
              </div>

              <div>
                <Pill label={style.label} color={style.labelColor} />
                {table.guest && <p className={`text-sm font-bold mt-2 ${style.text} truncate`}>{table.guest}</p>}
                {table.party && <p className={`text-[10px] mt-0.5 ${style.text} opacity-60`}>Party of {table.party}</p>}
                {table.zone && <p className="text-[9px] mt-1 text-gray-400 font-semibold uppercase tracking-widest">{table.zone}</p>}
                {table.status === 'available' && <p className="text-[10px] mt-2 text-gray-400">Tap to seat guests</p>}
              </div>

              {(table.status === 'seated' || table.status === 'cleaning') && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-current border-opacity-10">
                  {table.status === 'seated' && (
                    <button onClick={e => { e.stopPropagation(); forceClose(table.id); }} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/90 ${style.text} transition-colors`}>
                      <span className="material-symbols-outlined text-[13px]">block</span> Force Close
                    </button>
                  )}
                  {table.status === 'cleaning' && (
                    <button onClick={e => { e.stopPropagation(); markCleaned(table.id); }} className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/90 text-red-700 transition-colors">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> Mark Cleaned
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─── Panel 4: Table Management ────────────────────────────────────────────────

const TableManagementPanel = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ table_id: '', label: '', zone: 'Main Hall', capacity: 4 });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Extract unique zones from existing tables
  const existingZones = [...new Set(tables.map(t => t.zone))].filter(Boolean);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tables`);
      const data = await res.json();
      setTables(data);
    } catch { showToast('Failed to load tables.', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: parseInt(form.capacity) }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to add table.', 'error'); return; }
      showToast(`Table ${data.table_id} added successfully.`);
      setShowForm(false);
      setForm({ table_id: '', label: '', zone: 'Main Hall', capacity: 4 });
      fetchTables();
    } catch { showToast('Server error.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (tableId) => {
    try {
      const res = await fetch(`${API}/api/tables/${tableId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Cannot delete.', 'error'); return; }
      showToast(`Table ${tableId} removed.`);
      fetchTables();
    } catch { showToast('Server error.', 'error'); }
    finally { setConfirmDelete(null); }
  };

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-[28px]">delete_forever</span>
            </div>
            <h3 className="font-black text-lg text-gray-800 mb-1">Remove Table {confirmDelete}?</h3>
            <p className="text-xs text-gray-400 mb-6">This will deactivate the table and remove it from the floor plan and kiosk discovery list.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-800">Table Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Add, configure, or remove tables from the floor plan</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c59a63] hover:bg-[#b8895a] text-white font-bold text-xs shadow-lg shadow-[#c59a63]/30 transition-all">
          <span className="material-symbols-outlined text-[16px]">add</span>Add Table
        </button>
      </div>

      {/* Add Table Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-base text-gray-800">New Table</h3>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Table ID *</label>
              <input required value={form.table_id} onChange={e => setForm(p => ({ ...p, table_id: e.target.value }))} placeholder="e.g. T16 or Bar-03" className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Display Label *</label>
              <input required value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. T16" className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Zone</label>
              <input list="zones-list" value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))} placeholder="e.g. Patio" className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
              <datalist id="zones-list">
                {existingZones.map(z => <option key={z} value={z} />)}
              </datalist>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Capacity (covers)</label>
              <input type="number" min="1" max="30" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-[#c59a63] transition-colors" />
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#c59a63] hover:bg-[#b8895a] text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><span className="material-symbols-outlined animate-spin text-[16px]">autorenew</span>Saving...</> : <><span className="material-symbols-outlined text-[16px]">save</span>Save Table</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-300">
          <span className="material-symbols-outlined text-4xl animate-spin">autorenew</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {['Table ID', 'Label', 'Zone', 'Capacity', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-300 text-sm">No tables configured.</td></tr>
              )}
              {tables.map(t => (
                <tr key={t.table_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-800">{t.table_id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-600">{t.label}</td>
                  <td className="px-6 py-4 text-gray-500">{t.zone}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-gray-500">
                      <span className="material-symbols-outlined text-[14px]">person</span>{t.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {t.sessionStatus === 'occupied'
                      ? <Pill label="Occupied" color="indigo" />
                      : <Pill label="Available" color="green" />}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setConfirmDelete(t.table_id)}
                      disabled={t.sessionStatus === 'occupied'}
                      title={t.sessionStatus === 'occupied' ? 'Close session first' : 'Remove table'}
                      className="text-gray-300 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};


const COURSES = { starter: { label: 'Starter', color: 'bg-sky-100 text-sky-700' }, main: { label: 'Main', color: 'bg-orange-100 text-orange-700' }, dessert: { label: 'Dessert', color: 'bg-purple-100 text-purple-700' } };
const MOD_COLORS = ['bg-blue-100 text-blue-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700'];

const KDSPanel = ({ socket }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Fetch initial active orders
  useEffect(() => {
    fetch(`${API}/api/kitchen/active-orders`)
      .then(res => res.json())
      .then(data => {
        // Convert timestamp strings to Date objects/numbers for the SLATimer
        setOrders(data.map(o => ({ ...o, time: new Date(o.time).getTime() })));
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit('register_device', { role: 'Kitchen', device_id: 'KDS-1' });
    socket.on('new_kot', (order) => {
      setOrders(prev => [...prev, { ...order, time: new Date(order.time).getTime() }]);
    });
    return () => socket.off('new_kot');
  }, [socket]);

  const bump = async (id) => {
    try {
      await fetch(`${API}/api/kitchen/bump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: id })
      });
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e) {
      console.error('Failed to bump', e);
    }
  };
  const filtered = orders;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-300">
      <span className="material-symbols-outlined text-4xl animate-spin">autorenew</span>
    </div>
  );

  return (
    <>
      {/* KDS Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-400 text-[20px]">local_fire_department</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800">Kitchen Display</h2>
            <p className="text-xs text-gray-400">Hot Line / Expediter View</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setCompactView(!compactView)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all ${compactView ? 'bg-[#c59a63] text-white border-[#c59a63]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#c59a63] hover:text-[#c59a63]'}`}>
            <span className="material-symbols-outlined text-[18px]">{compactView ? 'view_column' : 'grid_view'}</span>
            {compactView ? 'Scroll View' : 'View All'}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{filtered.length} Active Tickets</span>
          </div>
        </div>
      </div>

      {/* Ticket Kanban / Grid */}
      <div ref={compactView ? null : scrollRef} className={compactView ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6' : 'flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x'}>
        {filtered.map(order => {
          const elapsed = Date.now() - order.time;
          const slaColor = elapsed > 600000 ? 'border-red-400' : elapsed > 300000 ? 'border-amber-400' : 'border-emerald-400';
          const course = COURSES[order.course] || COURSES.main;

          return (
            <div key={order.id} className={`${compactView ? 'w-full' : 'w-80 flex-shrink-0'} bg-white rounded-2xl border border-gray-100 border-t-4 ${slaColor} shadow-sm flex flex-col overflow-hidden transition-all hover:-translate-y-1 duration-200`}>
              {/* Ticket Header */}
              <div className={`${compactView ? 'px-4 py-3' : 'px-5 py-4'} border-b border-gray-50 flex items-center justify-between`}>
                <div>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Ticket ID</p>
                  <h3 className={`${compactView ? 'text-sm' : 'text-base'} font-black text-gray-900`}>{order.id}</h3>
                </div>
                <SLATimer startTime={order.time} />
              </div>

              {/* Course & Station badges */}
              <div className={`${compactView ? 'px-4 pt-2 pb-1' : 'px-5 pt-3 pb-1'} flex items-center gap-2`}>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${course.color}`}>{course.label}</span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{order.station}</span>
              </div>

              {/* Items */}
              <div className={`flex-1 ${compactView ? 'px-4 py-2' : 'px-5 py-3'} flex flex-col ${compactView ? 'gap-2' : 'gap-4'}`}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={`pb-2 ${idx < order.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`${compactView ? 'text-base' : 'text-lg'} font-black text-[#c59a63] leading-none`}>{item.qty}×</span>
                      <span className={`${compactView ? 'text-xs' : 'text-sm'} font-bold text-gray-800 leading-tight`}>{item.name}</span>
                    </div>
                    {item.note && (
                      <div className="flex items-center gap-1 mb-1.5 px-2 py-1 rounded-lg bg-red-50 border border-red-100">
                        <span className="material-symbols-outlined text-red-500 text-[12px]">warning</span>
                        <span className="text-[10px] font-bold text-red-600">{item.note}</span>
                      </div>
                    )}
                    {!compactView && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.mods?.map((mod, mi) => (
                          <span key={mi} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${MOD_COLORS[mi % MOD_COLORS.length]}`}>{mod}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bump Button */}
              <div className={`${compactView ? 'px-4 pb-4' : 'px-5 pb-5'}`}>
                <button onClick={() => bump(order.id)} className={`w-full ${compactView ? 'py-2.5' : 'py-3'} rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-900/20`}>
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">done_all</span>
                  Bump
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="w-72 h-72 border-2 border-dashed border-gray-100 rounded-[24px] flex flex-col items-center justify-center text-gray-300">
            <span className="material-symbols-outlined text-5xl mb-3">restaurant_menu</span>
            <p className="text-sm font-semibold">No Active Tickets</p>
            <p className="text-xs mt-1">The kitchen is clear!</p>
          </div>
        )}
      </div>
    </>
  );
};


// ─── Panel 5: Customer Details ────────────────────────────────────────────────

const CustomerDetailsPanel = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/customers`)
      .then(res => res.json())
      .then(data => { setCustomers(data); setLoading(false); })
      .catch(console.error);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-300">
      <span className="material-symbols-outlined text-4xl animate-spin">autorenew</span>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-800">Customer Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">Guest registry and visit history</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
          <span className="material-symbols-outlined text-gray-400 text-[18px]">group</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{customers.length} Guests</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {['Guest Name', 'Mobile Number', 'Total Visits', 'Last Visit'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-gray-300 text-sm">No customers registered yet.</td></tr>
            )}
            {customers.map(c => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-800">{c.guest_name}</td>
                <td className="px-6 py-4 font-mono text-gray-500">{c.mobile}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#c59a63]/10 text-[#c59a63] font-bold text-xs">
                    {c.total_visits}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                  {new Date(c.last_visit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Panel 6: Order History ───────────────────────────────────────────────────

const OrderHistoryPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderDate, setOrderDate] = useState('');
  const dateInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/kitchen/history${orderDate ? `?date=${orderDate}` : ''}`)
      .then(res => res.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(console.error);
  }, [orderDate]);

  if (loading && orders.length === 0) return (
    <div className="flex items-center justify-center h-64 text-gray-300">
      <span className="material-symbols-outlined text-4xl animate-spin">autorenew</span>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-gray-800">Order History</h2>
          <p className="text-xs text-gray-400 mt-0.5">Recently completed and paid orders</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="relative flex items-center cursor-pointer" onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:border-[#c59a63] transition-colors pointer-events-none">
              <span className="material-symbols-outlined text-[16px] text-[#c59a63]">calendar_today</span>
              <span>
                {orderDate 
                  ? new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'All Time'
                }
              </span>
              <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', bottom: 0, left: '50%', opacity: 0, pointerEvents: 'none' }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
            <span className="material-symbols-outlined text-gray-400 text-[18px]">receipt_long</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{orders.length} Orders</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {['Table', 'Items', 'Status', 'Completed At'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-gray-300 text-sm">No historical orders found.</td></tr>
            )}
            {orders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-800">{o.table_id}</td>
                <td className="px-6 py-4">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="text-xs text-gray-600 mb-1">
                      <span className="font-bold">{item.qty}x</span> {item.name}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full font-bold text-[10px] uppercase tracking-widest ${
                    o.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                  {new Date(o.completedAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ─── Panel 5: Bookings ─────────────────────────────────────────────────────────

const BookingsPanel = ({ socket }) => {
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/bookings`);
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    if (!socket) return;
    socket.on('refresh_tables', fetchBookings);
    return () => socket.off('refresh_tables', fetchBookings);
  }, [socket, fetchBookings]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const cancelBooking = async (id, tableId) => {
    if (!window.confirm('Cancel this booking and free the table?')) return;
    try {
      const res = await fetch(`${API}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        // Free the table
        await fetch(`${API}/api/sales/session/close`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ device_id: tableId }) 
        });
        showToast('Booking cancelled & Table freed');
        fetchBookings();
        if (socket) socket.emit('admin_override_reset', { device_id: tableId });
      } else {
        showToast('Failed to cancel', 'error');
      }
    } catch (err) {
      showToast('Error', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'amber';
      case 'ready': return 'cyan';
      case 'active': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-gray-800">Future Bookings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage upcoming reservations</p>
        </div>
        <button onClick={fetchBookings} className="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm font-bold text-gray-600 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh
        </button>
      </div>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Booking Time</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Guest</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Table</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Package</th>
              <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-4">Status</th>
              <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? bookings.map(b => (
              <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4 font-semibold text-gray-800">
                  {new Date(b.booking_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-gray-900">{b.guest_name}</div>
                  <div className="text-xs text-gray-500">{b.mobile || 'No mobile'} · Party of {b.party_size}</div>
                </td>
                <td className="px-4 py-4 font-bold text-gray-700">{b.table_id}</td>
                <td className="px-4 py-4">
                  {b.package_id ? (
                    <span className="px-2 py-1 bg-pink-50 text-pink-700 text-xs font-bold rounded-lg">{b.package_id.name}</span>
                  ) : <span className="text-gray-400 text-xs">-</span>}
                </td>
                <td className="px-4 py-4">
                  <Pill label={b.status} color={getStatusColor(b.status)} />
                </td>
                <td className="px-6 py-4 text-right">
                  {['pending', 'ready', 'active', 'standby'].includes(b.status) && (
                    <button onClick={() => cancelBooking(b._id, b.table_id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            )) : <tr><td colSpan={6} className="text-center text-gray-400 py-12">No bookings found.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── Navigation Config ────────────────────────────────────────────────────────

const NAV = [
  { key: 'host',      label: 'Host Stand',       icon: 'table_restaurant', group: 'Front of House' },
  { key: 'bookings',  label: 'Bookings',         icon: 'calendar_month',   group: 'Front of House' },
  { key: 'tables',    label: 'Table Management', icon: 'grid_view',        group: 'Front of House' },
  { key: 'customers', label: 'Customer Details', icon: 'group',            group: 'Front of House' },
  { key: 'kds',       label: 'Kitchen Display',  icon: 'soup_kitchen',     group: 'Kitchen' },
  { key: 'history',   label: 'Order History',    icon: 'receipt_long',     group: 'Reports' },
];

const PANELS = { host: HostStandPanel, bookings: BookingsPanel, tables: TableManagementPanel, customers: CustomerDetailsPanel, kds: KDSPanel, history: OrderHistoryPanel };

// ─── Shell ────────────────────────────────────────────────────────────────────

const ModuleB = () => {
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('role') === 'Kitchen' ? 'kds' : 'host');
  const navigate = useNavigate();

  useEffect(() => {
    const s = io(API);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const handleLogout = async () => {
    const username = sessionStorage.getItem('username');
    if (username) {
      try {
        await fetch(`${API}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
      } catch (err) {
        console.error(err);
      }
    }
    sessionStorage.clear();
    navigate('/');
  };
  const groups = [...new Set(NAV.map(n => n.group))];
  const ActivePanel = PANELS[activeTab] || HostStandPanel;

  if (!socket) return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-300">
        <span className="material-symbols-outlined text-5xl animate-spin">autorenew</span>
        <p className="text-sm font-semibold">Connecting to server...</p>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen font-sans text-slate-800 antialiased selection:bg-[#c59a63]/30 flex flex-col"
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
      {/* ── HEADER NAV ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-5 h-[90px] flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/techhansa-logo.png" alt="Pragati RMS" className="h-16 w-auto object-contain" />
            <span className="text-3xl font-black tracking-tight text-[#c59a63] hidden sm:block">Pragati RMS</span>
          </div>
          
          <nav className="hidden lg:flex items-center bg-gray-100 rounded-full p-1 gap-0.5 mx-auto">
            {NAV.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === item.key
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[9px] font-black tracking-widest uppercase">
              <span className="material-symbols-outlined text-[12px]">storefront</span>
              Sales &amp; Ops
            </div>
            <div className="w-px h-4 bg-gray-200 mx-1 hidden md:block"></div>
            <button onClick={handleLogout} className="flex items-center gap-1 px-2 py-1.5 rounded-full text-[13px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 transition-all" title="Log Out">
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 overflow-x-hidden">
        <ActivePanel socket={socket} />
      </main>
    </div>
  );
};

export default ModuleB;
