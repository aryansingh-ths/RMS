require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const { User, Device, Table, TableSession, Order, Recipe, Inventory, MenuItem, Customer, Category, Vendor, PurchaseOrder, AuditLog, Shift, TaxConfig, Package, Booking, Feedback } = require('./models');

const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

const sendConfirmationEmail = async (email, guestName, authCode) => {
  if (!email) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer re_HSDjYy61_2GZdgEwXzD1vamAPu5XoEXAV`
      },
      body: JSON.stringify({
        from: 'Pragati RMS <onboarding@resend.dev>',
        to: email,
        subject: 'Your Booking Confirmation & Access Code',
        html: `<h2>Welcome, ${guestName}!</h2><p>Your booking is confirmed.</p><p>To access the menu on your table, please use this 4-digit code: <strong>${authCode}</strong></p>`
      })
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Email successfully sent to ${email} (Resend ID: ${data.id})`);
      return true;
    } else {
      console.error(`❌ Resend API Error for ${email}:`, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Network error while sending email to ${email}:`, error);
    return false;
  }
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('MongoDB connected');
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany([
        { username: 'admin', password_hash: 'admin123', role: 'Admin' },
        { username: 'host', password_hash: 'host123', role: 'Host' },
        { username: 'kitchen', password_hash: 'kitchen123', role: 'Kitchen' }
      ]);
      console.log('Default users seeded: admin, host, kitchen (passwords: admin123, host123, kitchen123)');
    }
  } catch (err) {
    console.error('Error seeding users:', err);
  }

  try {
    const invCount = await Inventory.countDocuments();
    if (invCount === 0) {
      const invItems = await Inventory.insertMany([
        { ingredient_name: 'Hudson Valley Duck Breast', stock_level: 4.2, unit: 'kg', par_level: 18.0, vendor_name: 'D\'Artagnan Provisions', cost_per_unit: 42.0 },
        { ingredient_name: 'Norcia Black Truffle', stock_level: 620, unit: 'g', par_level: 800, vendor_name: 'Urbani Tartufi Italy', cost_per_unit: 2.5 },
        { ingredient_name: 'A5 Wagyu Striploin', stock_level: 14.6, unit: 'kg', par_level: 15.0, vendor_name: 'Miyazaki Imports', cost_per_unit: 145.0 },
        { ingredient_name: 'Montmorency Cherries', stock_level: 2.1, unit: 'kg', par_level: 5.0, vendor_name: 'Baldor Specialty', cost_per_unit: 12.0 },
        { ingredient_name: 'Heritage Baby Carrots', stock_level: 12, unit: 'kg', par_level: 20.0, vendor_name: 'Baldor Specialty', cost_per_unit: 8.5 }
      ]);

      const menuItems = await MenuItem.insertMany([
        { name: 'Pan-Seared Duck Breast', price: 46.00, category: 'Entree' },
        { name: 'Truffle Tagliolini', price: 34.00, category: 'Pasta' },
        { name: 'Wood-Fired Wagyu A5', price: 95.00, category: 'Entree' }
      ]);

      await Recipe.insertMany([
        {
          menu_item_id: menuItems[0]._id,
          ingredients: [
            { inventory_id: invItems[0]._id, quantity_required: 0.32 },
            { inventory_id: invItems[3]._id, quantity_required: 0.045 },
            { inventory_id: invItems[4]._id, quantity_required: 0.12 }
          ]
        },
        {
          menu_item_id: menuItems[1]._id,
          ingredients: [
            { inventory_id: invItems[1]._id, quantity_required: 15 }
          ]
        },
        {
          menu_item_id: menuItems[2]._id,
          ingredients: [
            { inventory_id: invItems[2]._id, quantity_required: 0.25 }
          ]
        }
      ]);
      console.log('Default Inventory, MenuItems, and Recipes seeded.');
    }
  } catch (err) {
    console.error('Error seeding inventory/recipes:', err);
  }

  // Seed default tables T1–T15 if none exist
  try {
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const zones = ['Main Hall', 'Main Hall', 'Main Hall', 'Main Hall', 'Main Hall',
        'Terrace', 'Terrace', 'Terrace', 'Bar', 'Bar',
        'Bar', 'Private', 'Private', 'Private', 'Private'];
      const caps = [2, 4, 4, 6, 2, 2, 4, 4, 2, 2, 4, 8, 10, 12, 12];
      await Table.insertMany(
        Array.from({ length: 15 }, (_, i) => ({
          table_id: `T${i + 1}`,
          label: `T${i + 1}`,
          zone: zones[i],
          capacity: caps[i],
          is_active: true,
        }))
      );
      console.log('Default tables T1–T15 seeded.');
    }
  } catch (err) {
    console.error('Error seeding tables:', err);
  }
})
  .catch(err => console.error('MongoDB connection error:', err));

// --- CATEGORIES ---
app.get('/api/admin/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/categories', async (req, res) => {
  try {
    const { name, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const category = new Category({ name, tags: tags || [] });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MENU ITEMS ---

// 1. Auth: Login for Admin, Host, Kitchen
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

    // Log the login action
    await AuditLog.create({
      action: 'User Login',
      user: user.username,
      details: `User ${user.username} (${user.role}) logged into the system.`
    });

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password for a staff user (Admin action)
app.post('/api/admin/staff/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password_hash: newPassword.trim() },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    await AuditLog.create({
      action: 'Password Reset',
      user: 'Admin',
      details: `Admin reset the password for user ${user.username} (${user.role}).`
    });
    res.json({ success: true, message: `Password for ${user.username} has been reset.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const { username } = req.body;
  try {
    if (username) {
      await AuditLog.create({
        action: 'User Logout',
        user: username,
        details: `User ${username} logged out of the system.`
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Checkout Webhook
app.post('/api/checkout/webhook', async (req, res) => {
  const { order_id } = req.body;

  // Using a MongoDB session for atomic transaction (requires replica set)
  if (order_id === 'mock_order_id') {
    io.to('kds').emit('new_kot', { order_id: 'MOCK-1234', items: [], timestamp: new Date() });
    return res.json({ success: true, message: 'Mock order processed successfully' });
  }

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const order = await Order.findById(order_id).session(session);
    if (!order || order.status === 'paid') {
      throw new Error('Order not found or already paid');
    }

    // 1. Update order status to paid
    order.status = 'paid';
    await order.save({ session });

    // 2. Deduct inventory based on recipes
    for (const item of order.items) {
      const recipe = await Recipe.findOne({ menu_item_id: item.menu_item_id }).session(session);
      if (recipe) {
        for (const ingredient of recipe.ingredients) {
          const deduction = ingredient.quantity_required * (item.qty || 1);
          await Inventory.findByIdAndUpdate(
            ingredient.inventory_id,
            { $inc: { stock_level: -deduction } },
            { session }
          );
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    // 3. Emit new_kot event to KDS
    io.to('kds').emit('new_kot', { order_id: order._id, items: order.items, timestamp: new Date() });

    // Also notify the table that payment succeeded
    const tableSession = await TableSession.findById(order.session_id);
    if (tableSession) {
      io.to(`room_table_${tableSession.device_id}`).emit('payment_success', { order_id: order._id });
    }

    res.json({ success: true, message: 'Checkout processed successfully' });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error('Webhook transaction failed:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- TAX CONFIG ---
app.get('/api/admin/tax-config', async (req, res) => {
  try {
    const taxes = await TaxConfig.find().sort({ createdAt: 1 });
    res.json(taxes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/tax-config', async (req, res) => {
  try {
    const { name, rate, is_active } = req.body;
    if (!name || rate == null) return res.status(400).json({ error: 'Name and rate are required' });
    const tax = new TaxConfig({ name, rate, is_active });
    await tax.save();
    res.status(201).json(tax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/tax-config/:id', async (req, res) => {
  try {
    const { name, rate, is_active } = req.body;
    const tax = await TaxConfig.findByIdAndUpdate(req.params.id, { name, rate, is_active }, { new: true });
    res.json(tax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/tax-config/:id', async (req, res) => {
  try {
    await TaxConfig.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN CONSOLE API ROUTES ---

// Get Dashboard Metrics
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const { filter, date } = req.query;
    const now = new Date();

    // ── Build current-period date range ──────────────────────────────────────
    let currentStart = new Date(now);
    let currentEnd = new Date(now);
    let periodMs = 0; // length of the period in ms, used to compute previous period

    if (filter === 'custom' && date) {
      currentStart = new Date(date); currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(date); currentEnd.setHours(23, 59, 59, 999);
      periodMs = 24 * 60 * 60 * 1000;
    } else if (filter === 'week') {
      currentStart.setDate(now.getDate() - now.getDay()); currentStart.setHours(0, 0, 0, 0);
      periodMs = 7 * 24 * 60 * 60 * 1000;
    } else if (filter === 'month') {
      currentStart.setDate(1); currentStart.setHours(0, 0, 0, 0);
      periodMs = (now - currentStart);
    } else if (filter === 'year') {
      currentStart.setMonth(0, 1); currentStart.setHours(0, 0, 0, 0);
      periodMs = (now - currentStart);
    } else { // day (default)
      currentStart.setHours(0, 0, 0, 0);
      periodMs = 24 * 60 * 60 * 1000;
    }

    // ── Build previous-period date range (same duration, one period back) ────
    const prevEnd = new Date(currentStart.getTime() - 1);       // 1ms before current start
    const prevStart = new Date(currentStart.getTime() - periodMs); // one period back

    // ── Fetch orders ─────────────────────────────────────────────────────────
    const [currentOrders, prevOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: currentStart, $lte: currentEnd } }),
      Order.find({ createdAt: { $gte: prevStart, $lte: prevEnd } }),
    ]);

    // ── Current-period revenue ────────────────────────────────────────────────
    const dailyRevenue = currentOrders
      .filter(o => o.status === 'paid' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // ── Previous-period revenue & growth ──────────────────────────────────────
    const previousRevenue = prevOrders
      .filter(o => o.status === 'paid' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const revenueGrowthPct = previousRevenue > 0
      ? parseFloat((((dailyRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1))
      : null; // null means "no previous data"

    // ── Order counts ──────────────────────────────────────────────────────────
    const totalOrdersToday = currentOrders.length;
    const previousOrderCount = prevOrders.length;
    const orderCountDelta = totalOrdersToday - previousOrderCount;
    const pendingOrdersToday = currentOrders.filter(o => o.status === 'preparing').length;
    const deliveredOrdersToday = currentOrders.filter(o => o.status === 'completed' || o.status === 'paid').length;

    const cancellationsToday = currentOrders.filter(o => o.status === 'cancelled').length;

    // Average Wait Time for completed/paid orders
    const completedOrdersForWaitTime = currentOrders.filter(o => o.status === 'completed' || o.status === 'paid');
    const avgWaitTimeSeconds = completedOrdersForWaitTime.length > 0
      ? Math.round(completedOrdersForWaitTime.reduce((sum, o) => {
        const endTime = o.completedAt ? new Date(o.completedAt) : new Date(o.updatedAt);
        return sum + (endTime - new Date(o.createdAt)) / 1000;
      }, 0) / completedOrdersForWaitTime.length)
      : 0;

    // Payment Split
    const paidWithMethod = currentOrders.filter(o => o.payment_method && (o.status === 'paid' || o.status === 'completed'));
    const totalWithMethod = paidWithMethod.length;
    let paymentUpiCardPct = 0;
    let paymentCashPct = 0;
    if (totalWithMethod > 0) {
      const upiCardCount = paidWithMethod.filter(o => o.payment_method === 'upi' || o.payment_method === 'card').length;
      const cashCount = paidWithMethod.filter(o => o.payment_method === 'cash').length;
      paymentUpiCardPct = Math.round((upiCardCount / totalWithMethod) * 100);
      paymentCashPct = Math.round((cashCount / totalWithMethod) * 100);
    }


    // ── Dine-In vs Takeaway split ─────────────────────────────────────────────
    // Uses the new order_type field. Fallback to device_id parsing for older orders.
    const dineInCount = currentOrders.filter(o => o.order_type ? o.order_type === 'dine_in' : /^T\d+$/i.test(o.device_id)).length;
    const takeawayCount = currentOrders.filter(o => o.order_type ? o.order_type === 'takeaway' : !/^T\d+$/i.test(o.device_id)).length;

    // ── Inventory ─────────────────────────────────────────────────────────────
    const inventory = await Inventory.find();
    const inventoryValuation = inventory.reduce((sum, item) => sum + (item.stock_level * (item.cost_per_unit || 1)), 0);
    const parAlerts = inventory.filter(item => (item.stock_level + (item.on_order || 0)) <= item.par_level);

    // ── Floor Occupancy ───────────────────────────────────────────────────────
    const totalTables = await Table.countDocuments({ is_active: true });
    const activeSessions = await TableSession.countDocuments({ status: 'active' });
    const floorOccupancy = totalTables > 0 ? Math.round((activeSessions / totalTables) * 100) : 0;

    // ── Top Sellers with growth ───────────────────────────────────────────────
    const buildItemMap = (orders) => {
      const map = {};
      orders.forEach(order => {
        if (!Array.isArray(order.items)) return;
        order.items.forEach(item => {
          if (!map[item.name]) map[item.name] = { qty: 0, revenue: 0, category: item.category || 'Main Course' };
          map[item.name].qty += (item.qty || 1);
          map[item.name].revenue += (item.price || 0) * (item.qty || 1);
        });
      });
      return map;
    };

    const currentItemMap = buildItemMap(currentOrders);
    const prevItemMap = buildItemMap(prevOrders);

    const topSellers = Object.entries(currentItemMap)
      .map(([name, { qty, revenue, category }]) => {
        const prevQty = prevItemMap[name]?.qty || 0;
        const growthPct = prevQty > 0
          ? parseFloat((((qty - prevQty) / prevQty) * 100).toFixed(1))
          : null;
        return { name, qty, revenue, category, growthPct };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    res.json({
      dailyRevenue,
      previousRevenue,
      revenueGrowthPct,
      theoreticalMargin: 28.4,
      inventoryValuation,
      parAlerts,
      totalOrdersToday,
      previousOrderCount,
      orderCountDelta,
      pendingOrdersToday,
      deliveredOrdersToday,
      dineInCount,
      avgWaitTimeSeconds,
      cancellationsToday,
      paymentUpiCardPct,
      paymentCashPct,
      takeawayCount,
      floorOccupancy,
      activeTables: activeSessions,
      totalTables,
      topSellers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Order Count endpoint
app.get('/api/admin/orders/count', async (req, res) => {
  try {
    const { filter, date } = req.query;
    let query = { status: { $in: ['paid', 'completed'] } };

    if (filter === 'custom' && date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    } else {
      const now = new Date();
      let start = new Date(now);

      if (filter === 'day') {
        start.setHours(0, 0, 0, 0);
      } else if (filter === 'week') {
        // Start of week (Sunday)
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
      } else if (filter === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      } else if (filter === 'year') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
      } else {
        // default to day if unrecognized filter but not custom
        start.setHours(0, 0, 0, 0);
      }

      if (filter) { // If no filter provided at all, maybe return all, but we default to day logic above
        query.createdAt = { $gte: start, $lte: now };
      }
    }

    const count = await Order.countDocuments(query);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Inventory
app.get('/api/admin/inventory', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add New Inventory Item
app.post('/api/admin/inventory/items', async (req, res) => {
  try {
    const { ingredient_name, stock_level, unit, par_level, vendor_name, cost_per_unit } = req.body;

    if (!ingredient_name || !unit) {
      return res.status(400).json({ error: 'ingredient_name and unit are required.' });
    }

    const existing = await Inventory.findOne({ ingredient_name });
    if (existing) {
      return res.status(409).json({ error: 'Item with this name already exists.' });
    }

    const item = new Inventory({
      ingredient_name,
      stock_level: parseFloat(stock_level) || 0,
      unit,
      par_level: parseFloat(par_level) || 10,
      vendor_name: vendor_name || 'Unknown Vendor',
      cost_per_unit: parseFloat(cost_per_unit) || 1.00
    });

    await item.save();
    res.status(201).json({ success: true, item, message: `Added ${item.ingredient_name} to inventory.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get PO History
app.get('/api/admin/po', async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto PO Dispatch
app.post('/api/admin/po/dispatch', async (req, res) => {
  try {
    const inventory = await Inventory.find();
    // Only order if stock + pending orders is still below par
    const lowItems = inventory.filter(item => (item.stock_level + item.on_order) <= item.par_level);

    if (lowItems.length === 0) {
      return res.json({ success: true, message: 'No items require restocking.' });
    }

    const byVendor = {};
    for (const item of lowItems) {
      if (!byVendor[item.vendor_name]) byVendor[item.vendor_name] = [];
      const orderQty = (item.par_level * 2) - (item.stock_level + item.on_order);
      byVendor[item.vendor_name].push({
        inventory_id: item._id,
        ingredient_name: item.ingredient_name,
        quantity: orderQty,
        cost_per_unit: item.cost_per_unit
      });
      item.on_order += orderQty;
      await item.save();
    }

    for (const [vendor_name, items] of Object.entries(byVendor)) {
      const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0);
      await PurchaseOrder.create({
        vendor_name,
        items,
        total_amount,
        status: 'pending'
      });
      // Auto-add vendor to catalog if not already present
      await Vendor.findOneAndUpdate(
        { name: vendor_name },
        { $setOnInsert: { name: vendor_name, vetted: false } },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, message: 'POs dispatched and pending orders updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual PO Dispatch
app.post('/api/admin/po/manual', async (req, res) => {
  try {
    const { vendor_name, items } = req.body;
    if (!vendor_name || !items || !items.length) {
      return res.status(400).json({ error: 'vendor_name and items required' });
    }

    let total_amount = 0;
    const poItems = [];

    for (const i of items) {
      const inventoryItem = await Inventory.findById(i.inventory_id);
      if (!inventoryItem) continue;

      const cost = inventoryItem.cost_per_unit;
      total_amount += i.quantity * cost;
      poItems.push({
        inventory_id: inventoryItem._id,
        ingredient_name: inventoryItem.ingredient_name,
        quantity: i.quantity,
        cost_per_unit: cost
      });

      inventoryItem.on_order += i.quantity;
      await inventoryItem.save();
    }

    const po = await PurchaseOrder.create({
      vendor_name,
      items: poItems,
      total_amount,
      status: 'pending'
    });

    // Auto-add vendor to catalog if not already present
    await Vendor.findOneAndUpdate(
      { name: vendor_name },
      { $setOnInsert: { name: vendor_name, vetted: false } },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Manual PO created successfully.', po });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Recipes BOM
app.get('/api/admin/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('menu_item_id').populate('ingredients.inventory_id');
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SALES & OPS API ROUTES ---

// Get completed orders for Order History panel
app.get('/api/sales/orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'paid' })
      .sort({ createdAt: -1 })
      .populate({ path: 'session_id', model: 'TableSession' })
      .populate({ path: 'items.menu_item_id', model: 'MenuItem' });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force close a table session
app.post('/api/sales/session/close', async (req, res) => {
  try {
    const { device_id } = req.body;
    const session = await TableSession.findOne({ device_id, status: { $in: ['active', 'standby'] } });
    if (!session) return res.status(404).json({ error: 'No active session for this table.' });
    session.status = 'completed';
    await session.save();

    // Sync booking status
    await Booking.updateMany({ table_id: device_id, status: { $in: ['active', 'ready'] } }, { status: 'completed' });

    // Notify the kiosk so it resets to the idle/screensaver screen
    io.to(`room_table_${device_id}`).emit('session_reset');
    // Notify host stand to refresh
    io.emit('refresh_tables');
    res.json({ success: true, message: `Session for table ${device_id} closed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all Menu Items (Catalog)
app.get('/api/admin/menu-items', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Image
app.post('/api/admin/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Create a new Menu Item
app.post('/api/admin/menu-items', async (req, res) => {
  try {
    const { name, price, category, is_veg, tags, image_url } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price are required.' });
    const item = new MenuItem({
      name,
      price: parseFloat(price),
      category: category || 'General',
      is_veg: !!is_veg,
      tags: tags || [],
      image_url
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a Menu Item
app.put('/api/admin/menu-items/:id', async (req, res) => {
  try {
    const { name, price, category, is_veg, tags, image_url } = req.body;
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price: parseFloat(price),
        category,
        is_veg: !!is_veg,
        tags: tags || [],
        image_url
      },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Menu Item
app.delete('/api/admin/menu-items/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    await Recipe.deleteOne({ menu_item_id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create / Update a Recipe for a menu item
app.post('/api/admin/recipes', async (req, res) => {
  try {
    const { menu_item_id, ingredients } = req.body;
    if (!menu_item_id || !ingredients || !ingredients.length) return res.status(400).json({ error: 'menu_item_id and ingredients required.' });
    const recipe = await Recipe.findOneAndUpdate(
      { menu_item_id },
      { menu_item_id, ingredients },
      { upsert: true, new: true }
    );
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Recipe
app.delete('/api/admin/recipes/:id', async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vendor CRUD
app.get('/api/admin/vendors', async (req, res) => {
  try {
    const inventory = await Inventory.find();

    // Auto-sync: ensure every vendor referenced in inventory exists in the catalog
    const inventoryVendorNames = [...new Set(inventory.map(i => i.vendor_name).filter(Boolean))];
    for (const vname of inventoryVendorNames) {
      await Vendor.findOneAndUpdate(
        { name: vname },
        { $setOnInsert: { name: vname, vetted: false } },
        { upsert: true, new: true }
      );
    }

    const vendors = await Vendor.find();
    const enrichedVendors = vendors.map(v => {
      const vendorName = v.name || v.vendor_name;
      const items = inventory.filter(i => i.vendor_name === vendorName).map(i => i.ingredient_name);
      return {
        _id: v._id,
        vendor_name: vendorName,
        contact_email: v.contact_email,
        phone: v.phone,
        edi_connected: v.edi_connected,
        vetted: v.vetted,
        items,
        itemCount: items.length
      };
    });
    res.json(enrichedVendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/vendors', async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.status(201).json(vendor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/vendors/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/vendors/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log Wastage — deducts from stock
app.post('/api/admin/inventory/wastage', async (req, res) => {
  try {
    const { inventory_id, quantity, reason } = req.body;
    if (!inventory_id || !quantity) return res.status(400).json({ error: 'inventory_id and quantity required.' });
    const item = await Inventory.findByIdAndUpdate(
      inventory_id,
      { $inc: { stock_level: -Math.abs(parseFloat(quantity)) } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Inventory item not found.' });
    res.json({ success: true, item, message: `Logged ${quantity} ${item.unit} wastage for ${item.ingredient_name}. Reason: ${reason || 'Not specified'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log Receiving — adds to stock
app.post('/api/admin/inventory/receive', async (req, res) => {
  try {
    const { inventory_id, quantity_received } = req.body;
    if (!inventory_id || !quantity_received) return res.status(400).json({ error: 'inventory_id and quantity_received required.' });

    const qty = Math.abs(parseFloat(quantity_received));
    const item = await Inventory.findById(inventory_id);
    if (!item) return res.status(404).json({ error: 'Inventory item not found.' });

    item.stock_level += qty;
    item.on_order = Math.max(0, item.on_order - qty);
    await item.save();

    res.json({ success: true, item, message: `Received ${qty} ${item.unit} of ${item.ingredient_name}. Stock updated.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark PO as dispatched (sent to vendor)
app.post('/api/admin/po/:id/dispatch', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po || po.status !== 'pending') return res.status(400).json({ error: 'Only pending POs can be dispatched.' });
    po.status = 'dispatched';
    po.dispatchedAt = new Date();
    await po.save();
    res.json({ success: true, message: 'Purchase order marked as dispatched.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Receive PO (stock update)
app.post('/api/admin/po/:id/receive', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po || !['pending', 'dispatched'].includes(po.status)) return res.status(400).json({ error: 'Invalid or already received PO.' });

    for (const i of po.items) {
      const item = await Inventory.findById(i.inventory_id);
      if (item) {
        item.stock_level += i.quantity;
        item.on_order = Math.max(0, item.on_order - i.quantity);
        await item.save();
      }
    }

    po.status = 'received';
    await po.save();

    res.json({ success: true, message: 'Purchase order received and stock updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finance Report
app.get('/api/admin/finance/report', async (req, res) => {
  try {
    const { filter, date } = req.query;
    let query = { status: { $in: ['paid', 'completed'] } };
    const now = new Date();
    let start = new Date(now);

    if (filter === 'custom' && date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    } else {
      if (filter === 'week') {
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
      } else if (filter === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      } else if (filter === 'year') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
      } else { // default to day
        start.setHours(0, 0, 0, 0);
      }
      query.createdAt = { $gte: start, $lte: now };
    }

    const paidOrders = await Order.find(query).sort({ createdAt: -1 });
    const grossRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const cogsEstimate = grossRevenue * 0.284;
    const netRevenue = grossRevenue - cogsEstimate;

    const taxes = await TaxConfig.find({ is_active: true });
    let totalTaxAmount = 0;
    const taxBreakdown = {};
    taxes.forEach(tax => {
      const amt = grossRevenue * tax.rate;
      totalTaxAmount += amt;
      taxBreakdown[tax.name] = amt;
    });

    // Fallback if no taxes configured
    if (taxes.length === 0) {
      totalTaxAmount = grossRevenue * 0.18;
      taxBreakdown['GST (Fallback 18%)'] = totalTaxAmount;
    }

    const netAfterTax = grossRevenue - totalTaxAmount;

    // Hourly breakdown
    const hourlyMap = {};
    let dbShifts = await Shift.find().sort({ startTime: 1 });
    if (!dbShifts || dbShifts.length === 0) {
      dbShifts = await Shift.insertMany([
        { name: 'Breakfast Shift', startTime: '06:00', endTime: '11:00' },
        { name: 'Lunch Service', startTime: '11:00', endTime: '16:00' },
        { name: 'Dinner Service', startTime: '16:00', endTime: '23:59' }
      ]);
    }

    const shifts = dbShifts.map(s => ({ _id: s._id, shift: s.name, hours: `${s.startTime} – ${s.endTime}`, revenue: 0, startTime: s.startTime, endTime: s.endTime }));

    paidOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const hour = d.getHours();
      const mins = d.getMinutes();
      const label = `${hour}:00`;
      hourlyMap[label] = (hourlyMap[label] || 0) + o.total_amount;

      const timeStr = `${hour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      for (const s of shifts) {
        if (timeStr >= s.startTime && timeStr <= s.endTime) {
          s.revenue += o.total_amount;
          break; // assign to first matching shift
        }
      }
    });

    const hourlyBreakdown = Object.entries(hourlyMap).map(([hour, revenue]) => ({ hour, revenue }));

    res.json({
      grossRevenue,
      cogsEstimate,
      netRevenue,
      totalTaxAmount,
      taxBreakdown,
      netAfterTax,
      orderCount: paidOrders.length,
      recentOrders: paidOrders.slice(0, 10),
      hourlyBreakdown,
      shifts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SHIFT MANAGEMENT ---
app.get('/api/admin/shifts', async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ startTime: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/shifts', async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;
    const shift = new Shift({ name, startTime, endTime });
    await shift.save();
    res.status(201).json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/shifts/:id', async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/shifts/:id', async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Staff list (no passwords)
app.get('/api/admin/staff', async (req, res) => {
  try {
    const staff = await User.find({}, { password_hash: 0 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/staff', async (req, res) => {
  try {
    const { username, role, password } = req.body;
    if (!username || !role || !password) return res.status(400).json({ error: 'Username, role, and password required.' });

    // check if user exists
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    // use bcrypt ideally, but here we'll just store whatever is passed or a simple hash if required by User model
    // Note: ensure your actual auth uses the correct hashing
    const user = new User({ username, role, password_hash: password });
    await user.save();

    // Log audit
    await new AuditLog({ action: 'CREATE_STAFF', user: 'System Admin', details: `Created staff user ${username} with role ${role}` }).save();

    res.status(201).json({ success: true, message: 'Staff added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/staff/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) {
      await new AuditLog({ action: 'DELETE_STAFF', user: 'System Admin', details: `Deleted staff user ${user.username}` }).save();
    }
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hardware API
app.get('/api/admin/hardware', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/hardware', async (req, res) => {
  try {
    const { name, type, mac, status } = req.body;
    const device = new Device({ name, type, mac, status: status || 'Offline' });
    await device.save();
    await new AuditLog({ action: 'PROVISION_HARDWARE', user: 'System Admin', details: `Provisioned ${type} with MAC ${mac}` }).save();
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/hardware/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (device) {
      await new AuditLog({ action: 'DEPROVISION_HARDWARE', user: 'System Admin', details: `Deprovisioned ${device.type} with MAC ${device.mac}` }).save();
    }
    res.json({ success: true, message: 'Device removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle device status (Online / Offline / Standby)
app.patch('/api/admin/hardware/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Online', 'Offline', 'Standby'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Online, Offline, or Standby.' });
    }
    const device = await Device.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!device) return res.status(404).json({ error: 'Device not found.' });
    await new AuditLog({
      action: 'DEVICE_STATUS_CHANGE',
      user: 'System Admin',
      details: `Device "${device.name}" status changed to ${status}`
    }).save();
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Audit Logs API
app.get('/api/admin/auditlogs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TABLE MANAGEMENT (Admin / Host) ---

// GET /api/tables — all active tables with live session status
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await Table.find({ is_active: true }).sort({ table_id: 1 });
    const activeSessions = await TableSession.find({ status: { $in: ['active', 'standby'] } });
    const activeMap = {};
    activeSessions.forEach(s => { activeMap[s.device_id] = s; });
    const result = tables.map(t => ({
      ...t.toObject(),
      sessionStatus: activeMap[t.table_id] ? (activeMap[t.table_id].status === 'active' ? 'occupied' : 'reserved') : 'available',
      guest_name: activeMap[t.table_id]?.guest_name || null,
      auth_code: activeMap[t.table_id]?.auth_code || null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tables — create a new table
app.post('/api/tables', async (req, res) => {
  try {
    const { table_id, label, zone, capacity } = req.body;
    if (!table_id || !label) return res.status(400).json({ error: 'table_id and label are required.' });
    const existing = await Table.findOne({ table_id });
    if (existing) return res.status(409).json({ error: `Table ${table_id} already exists.` });
    const table = new Table({ table_id, label, zone: zone || 'Main Hall', capacity: parseInt(capacity) || 4 });
    await table.save();
    res.status(201).json(table);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tables/:table_id — update a table capacity
app.put('/api/tables/:table_id', async (req, res) => {
  try {
    const { capacity } = req.body;
    const table = await Table.findOne({ table_id: req.params.table_id });
    if (!table) return res.status(404).json({ error: 'Table not found.' });
    if (capacity) table.capacity = parseInt(capacity);
    await table.save();
    res.json({ success: true, table });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tables/:table_id — soft-delete (deactivate) a table
app.delete('/api/tables/:table_id', async (req, res) => {
  try {
    const table = await Table.findOne({ table_id: req.params.table_id });
    if (!table) return res.status(404).json({ error: 'Table not found.' });
    const active = await TableSession.findOne({ device_id: req.params.table_id, status: 'active' });
    if (active) return res.status(409).json({ error: `Table ${req.params.table_id} has an active session. Close the session first.` });
    table.is_active = false;
    await table.save();
    res.json({ success: true, message: `Table ${req.params.table_id} deactivated.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- KIOSK DEVICE BINDING ---

// Admin PIN for device unbinding
const ADMIN_UNBIND_PIN = process.env.ADMIN_UNBIND_PIN || '1234';

// GET /api/kiosk/tables — returns all active tables with binding status for tablet discovery
app.get('/api/kiosk/tables', async (req, res) => {
  try {
    const tables = await Table.find({ is_active: true }).sort({ table_id: 1 });
    const activeSessions = await TableSession.find({ status: 'active' });
    const activeTableIds = activeSessions.map(s => s.device_id);
    const result = tables.map(t => ({
      id: t.table_id,
      label: t.label,
      zone: t.zone,
      capacity: t.capacity,
      status: activeTableIds.includes(t.table_id) ? 'occupied' : 'available',
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kiosk/bind — verifies a table is available and confirms binding
app.post('/api/kiosk/bind', async (req, res) => {
  const { table_id } = req.body;
  try {
    const table = await Table.findOne({ table_id, is_active: true });
    if (!table) return res.status(400).json({ error: 'Invalid or inactive table ID.' });
    const existing = await TableSession.findOne({ device_id: table_id, status: 'active' });
    if (existing) return res.status(409).json({ error: `Table ${table_id} already has an active session.` });
    res.json({ success: true, table_id, label: table.label, message: `Table ${table_id} is available. Binding confirmed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kiosk/verify-pin — validates the admin unbind PIN
app.post('/api/kiosk/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_UNBIND_PIN) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Incorrect PIN. Access denied.' });
  }
});

// --- KDS & CUSTOMER ENDPOINTS ---

app.post('/api/kiosk/order', async (req, res) => {
  try {
    const { table_id, items, total, taxes, station, course, payment_method } = req.body;
    const session = await TableSession.findOne({ device_id: table_id, status: 'active' });

    const order = new Order({
      session_id: session ? session._id : null,
      device_id: table_id,
      total_amount: total,
      taxes: taxes || [],
      payment_method: payment_method || 'cash',
      items: items,
      station: station || 'Grill',
      course: course || 'main',
      status: 'preparing',
      order_type: session ? session.order_type : 'dine_in'
    });

    await order.save();

    // Broadcast to kitchen
    io.to('kds').emit('new_kot', {
      id: order._id,
      table_id: table_id,
      items: items,
      station: station || 'Grill',
      course: course || 'main',
      time: order.createdAt,
      order_type: order.order_type
    });

    res.status(201).json({ success: true, order_id: order._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/kitchen/active-orders', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'preparing' }).sort({ createdAt: 1 });
    res.json(orders.map(o => ({
      id: o._id,
      table_id: o.device_id,
      items: o.items,
      station: o.station,
      course: o.course,
      time: o.createdAt,
      order_type: o.order_type
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kitchen/bump', async (req, res) => {
  try {
    const { order_id } = req.body;
    const order = await Order.findByIdAndUpdate(order_id, { status: 'completed' }, { new: true });

    // Notify the specific table that their food is ready
    if (order && order.device_id) {
      io.to(`room_table_${order.device_id}`).emit('order_ready', { order_id: order._id });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/kitchen/history', async (req, res) => {
  try {
    const { date } = req.query;
    let filter = { status: { $in: ['completed', 'paid'] } };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.updatedAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const orders = await Order.find(filter).sort({ updatedAt: -1 }).limit(100);
    res.json(orders.map(o => ({
      id: o._id,
      table_id: o.device_id,
      items: o.items,
      station: o.station,
      course: o.course,
      time: o.createdAt,
      completedAt: o.updatedAt,
      status: o.status,
      order_type: o.order_type
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ last_visit: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PACKAGES ---
app.get('/api/admin/packages', async (req, res) => {
  try {
    const packages = await Package.find().populate('menu_items');
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/packages', async (req, res) => {
  try {
    const pkg = new Package(req.body);
    await pkg.save();
    res.status(201).json(pkg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/packages/:id', async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(pkg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/packages/:id', async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOOKINGS ---
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('package_id').sort({ booking_time: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { table_id, booking_time, email, guest_name } = req.body;
    // Conflict check logic (basic: no bookings for the same table within 2 hours)
    const newTime = new Date(booking_time);
    const twoHoursBefore = new Date(newTime.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(newTime.getTime() + 2 * 60 * 60 * 1000);

    const conflict = await Booking.findOne({
      table_id,
      status: { $in: ['pending', 'active'] },
      booking_time: { $gt: twoHoursBefore, $lt: twoHoursAfter }
    });

    if (conflict) {
      return res.status(409).json({ error: `Table ${table_id} is already booked around that time.` });
    }

    const auth_code = generatePin();
    const booking = new Booking({ ...req.body, auth_code });
    await booking.save();

    // Instantly track customer in CRM
    if (booking.mobile && booking.guest_name) {
      let customer = await Customer.findOne({ mobile: booking.mobile });
      if (customer) {
        customer.guest_name = booking.guest_name;
        customer.last_visit = new Date();
        await customer.save();
      } else {
        customer = new Customer({ guest_name: booking.guest_name, mobile: booking.mobile, total_visits: 0 });
        await customer.save();
      }
    }

    if (email) {
      await sendConfirmationEmail(email, guest_name, auth_code);
    }

    // If the booking is for now or within the next minute, activate it immediately
    if (new Date(booking.booking_time).getTime() <= Date.now() + 60000) {
      setTimeout(() => activateBooking(booking).catch(console.error), 0);
    }

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function activateBooking(b) {
  let session = await TableSession.findOne({ device_id: b.table_id, status: { $in: ['active', 'standby'] } });
  if (!session) {
    session = new TableSession({ 
      device_id: b.table_id, 
      guest_name: b.guest_name, 
      mobile: b.mobile, 
      email: b.email, 
      auth_code: b.auth_code, 
      package: b.package_id,
      party_size: b.party_size || 1,
      status: 'standby' 
    });
    await session.save();
  }

  // Track customer if mobile provided
  if (b.mobile && b.guest_name) {
    let customer = await Customer.findOne({ mobile: b.mobile });
    if (customer) {
      customer.total_visits += 1;
      customer.last_visit = new Date();
      customer.guest_name = b.guest_name;
      await customer.save();
    } else {
      customer = new Customer({ guest_name: b.guest_name, mobile: b.mobile });
      await customer.save();
    }
  }

  b.status = 'ready';
  await b.save();

  // Emit socket event to wake kiosk
  let packageData = null;
  if (b.package_id) {
    // If it's already an object (from populate), use its _id
    const pkgId = b.package_id._id || b.package_id;
    packageData = await Package.findById(pkgId).populate('menu_items');
  }

  io.to(`room_table_${b.table_id}`).emit('session_started', {
    session_id: session._id,
    guest_name: b.guest_name,
    mobile: b.mobile,
    email: b.email,
    package: packageData,
    party_size: session.party_size
  });

  // Refresh Host Stand
  io.emit('refresh_tables');
  console.log(`Auto-started booking session for table ${b.table_id}`);
}

// Background Worker: Automatically activate bookings when their time arrives
setInterval(async () => {
  try {
    const now = new Date();
    const pendingBookings = await Booking.find({ status: 'pending', booking_time: { $lte: now } }).populate('package_id');

    for (const b of pendingBookings) {
      await activateBooking(b);
    }
  } catch (err) {
    console.error('Booking worker error:', err);
  }
}, 60000); // Check every minute

// --- SOCKET.IO ---

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Device Provisioning (Customers or Staff)
  socket.on('register_device', async ({ device_id, role }) => {
    if (role === 'Kitchen') {
      socket.join('kds');
      console.log(`Socket ${socket.id} joined KDS room`);
    } else if (device_id) {
      socket.join(`room_table_${device_id}`);
      console.log(`Socket ${socket.id} joined room_table_${device_id}`);

      if (role === 'Customer') {
        try {
          const session = await TableSession.findOne({ device_id, status: { $in: ['active', 'standby'] } }).populate('package');
          if (session) {
            let pkgData = null;
            if (session.package) {
               pkgData = await Package.findById(session.package._id).populate('menu_items');
            }
            socket.emit('session_started', {
              session_id: session._id,
              guest_name: session.guest_name,
              mobile: session.mobile,
              package: pkgData,
              party_size: session.party_size,
              is_reconnect: true
            });
          }
        } catch (err) {
          console.error('Error syncing session state:', err);
        }
      }
    }
  });

  // Host starts a session for a table
  socket.on('start_session', async ({ device_id, guest_name, email, mobile, package_id, party_size, is_takeaway }) => {
    try {
      const auth_code = generatePin();
      const order_type = is_takeaway ? 'takeaway' : 'dine_in';
      let session = await TableSession.findOne({ device_id, status: 'active' });
      if (!session) {
        session = new TableSession({ device_id, guest_name, email, mobile, auth_code, status: 'active', package: package_id, party_size: party_size || 1, order_type });
        await session.save();
      } else {
        session.guest_name = guest_name;
        session.email = email;
        session.mobile = mobile;
        session.auth_code = auth_code;
        session.package = package_id;
        session.party_size = party_size || 1;
        session.order_type = order_type;
        await session.save();
      }

      // Track customer if mobile provided
      if (mobile && guest_name) {
        let customer = await Customer.findOne({ mobile });
        if (customer) {
          customer.total_visits += 1;
          customer.last_visit = new Date();
          customer.guest_name = guest_name; // update name just in case
          await customer.save();
        } else {
          customer = new Customer({ guest_name, mobile });
          await customer.save();
        }
      }

      let packageData = null;
      if (package_id) {
        packageData = await Package.findById(package_id).populate('menu_items');
      }

      if (email) {
        await sendConfirmationEmail(email, guest_name, auth_code);
      }

      // Wake up the customer kiosk
      io.to(`room_table_${device_id}`).emit('session_started', {
        session_id: session._id,
        guest_name,
        mobile,
        email,
        package: packageData,
        party_size: session.party_size
      });
      console.log(`Session started for device ${device_id}`);
      io.emit('refresh_tables');
    } catch (err) {
      console.error('Error starting session:', err);
    }
  });

  // Customer taps Kiosk to start session
  socket.on('customer_started_session', async ({ device_id }) => {
    try {
      let session = await TableSession.findOne({ device_id, status: 'standby' });
      if (session) {
        session.status = 'active';
        await session.save();
      }
      let booking = await Booking.findOne({ table_id: device_id, status: 'ready' });
      if (booking) {
        booking.status = 'active';
        await booking.save();
      }
      io.emit('refresh_tables');
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('request_service', ({ message }) => {
    console.log(`Service requested by ${socket.id}: ${message}`);
    // Broadcast to host/staff
    io.emit('service_alert', { message, timestamp: new Date() });
  });

  socket.on('admin_override_reset', ({ device_id }) => {
    console.log(`Admin override reset for table ${device_id}`);
    io.to(`room_table_${device_id}`).emit('session_reset');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
// --- KIOSK API ROUTES ---
app.post('/api/kiosk/verify-guest-pin', async (req, res) => {
  try {
    const { device_id, pin } = req.body;
    const session = await TableSession.findOne({ device_id, status: { $in: ['standby', 'active'] } });
    if (!session) return res.status(404).json({ error: 'No active session found.' });
    if (session.auth_code !== pin) return res.status(401).json({ error: 'Invalid PIN.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kiosk/send-receipt', async (req, res) => {
  try {
    const { device_id, items, total, taxBreakdown } = req.body;
    const session = await TableSession.findOne({ device_id, status: { $in: ['active', 'standby', 'completed'] } }).populate('package').sort({ createdAt: -1 });
    if (!session || !session.email) {
      return res.status(400).json({ error: 'No email associated with this session.' });
    }

    const packageFee = session.package ? (session.package.pricing_type === 'per_person' ? (session.package.price || 0) * (session.party_size || 1) : (session.package.price || 0)) : 0;
    
    let itemsHtml = '';
    if (session.package && packageFee > 0) {
      const qtyStr = session.package.pricing_type === 'per_person' ? `${session.party_size || 1}x` : '1x';
      itemsHtml += `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; color: #555;">${qtyStr} <strong>${session.package.name} Package</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; text-align: right; font-weight: bold; color: #333;">&#8377;${packageFee.toFixed(2)}</td>
      </tr>`;
    }
    
    itemsHtml += items.map(i => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; color: #555;">${i.qty}x <strong>${i.name}</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; text-align: right; font-weight: bold; color: #333;">&#8377;${(i.price * i.qty).toFixed(2)}</td>
      </tr>
    `).join('');

    const taxHtml = (taxBreakdown || []).map(t => `
      <tr>
        <td style="padding: 4px 0; color: #777; font-size: 12px;">${t.label}</td>
        <td style="padding: 4px 0; text-align: right; color: #777; font-size: 12px;">&#8377;${t.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; background: #faf9f6; padding: 30px; border-radius: 12px; border: 1px solid #eaeaea;">
        <h2 style="text-align: center; color: #333; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px;">Pragati RMS</h2>
        <p style="text-align: center; color: #777; font-size: 10px; letter-spacing: 2px; margin-top: 0;">RECEIPT</p>
        <p style="text-align: center; color: #555; margin-top: 20px;">Thank you for dining with us, <strong>${session.guest_name || 'Guest'}</strong>!</p>
        
        <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
          ${itemsHtml}
        </table>
        
        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-weight: bold; color: #555;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #555;">&#8377;${(total - (taxBreakdown || []).reduce((s, t) => s + t.amount, 0)).toFixed(2)}</td>
          </tr>
          ${taxHtml}
        </table>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #333; display: flex; justify-content: space-between;">
          <strong style="font-size: 18px; color: #111;">TOTAL</strong>
          <strong style="font-size: 18px; color: #111; float: right;">&#8377;${total.toFixed(2)}</strong>
        </div>

        <p style="text-align: center; color: #888; font-size: 12px; margin-top: 40px;">We hope to see you again soon!</p>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer re_HSDjYy61_2GZdgEwXzD1vamAPu5XoEXAV`
      },
      body: JSON.stringify({
        from: 'Pragati RMS <onboarding@resend.dev>',
        to: session.email,
        subject: `Your Receipt from Pragati RMS (Table ${device_id})`,
        html
      })
    });

    if (resendRes.ok) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send email.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /api/kiosk/feedback
app.post('/api/kiosk/feedback', async (req, res) => {
  try {
    const fb = new Feedback(req.body);
    await fb.save();
    res.status(201).json(fb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/feedback
app.get('/api/admin/feedback', async (req, res) => {
  try {
    const fbs = await Feedback.find().sort({ createdAt: -1 });
    res.json(fbs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
