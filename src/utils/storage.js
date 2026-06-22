import { menuData } from '../data/menuData';

// Helper untuk fallback offline/local saja. Data utama tetap disimpan di MySQL lewat API server.js.
const parsePriceToNumber = (priceStr) => {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  return parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10) || 0;
};

export const initDB = () => {
  if (!localStorage.getItem('kn_menu')) {
    const initializedMenu = menuData.map((item, index) => ({
      ...item,
      price: parsePriceToNumber(item.price),
      available: true,
      recommended: index < 3,
    }));
    localStorage.setItem('kn_menu', JSON.stringify(initializedMenu));
  }

  if (!localStorage.getItem('kn_orders')) {
    localStorage.setItem('kn_orders', JSON.stringify([]));
  }

  if (!localStorage.getItem('kn_expenses')) {
    localStorage.setItem('kn_expenses', JSON.stringify([]));
  }
};

const normalizeMenu = (menu = []) => menu.map((item, index) => ({
  ...item,
  id: Number(item.id),
  price: Number(item.price) || 0,
  available: item.available !== undefined ? Boolean(item.available) : true,
  recommended: item.recommended !== undefined ? Boolean(item.recommended) : index < 3,
}));

const normalizeOrders = (orders = []) => orders.map((order) => ({
  ...order,
  total: Number(order.total) || 0,
  items: Array.isArray(order.items)
    ? order.items.map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
      }))
    : [],
}));

const normalizeExpenses = (expenses = []) => expenses.map((expense) => ({
  ...expense,
  jumlah: Number(expense.jumlah) || 0,
}));

export const getMenu = () => {
  initDB();
  try {
    return normalizeMenu(JSON.parse(localStorage.getItem('kn_menu')) || []);
  } catch (e) {
    console.error('Error parsing kn_menu from localStorage', e);
    return [];
  }
};

export const saveMenu = (menu) => {
  localStorage.setItem('kn_menu', JSON.stringify(normalizeMenu(menu)));
};

export const getOrders = () => {
  initDB();
  try {
    return normalizeOrders(JSON.parse(localStorage.getItem('kn_orders')) || []);
  } catch (e) {
    console.error('Error parsing kn_orders from localStorage', e);
    return [];
  }
};

export const saveOrders = (orders) => {
  localStorage.setItem('kn_orders', JSON.stringify(normalizeOrders(orders)));
};

export const getExpenses = () => {
  initDB();
  try {
    return normalizeExpenses(JSON.parse(localStorage.getItem('kn_expenses')) || []);
  } catch (e) {
    console.error('Error parsing kn_expenses from localStorage', e);
    return [];
  }
};

export const saveExpenses = (expenses) => {
  localStorage.setItem('kn_expenses', JSON.stringify(normalizeExpenses(expenses)));
};

// --- API MYSQL/phpMyAdmin ---
const getApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const { protocol, hostname, port } = window.location;

  // Saat frontend dijalankan dengan Vite di port 5173, API tetap di server.js port 3001.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (port && port !== '3001') return `${protocol}//${hostname}:3001`;
  }

  return window.location.origin;
};

const requestJSON = async (path, options = {}) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `API error ${response.status}`);
  }

  return data;
};

// --- MENU MYSQL CRUD ---
export const getMenuSync = async () => {
  try {
    const remoteMenu = await requestJSON('/api/menu');
    if (Array.isArray(remoteMenu)) {
      saveMenu(remoteMenu);
      return normalizeMenu(remoteMenu);
    }
  } catch (error) {
    console.warn('Gagal mengambil menu dari MySQL, memakai cache lokal:', error.message);
  }

  return getMenu();
};

export const addMenuItem = async (item) => {
  try {
    const remoteItem = await requestJSON('/api/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    const menu = getMenu();
    saveMenu([...menu, remoteItem]);
    return remoteItem;
  } catch (error) {
    console.warn('Gagal menambah menu ke MySQL, memakai cache lokal:', error.message);
    const menu = getMenu();
    const newId = menu.length > 0 ? Math.max(...menu.map(m => Number(m.id) || 0)) + 1 : 1;
    const newItem = {
      ...item,
      id: newId,
      price: Number(item.price) || 0,
      available: item.available !== undefined ? item.available : true,
      recommended: item.recommended !== undefined ? item.recommended : false,
    };
    saveMenu([...menu, newItem]);
    return newItem;
  }
};

export const updateMenuItem = async (id, updatedFields) => {
  try {
    const remoteItem = await requestJSON(`/api/menu/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updatedFields),
    });
    const menu = getMenu();
    const index = menu.findIndex(m => Number(m.id) === Number(id));
    if (index !== -1) {
      menu[index] = remoteItem;
      saveMenu(menu);
    }
    return remoteItem;
  } catch (error) {
    console.warn('Gagal mengubah menu di MySQL, memakai cache lokal:', error.message);
    const menu = getMenu();
    const index = menu.findIndex(m => Number(m.id) === Number(id));
    if (index !== -1) {
      menu[index] = {
        ...menu[index],
        ...updatedFields,
        price: updatedFields.price !== undefined ? Number(updatedFields.price) : menu[index].price,
      };
      saveMenu(menu);
      return menu[index];
    }
    return null;
  }
};

export const deleteMenuItem = async (id) => {
  try {
    await requestJSON(`/api/menu/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    console.warn('Gagal menghapus menu di MySQL, cache lokal tetap dibersihkan:', error.message);
  }

  const menu = getMenu().filter(m => Number(m.id) !== Number(id));
  saveMenu(menu);
  return true;
};

// --- ORDERS MYSQL CRUD ---
const createOrderLocal = (orderData) => {
  const orders = getOrders();
  const timestamp = Date.now();
  const shortId = `KN-${String(timestamp).slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
  const newOrder = {
    id: `KN-ORD-${timestamp}`,
    shortId,
    meja: orderData.meja,
    nama: orderData.nama || 'Pelanggan Anonim',
    items: orderData.items.map(item => ({
      ...item,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
    })),
    total: orderData.items.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0),
    status: 'Masuk',
    tanggal: new Date().toISOString(),
    pembayaran: 'Pending',
  };
  saveOrders([newOrder, ...orders]);
  return newOrder;
};

const updateOrderStatusLocal = (orderId, status, pembayaran) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index] = {
      ...orders[index],
      status: status || orders[index].status,
      pembayaran: pembayaran || orders[index].pembayaran,
    };
    saveOrders(orders);
    return orders[index];
  }
  return null;
};

export const getOrdersSync = async () => {
  try {
    const remoteOrders = await requestJSON('/api/orders');
    if (Array.isArray(remoteOrders)) {
      saveOrders(remoteOrders);
      return normalizeOrders(remoteOrders);
    }
  } catch (error) {
    console.warn('Gagal mengambil pesanan dari MySQL, memakai cache lokal:', error.message);
  }

  return getOrders();
};

export const createOrderSync = async (orderData) => {
  try {
    const remoteOrder = await requestJSON('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    const orders = getOrders();
    if (!orders.some((order) => order.id === remoteOrder.id)) {
      saveOrders([remoteOrder, ...orders]);
    }
    return remoteOrder;
  } catch (error) {
    console.warn('Gagal menyimpan pesanan ke MySQL, memakai cache lokal:', error.message);
    return createOrderLocal(orderData);
  }
};

export const updateOrderStatusSync = async (orderId, status, pembayaran) => {
  try {
    const updatedOrder = await requestJSON(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, pembayaran }),
    });

    const orders = getOrders();
    const index = orders.findIndex((order) => order.id === orderId);
    if (index !== -1) {
      orders[index] = updatedOrder;
      saveOrders(orders);
    }
    return updatedOrder;
  } catch (error) {
    console.warn('Gagal update pesanan di MySQL, memakai cache lokal:', error.message);
    return updateOrderStatusLocal(orderId, status, pembayaran);
  }
};

// --- EXPENSES MYSQL CRUD ---
export const getExpensesSync = async () => {
  try {
    const remoteExpenses = await requestJSON('/api/expenses');
    if (Array.isArray(remoteExpenses)) {
      saveExpenses(remoteExpenses);
      return normalizeExpenses(remoteExpenses);
    }
  } catch (error) {
    console.warn('Gagal mengambil pengeluaran dari MySQL, memakai cache lokal:', error.message);
  }

  return getExpenses();
};

export const addExpense = async (expenseData) => {
  try {
    const remoteExpense = await requestJSON('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    saveExpenses([remoteExpense, ...getExpenses()]);
    return remoteExpense;
  } catch (error) {
    console.warn('Gagal menambah pengeluaran ke MySQL, memakai cache lokal:', error.message);
    const expenses = getExpenses();
    const newExpense = {
      id: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tanggal: expenseData.tanggal || new Date().toISOString().split('T')[0],
      kategori: expenseData.kategori || 'Lainnya',
      deskripsi: expenseData.deskripsi || 'Pengeluaran Tanpa Keterangan',
      jumlah: Number(expenseData.jumlah) || 0,
    };
    saveExpenses([newExpense, ...expenses]);
    return newExpense;
  }
};

export const deleteExpense = async (id) => {
  try {
    await requestJSON(`/api/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    console.warn('Gagal menghapus pengeluaran di MySQL, cache lokal tetap dibersihkan:', error.message);
  }

  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
  return true;
};
