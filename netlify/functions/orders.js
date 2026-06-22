import { getStore } from '@netlify/blobs';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });

const getOrdersStore = () => getStore('kedai-coffee-orders');

const readOrders = async () => {
  const store = getOrdersStore();
  const orders = await store.get('orders', { type: 'json' });
  return Array.isArray(orders) ? orders : [];
};

const writeOrders = async (orders) => {
  const store = getOrdersStore();
  await store.setJSON('orders', orders);
};

const normalizeOrder = (orderData = {}) => {
  const timestamp = Date.now();
  const items = Array.isArray(orderData.items) ? orderData.items : [];

  return {
    id: orderData.id || `KN-ORD-${timestamp}-${Math.floor(Math.random() * 1000)}`,
    shortId: orderData.shortId || `KN-${String(timestamp).slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
    meja: orderData.meja || '-',
    nama: orderData.nama || 'Pelanggan Anonim',
    items: items.map((item) => ({
      ...item,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    })),
    total: items.reduce(
      (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
      0,
    ),
    status: orderData.status || 'Masuk',
    tanggal: orderData.tanggal || new Date().toISOString(),
    pembayaran: orderData.pembayaran || 'Pending',
  };
};

export default async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true });

  try {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const orders = await readOrders();
      return json(orders);
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const orders = await readOrders();
      const newOrder = normalizeOrder(body);
      await writeOrders([newOrder, ...orders]);
      return json(newOrder, 201);
    }

    if (request.method === 'PATCH') {
      const id = url.searchParams.get('id');
      if (!id) return json({ message: 'ID pesanan wajib dikirim.' }, 400);

      const body = await request.json().catch(() => ({}));
      const orders = await readOrders();
      const index = orders.findIndex((order) => order.id === id);

      if (index === -1) return json({ message: 'Pesanan tidak ditemukan.' }, 404);

      orders[index] = {
        ...orders[index],
        status: body.status || orders[index].status,
        pembayaran: body.pembayaran || orders[index].pembayaran,
      };

      await writeOrders(orders);
      return json(orders[index]);
    }

    return json({ message: 'Method tidak didukung.' }, 405);
  } catch (error) {
    return json({ message: 'Server error', detail: error.message }, 500);
  }
};
