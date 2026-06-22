import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaShoppingCart, FaUser, FaTrash, 
  FaClock, FaChevronLeft, FaUtensils, FaCheckCircle, 
  FaSpinner, FaCoffee, FaExclamationCircle, FaReceipt,
  FaHome, FaArrowRight, FaStar
} from 'react-icons/fa';
import { getMenuSync, getOrdersSync, createOrderSync } from '../utils/storage';

const categories = ['Semua', 'Kopi Panas', 'Kopi Dingin', 'Non-Kopi', 'Makanan'];

function CustomerOrder() {
  const [tableNum, setTableNum] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab state for customer portal: 'home' | 'menu' | 'track'
  const [customerTab, setCustomerTab] = useState('home');

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  
  // Customization modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [customization, setCustomization] = useState({
    manis: 'Normal',
    suhu: 'Dingin',
    ukuran: 'Regular',
    catatan: ''
  });

  // Active tracking order ID
  const [activeOrderId, setActiveOrderId] = useState(() => {
    return localStorage.getItem('kn_active_order_id') || null;
  });
  const [activeOrder, setActiveOrder] = useState(null);
  const [trackCode, setTrackCode] = useState(() => localStorage.getItem('kn_last_order_code') || '');

  const saveActiveOrderToDevice = (order) => {
    if (!order?.id) return;

    localStorage.setItem('kn_active_order_id', order.id);
    if (order.shortId) localStorage.setItem('kn_last_order_code', order.shortId);

    const listKey = `kn_table_${order.meja}_order_ids`;
    const savedIds = JSON.parse(localStorage.getItem(listKey) || '[]');
    const nextIds = [order.id, ...savedIds.filter((id) => id !== order.id)].slice(0, 10);
    localStorage.setItem(listKey, JSON.stringify(nextIds));
  };

  // Parse table number from URL hash (#meja=X)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/meja=(\d+)/);
      if (match) {
        setTableNum(parseInt(match[1], 10));
      } else {
        setTableNum(null);
      }
    };
    
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch menu on mount & verify if admin changed it
  useEffect(() => {
    const loadMenu = async () => {
      setMenuItems(await getMenuSync());
    };

    loadMenu();

    // Poll menu dari database agar perubahan admin terbaca di HP pelanggan.
    const interval = setInterval(loadMenu, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll active order status dari database bersama.
  // Jika ID pesanan di localStorage hilang, sistem akan mencari pesanan aktif terakhir berdasarkan meja.
  useEffect(() => {
    if (!tableNum) return;

    const checkOrderStatus = async () => {
      const orders = await getOrdersSync();
      const tableOrderIds = JSON.parse(localStorage.getItem(`kn_table_${tableNum}_order_ids`) || '[]');
      const currentCode = (trackCode || localStorage.getItem('kn_last_order_code') || '').trim().toLowerCase();

      let match = null;

      if (activeOrderId) {
        match = orders.find(o => o.id === activeOrderId);
      }

      if (!match && currentCode) {
        match = orders.find(o =>
          String(o.shortId || '').toLowerCase() === currentCode ||
          String(o.id || '').toLowerCase() === currentCode
        );
      }

      if (!match && tableOrderIds.length > 0) {
        match = orders.find(o => tableOrderIds.includes(o.id));
      }

      if (!match) {
        match = orders
          .filter(o => String(o.meja) === String(tableNum) && o.status !== 'Dibatalkan')
          .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0];
      }

      if (match) {
        setActiveOrder(match);
        setActiveOrderId(match.id);
        saveActiveOrderToDevice(match);
        if (match.shortId) setTrackCode(match.shortId);
      } else {
        setActiveOrder(null);
      }
    };

    checkOrderStatus();
    const orderInterval = setInterval(checkOrderStatus, 2000);

    const handleStorageChange = (e) => {
      if (e.key === 'kn_orders' || e.key === 'kn_active_order_id') checkOrderStatus();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(orderInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeOrderId, tableNum, trackCode]);

  // Filter and search menu
  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Menu rekomendasi yang dipilih langsung dari Panel Admin
  const recommendations = useMemo(() => {
    return menuItems.filter(item => item.available !== false && item.recommended === true);
  }, [menuItems]);

  // Handle open item customization modal
  const handleOpenCustomize = (item) => {
    if (!item.available) return;
    
    let defaultSuhu = 'Panas';
    if (item.category === 'Kopi Dingin' || item.name.toLowerCase().includes('es') || item.name.toLowerCase().includes('iced') || item.category === 'Non-Kopi') {
      defaultSuhu = 'Dingin';
    }

    setSelectedItem(item);
    setCustomization({
      manis: (item.category.includes('Kopi') || item.category === 'Non-Kopi') ? 'Normal' : 'Tidak Berlaku',
      suhu: defaultSuhu,
      ukuran: 'Regular',
      catatan: ''
    });
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedItem) return;

    let finalPrice = selectedItem.price;
    if (customization.ukuran === 'Large') {
      finalPrice += 5000;
    }

    const cartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      menuId: selectedItem.id,
      name: selectedItem.name,
      icon: selectedItem.icon,
      basePrice: selectedItem.price,
      price: finalPrice,
      quantity: 1,
      customization: { ...customization }
    };

    const duplicateIndex = cart.findIndex(c => 
      c.menuId === cartItem.menuId && 
      c.customization.manis === cartItem.customization.manis &&
      c.customization.suhu === cartItem.customization.suhu &&
      c.customization.ukuran === cartItem.customization.ukuran &&
      c.customization.catatan === cartItem.customization.catatan
    );

    if (duplicateIndex !== -1) {
      const newCart = [...cart];
      newCart[duplicateIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, cartItem]);
    }

    setSelectedItem(null);
  };

  // Update cart item quantity
  const updateQuantity = (id, delta) => {
    const newCart = cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(newCart);
  };

  // Remove cart item
  const removeCartItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // Submit checkout order
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Silakan masukkan nama Anda untuk memesan.');
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang belanja Anda kosong.');
      return;
    }

    const orderData = {
      meja: tableNum,
      nama: customerName,
      items: cart.map(c => ({
        id: c.menuId,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        customization: c.customization
      }))
    };

    const newOrder = await createOrderSync(orderData);
    setActiveOrderId(newOrder.id);
    setActiveOrder(newOrder);
    setTrackCode(newOrder.shortId || '');
    saveActiveOrderToDevice(newOrder);
    
    // Clear cart and transition to tracking tab
    setCart([]);
    setIsCartOpen(false);
    setCustomerTab('track');
  };

  const formatRupiah = (num) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleOrderFinished = () => {
    setActiveOrderId(null);
    setActiveOrder(null);
    localStorage.removeItem('kn_active_order_id');
    localStorage.removeItem('kn_last_order_code');
    setTrackCode('');
    setCustomerName('');
    setCustomerTab('home');
  };

  // --- RENDERING ERROR: TABLE NUMBER NOT SPECIFIED ---
  if (!tableNum) {
    return (
      <div className="min-h-[100svh] bg-coffee-soft flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full bg-white border-2 border-coffee-dark p-5 rounded-none shadow-neo text-center sm:p-8">
          <FaExclamationCircle className="text-5xl text-coffee-amber mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-coffee-dark mb-3">QR Code Tidak Valid</h2>
          <p className="text-coffee-brown text-sm leading-relaxed mb-6">
            Aplikasi pemesanan menu digital Kopi Nusantara ini hanya dapat diakses dengan memindai QR Code di meja Anda.
          </p>
          <a
            href="#qr-simulator"
            className="inline-flex items-center gap-2 py-3 px-6 bg-coffee-dark text-white rounded-none font-bold text-sm hover:bg-coffee-amber transition shadow"
          >
            <FaCoffee /> Pergi ke Simulator QR Meja
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-coffee-soft px-3 pb-28 pt-24 sm:px-6 sm:pb-24">
      <div className="mx-auto w-full max-w-2xl">
        
        {/* HEADER BRANDING MEJA */}
        <div className="mb-5 flex items-center justify-between gap-3 rounded-none bg-coffee-dark p-4 text-white shadow-neo sm:mb-6 sm:p-5">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-coffee-amber uppercase">PORTAL QR</span>
            <h1 className="font-heading text-lg font-extrabold sm:text-2xl">Kopi Nusantara</h1>
          </div>
          <div className="shrink-0 rounded-none bg-coffee-amber px-3 py-2 text-center shadow-neo-sm sm:px-4">
            <span className="block text-[10px] font-bold text-white/85">NOMOR</span>
            <span className="font-heading text-sm font-extrabold sm:text-lg">MEJA {tableNum}</span>
          </div>
        </div>

        {/* --- PORTAL ACCESS 1: TAB HOME (DASHBOARD MEJA PELANGGAN) --- */}
        {customerTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Welcoming Card */}
            <div className="relative overflow-hidden rounded-none bg-gradient-to-r from-coffee-brown to-coffee-dark p-5 text-white shadow-neo-sm sm:p-6">
              <div className="absolute bottom-0 right-0 translate-x-6 translate-y-6 transform text-7xl opacity-10 sm:text-9xl">☕</div>
              <h2 className="mb-2 font-heading text-xl font-bold sm:text-2xl">Halo! Selamat Datang</h2>
              <p className="text-xs text-white/80 leading-relaxed max-w-md">
                Silakan lakukan pemesanan menu secara mandiri dari Meja {tableNum} ini. Hidangan akan langsung diantarkan dari dapur ke tempat duduk Anda.
              </p>
            </div>

            {/* Active Order Card Alert */}
            {activeOrder && (
              <div className="flex flex-col items-stretch justify-between gap-3 rounded-none border-2 border-coffee-dark bg-amber-50 p-4 shadow-neo-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-none uppercase mb-1.5">
                    <FaClock className="animate-pulse" /> Pesanan Aktif
                  </span>
                  <h4 className="font-heading font-extrabold text-sm text-coffee-dark truncate">ID: {activeOrder.shortId} ({activeOrder.nama})</h4>
                  <p className="text-xs text-coffee-brown/80 mt-0.5">
                    Status: <strong className="text-coffee-amber">{activeOrder.status}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setCustomerTab('track')}
                  className="w-full shrink-0 rounded-none bg-coffee-dark px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-coffee-amber sm:w-auto"
                >
                  Lacak Detail
                </button>
              </div>
            )}

            {/* Quick Portal Action Buttons */}
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                onClick={() => setCustomerTab('menu')}
                className="group relative overflow-hidden rounded-none border-2 border-coffee-dark bg-white p-5 text-left shadow-neo-sm transition-all hover:border-coffee-amber hover:shadow-neo-sm sm:p-6"
              >
                <div className="w-12 h-12 rounded-none bg-neo-yellow text-coffee-amber flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                  <FaCoffee />
                </div>
                <h3 className="font-heading font-bold text-coffee-dark text-base flex items-center gap-1.5">
                  Pesan Menu Baru <FaArrowRight className="text-xs text-coffee-amber group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-coffee-brown/70 mt-1 leading-relaxed">
                  Pilih kopi lokal pilihan (Gayo, Toraja), smoothies segar, dan cemilan pendamping.
                </p>
              </button>
              
              <button
                onClick={() => {
                  if (activeOrder) {
                    setCustomerTab('track');
                  } else {
                    alert('Belum ada pesanan aktif. Silakan pilih menu dan buat pesanan terlebih dahulu.');
                  }
                }}
                className={`group relative overflow-hidden rounded-none border-2 border-coffee-dark bg-white p-5 text-left shadow-neo-sm transition-all sm:p-6 ${
                  activeOrder ? 'hover:border-coffee-amber hover:shadow-neo-sm' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="w-12 h-12 rounded-none bg-coffee-dark/10 text-coffee-dark flex items-center justify-center text-xl mb-4">
                  <FaReceipt />
                </div>
                <h3 className="font-heading font-bold text-coffee-dark text-base flex items-center gap-1.5">
                  Lacak Pesanan Saya <FaArrowRight className="text-xs text-coffee-brown/70" />
                </h3>
                <p className="text-xs text-coffee-brown/70 mt-1 leading-relaxed">
                  Pantau alur pelayanan dapur ke meja Anda secara real-time.
                </p>
              </button>
            </div>

            {/* Recommended Products Display */}
            {recommendations.length > 0 && (
              <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
                <h3 className="font-heading font-bold text-base text-coffee-dark mb-4 flex items-center gap-2">
                  <FaStar className="text-coffee-amber" /> Rekomendasi Hari Ini
                </h3>
                <div className="grid gap-3">
                  {recommendations.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setCustomerTab('menu');
                        handleOpenCustomize(item);
                      }}
                      className="group flex cursor-pointer items-center justify-between gap-3 border-b-2 border-coffee-dark/50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex gap-3 items-center min-w-0">
                        <span className="text-2xl bg-coffee-soft p-1.5 rounded-none shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-coffee-dark truncate group-hover:text-coffee-amber transition">{item.name}</h4>
                          <p className="text-[10px] text-coffee-brown/70 truncate">{item.description}</p>
                        </div>
                      </div>
                      <span className="font-heading font-extrabold text-xs text-coffee-amber shrink-0">{formatRupiah(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* --- PORTAL ACCESS 1: TAB MENU (DIGITAL ORDER MENU) --- */}
        {customerTab === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Top Back navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setCustomerTab('home')}
                className="flex items-center gap-1.5 text-xs font-semibold text-coffee-brown hover:text-coffee-amber transition"
              >
                <FaChevronLeft size={10} /> Kembali ke Beranda Meja
              </button>
              {cart.length > 0 && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-none bg-coffee-amber px-3 py-2 text-xs font-bold text-white shadow transition-transform hover:scale-105 hover:bg-coffee-dark sm:px-4"
                >
                  <FaShoppingCart /> Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-brown" />
              <input
                type="text"
                placeholder="Cari kopi atau makanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-coffee-dark rounded-none text-sm focus:outline-none focus:border-coffee-amber transition shadow-neo-sm"
              />
            </div>

            {/* Category selection */}
            <div className="flex snap-x gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-none px-5 py-2 text-xs font-bold tracking-wide transition shrink-0 snap-start ${
                    activeCategory === category
                      ? 'bg-coffee-dark text-white shadow-neo-sm'
                      : 'bg-white text-coffee-brown border-2 border-coffee-dark hover:bg-neo-yellow'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Products grid */}
            {filteredMenu.length === 0 ? (
              <div className="rounded-none border-2 border-coffee-dark bg-white/50 p-5 py-10 text-center sm:p-6 sm:py-12">
                <FaUtensils className="text-4xl text-coffee-cream mx-auto mb-3" />
                <p className="text-coffee-brown font-semibold text-sm">Menu tidak ditemukan</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredMenu.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => handleOpenCustomize(item)}
                    className={`group flex cursor-pointer gap-3 rounded-none border-2 border-coffee-dark bg-white p-3 transition shadow-neo-sm hover:shadow-neo-sm sm:p-3.5 ${
                      !item.available ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
                    }`}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-none bg-coffee-cream text-xl transition-transform group-hover:rotate-6 sm:h-14 sm:w-14 sm:text-2xl">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-heading font-bold text-coffee-dark text-sm truncate group-hover:text-coffee-amber transition">
                            {item.name}
                          </h3>
                          {!item.available && (
                            <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded-none uppercase shrink-0">
                              Habis
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-coffee-brown/85 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="font-heading font-extrabold text-xs sm:text-sm text-coffee-amber">
                          {formatRupiah(item.price)}
                        </span>
                        {item.available && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomize(item);
                            }}
                            className="rounded-none bg-coffee-dark px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-coffee-amber"
                          >
                            Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Bottom sticky Cart trigger */}
            {cart.length > 0 && (
              <div className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-none border-2 border-coffee-dark bg-coffee-dark/95 px-4 py-3 text-white shadow-neo-lg backdrop-blur sm:bottom-6 sm:w-[calc(100%-2rem)] sm:px-5 sm:py-4">
                <div>
                  <span className="block text-[10px] text-white/70 font-semibold uppercase">TOTAL BELANJA</span>
                  <span className="font-heading font-extrabold text-base sm:text-lg text-coffee-amber">{formatRupiah(cartTotal)}</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="flex shrink-0 items-center gap-2 rounded-none bg-coffee-amber px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-white hover:text-coffee-dark sm:px-5 sm:text-sm"
                >
                  <FaShoppingCart /> Lihat Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* --- PORTAL ACCESS 1: TAB TRACK (REAL-TIME ORDER TRACKING) --- */}
        {customerTab === 'track' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Back button */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setCustomerTab('home')}
                className="flex items-center gap-1.5 text-xs font-semibold text-coffee-brown hover:text-coffee-amber transition"
              >
                <FaChevronLeft size={10} /> Kembali ke Beranda Meja
              </button>
            </div>

            {/* Order status tracking element */}
            {activeOrderId && activeOrder ? (
              <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
                <div className="text-center pb-5 border-b-2 border-coffee-dark mb-5">
                  <span className="inline-block text-3xl mb-1">☕</span>
                  <h2 className="font-heading text-lg font-bold text-coffee-dark">Kopi Nusantara</h2>
                  <p className="text-[10px] text-coffee-brown uppercase tracking-widest mt-0.5">Pelacakan Pesanan Aktif</p>
                  <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-coffee-cream text-coffee-dark font-bold text-[10px]">
                    KODE: {activeOrder.shortId}
                  </div>
                </div>

                {/* Progress details */}
                {/* 1=Masuk, 2=Diproses, 3=Selesai */}
                {(() => {
                  const step = activeOrder.status === 'Masuk' ? 1 : activeOrder.status === 'Diproses' ? 2 : 3;
                  return (
                    <div className="mb-6 relative pl-4">
                      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-coffee-cream -z-1"></div>
                      
                      {/* Step 1 */}
                      <div className="flex gap-4 items-start mb-5">
                        <div className={`w-10 h-10 rounded-none flex items-center justify-center font-bold text-xs shrink-0 border-2 transition-all ${
                          step >= 1 ? 'bg-coffee-amber border-coffee-amber text-white shadow-neo-sm' : 'bg-white border-coffee-cream text-coffee-brown'
                        }`}>
                          {step > 1 ? <FaCheckCircle /> : '1'}
                        </div>
                        <div className="pt-1">
                          <h4 className={`font-bold text-xs sm:text-sm ${step >= 1 ? 'text-coffee-dark' : 'text-gray-400'}`}>Pesanan Diterima</h4>
                          <p className="text-[11px] text-coffee-brown/70">Pesanan tercatat di kasir & antrean dapur.</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-4 items-start mb-5">
                        <div className={`w-10 h-10 rounded-none flex items-center justify-center font-bold text-xs shrink-0 border-2 transition-all ${
                          step >= 2 ? 'bg-coffee-brown border-coffee-brown text-white shadow-neo-sm' : 'bg-white border-coffee-cream text-coffee-brown'
                        }`}>
                          {step === 2 ? <FaSpinner className="animate-spin" /> : step > 2 ? <FaCheckCircle /> : '2'}
                        </div>
                        <div className="pt-1">
                          <h4 className={`font-bold text-xs sm:text-sm ${step >= 2 ? 'text-coffee-dark' : 'text-gray-400'}`}>Sedang Disiapkan</h4>
                          <p className="text-[11px] text-coffee-brown/70">Barista/dapur sedang menyajikan menu Anda.</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-4 items-start">
                        <div className={`w-10 h-10 rounded-none flex items-center justify-center font-bold text-xs shrink-0 border-2 transition-all ${
                          step >= 3 ? 'bg-emerald-600 border-emerald-600 text-white shadow-neo-sm' : 'bg-white border-coffee-cream text-coffee-brown'
                        }`}>
                          {step >= 3 ? <FaCheckCircle /> : '3'}
                        </div>
                        <div className="pt-1">
                          <h4 className={`font-bold text-xs sm:text-sm ${step >= 3 ? 'text-emerald-700' : 'text-gray-400'}`}>Selesai & Disajikan</h4>
                          <p className="text-[11px] text-coffee-brown/70">Hidangan telah diantarkan ke Meja {activeOrder.meja}.</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Cash payment confirmed indicator */}
                <div className={`mb-5 flex items-center gap-3 rounded-none border-2 p-3 text-[11px] sm:p-4 ${
                  activeOrder.pembayaran === 'Selesai' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  {activeOrder.pembayaran === 'Selesai' ? (
                    <>
                      <FaCheckCircle className="text-base shrink-0" />
                      <div>
                        <span className="font-bold">Pembayaran Lunas</span>
                        <p className="mt-0.5 text-emerald-800/80">Verifikasi lunas telah dikonfirmasi oleh kasir.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FaClock className="text-base shrink-0 animate-pulse text-amber-500" />
                      <div>
                        <span className="font-bold">Menunggu Pembayaran</span>
                        <p className="mt-0.5 text-amber-800/80">Silakan lakukan pembayaran tunai ke meja kasir.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Receipts */}
                <div className="mb-5 rounded-none border-2 border-coffee-dark bg-white p-3 sm:p-4">
                  <h5 className="font-bold text-coffee-dark text-xs mb-2.5 flex items-center gap-1">
                    <FaReceipt /> Struk Belanja ({activeOrder.nama}):
                  </h5>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-[11px]">
                        <div>
                          <span className="font-bold text-coffee-dark">{item.quantity}x</span> {item.name}
                          <div className="text-[9px] text-coffee-brown/70 mt-0.5">
                            {item.customization.ukuran !== 'Regular' && `[${item.customization.ukuran}] `}
                            {item.customization.suhu !== 'Tidak Berlaku' && `${item.customization.suhu} `}
                            {item.customization.manis !== 'Tidak Berlaku' && `- ${item.customization.manis}`}
                            {item.customization.catatan && ` | Note: "${item.customization.catatan}"`}
                          </div>
                        </div>
                        <span className="font-semibold text-coffee-dark shrink-0">{formatRupiah(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-2 border-coffee-dark mt-3 pt-2 flex justify-between items-center font-bold text-xs sm:text-sm text-coffee-dark">
                    <span>Total Tagihan:</span>
                    <span className="text-coffee-amber">{formatRupiah(activeOrder.total)}</span>
                  </div>
                </div>

                {/* Clear Order / Pay and order more */}
                <button
                  onClick={handleOrderFinished}
                  className="w-full py-3 px-4 bg-coffee-dark text-white rounded-none font-bold text-xs sm:text-sm transition hover:bg-coffee-amber shadow"
                >
                  Selesaikan & Tutup Tagihan
                </button>
              </div>
            ) : (
              <div className="rounded-none border-2 border-coffee-dark bg-white p-5 py-10 text-center sm:p-6 sm:py-12">
                <FaReceipt className="text-4xl text-coffee-cream mx-auto mb-3" />
                <p className="text-coffee-brown font-semibold text-sm">Tidak ada pesanan aktif yang terlacak</p>
                <p className="text-[11px] text-coffee-brown/70 mt-2 leading-relaxed">
                  Jika sebelumnya sudah memesan, masukkan kode pesanan dari struk, contoh: KN-123456.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = trackCode.trim();
                    if (!code) return alert('Masukkan kode pesanan terlebih dahulu.');
                    localStorage.setItem('kn_last_order_code', code);
                    setTrackCode(code);
                  }}
                  className="mt-4 flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    placeholder="Kode pesanan, contoh KN-602569"
                    className="min-w-0 flex-1 rounded-none border-2 border-coffee-dark px-3 py-2 text-sm outline-none focus:border-coffee-amber sm:text-xs"
                  />
                  <button className="rounded-none bg-coffee-dark px-4 py-2 text-xs font-bold text-white hover:bg-coffee-amber">
                    Lacak
                  </button>
                </form>
                <button 
                  onClick={() => setCustomerTab('menu')}
                  className="mt-4 text-xs font-bold text-coffee-amber hover:underline"
                >
                  Pesan menu sekarang
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* --- CUSTOMIZATION MODAL (MODAL DETAIL MENU) --- */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="flex max-h-[92svh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.25rem] border-2 border-coffee-dark bg-white shadow-neo-lg sm:max-h-[90vh] sm:rounded-none"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 border-b-2 border-coffee-dark p-4 pb-3 sm:p-5 sm:pb-3">
                  <div className="flex gap-3 items-center">
                    <span className="text-2xl bg-coffee-cream p-2.5 rounded-none">{selectedItem.icon}</span>
                    <div>
                      <h3 className="font-heading text-base font-bold text-coffee-dark">{selectedItem.name}</h3>
                      <p className="text-xs text-coffee-amber font-semibold">{formatRupiah(selectedItem.price)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-7 h-7 rounded-none bg-coffee-soft text-coffee-brown font-bold text-xs flex items-center justify-center hover:bg-coffee-cream"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content Options */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-5">
                  {/* Size */}
                  <div>
                    <h4 className="font-bold text-[10px] text-coffee-dark uppercase tracking-wider mb-2">Ukuran Porsi</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['Regular', 'Large (+5k)'].map((opt) => {
                        const uk = opt.startsWith('Regular') ? 'Regular' : 'Large';
                        return (
                          <button
                            key={uk}
                            onClick={() => setCustomization({ ...customization, ukuran: uk })}
                            className={`py-2 px-3 border rounded-none text-xs font-bold transition text-center ${
                              customization.ukuran === uk
                                ? 'bg-coffee-dark border-coffee-dark text-white'
                                : 'bg-white border-coffee-cream text-coffee-brown hover:bg-coffee-soft'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Temperature Suhu (Drinks only) */}
                  {(selectedItem.category.includes('Kopi') || selectedItem.category === 'Non-Kopi') && (
                    <div>
                      <h4 className="font-bold text-[10px] text-coffee-dark uppercase tracking-wider mb-2">Suhu Penyajian</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {['Panas', 'Dingin'].map((suhuOpt) => (
                          <button
                            key={suhuOpt}
                            onClick={() => setCustomization({ ...customization, suhu: suhuOpt })}
                            className={`py-2 px-3 border rounded-none text-xs font-bold transition text-center ${
                              customization.suhu === suhuOpt
                                ? 'bg-coffee-dark border-coffee-dark text-white'
                                : 'bg-white border-coffee-cream text-coffee-brown hover:bg-coffee-soft'
                            }`}
                          >
                            {suhuOpt === 'Panas' ? '🔥 Panas' : '🧊 Dingin'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sweetness (Drinks only) */}
                  {customization.manis !== 'Tidak Berlaku' && (
                    <div>
                      <h4 className="font-bold text-[10px] text-coffee-dark uppercase tracking-wider mb-2">Tingkat Kemanisan</h4>
                      <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
                        {['Normal', 'Kurang Manis', 'Tidak Manis'].map((manisOpt) => (
                          <button
                            key={manisOpt}
                            onClick={() => setCustomization({ ...customization, manis: manisOpt })}
                            className={`py-2 px-1 border rounded-none text-[10px] font-bold transition text-center ${
                              customization.manis === manisOpt
                                ? 'bg-coffee-dark border-coffee-dark text-white'
                                : 'bg-white border-coffee-cream text-coffee-brown hover:bg-coffee-soft'
                            }`}
                          >
                            {manisOpt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Catatan */}
                  <div>
                    <h4 className="font-bold text-[10px] text-coffee-dark uppercase tracking-wider mb-2">Catatan Tambahan</h4>
                    <textarea
                      placeholder="Contoh: es batu sedikit, tanpa pemanis cair..."
                      value={customization.catatan}
                      onChange={(e) => setCustomization({ ...customization, catatan: e.target.value })}
                      className="w-full border-2 border-coffee-dark p-3 rounded-none text-xs focus:outline-none focus:border-coffee-amber transition resize-none h-16"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between gap-3 border-t-2 border-coffee-dark bg-coffee-soft p-4 sm:p-5">
                  <div>
                    <span className="block text-[9px] text-coffee-brown/70 font-semibold uppercase font-sans">HARGA TOTAL</span>
                    <span className="font-heading font-extrabold text-base text-coffee-amber">
                      {formatRupiah(selectedItem.price + (customization.ukuran === 'Large' ? 5000 : 0))}
                    </span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="shrink-0 rounded-none bg-coffee-dark px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-coffee-amber sm:px-5"
                  >
                    Tambah ke Keranjang
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- CART DRAWER / CHECKOUT MODAL --- */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="flex h-full w-full max-w-md flex-col border-l-2 border-coffee-dark bg-white shadow-neo-lg"
              >
                {/* Cart Header */}
                <div className="flex items-center justify-between gap-3 border-b-2 border-coffee-dark bg-coffee-soft p-4 sm:p-5">
                  <h3 className="font-heading text-base font-bold text-coffee-dark flex items-center gap-2">
                    <FaShoppingCart /> Keranjang Belanja
                  </h3>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-8 h-8 rounded-none bg-white text-coffee-brown font-bold text-xs flex items-center justify-center hover:bg-coffee-cream shadow-neo-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="flex-grow space-y-3 overflow-y-auto p-4 sm:p-5">
                  {cart.length === 0 ? (
                    <div className="py-10 text-center text-coffee-brown sm:py-12">
                      <FaShoppingCart className="text-3xl text-coffee-cream mx-auto mb-2" />
                      <p className="font-semibold text-xs">Keranjang belanja kosong</p>
                    </div>
                  ) : (
                    cart.map((cartItem) => (
                      <div 
                        key={cartItem.id}
                        className="flex gap-3 pb-3 border-b-2 border-coffee-dark/40 items-start"
                      >
                        <span className="text-xl bg-coffee-soft p-1.5 rounded-none shrink-0">{cartItem.icon}</span>
                        <div className="flex-1 min-w-0 text-xs">
                          <h4 className="font-bold text-coffee-dark truncate">{cartItem.name}</h4>
                          
                          {/* Customize options description */}
                          <div className="text-[9px] text-coffee-brown/70 mt-1 flex flex-wrap gap-1 items-center">
                            {cartItem.customization.ukuran !== 'Regular' && (
                              <span className="bg-neo-yellow px-1 py-0.5 rounded text-coffee-brown font-semibold">
                                {cartItem.customization.ukuran}
                              </span>
                            )}
                            {cartItem.customization.suhu !== 'Tidak Berlaku' && (
                              <span className="bg-neo-yellow px-1 py-0.5 rounded text-coffee-brown">
                                {cartItem.customization.suhu}
                              </span>
                            )}
                            {cartItem.customization.manis !== 'Tidak Berlaku' && (
                              <span className="text-coffee-brown">- {cartItem.customization.manis}</span>
                            )}
                            {cartItem.customization.catatan && (
                              <p className="italic text-coffee-brown/80 w-full mt-0.5">Note: "{cartItem.customization.catatan}"</p>
                            )}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            {/* Quantity */}
                            <div className="flex items-center gap-2 border-2 border-coffee-dark rounded-none px-2 py-0.5 bg-coffee-soft">
                              <button 
                                onClick={() => updateQuantity(cartItem.id, -1)}
                                className="text-[10px] text-coffee-brown font-bold w-3 h-3 flex items-center justify-center hover:bg-coffee-cream rounded"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-coffee-dark">{cartItem.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(cartItem.id, 1)}
                                className="text-[10px] text-coffee-brown font-bold w-3 h-3 flex items-center justify-center hover:bg-coffee-cream rounded"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-heading font-bold text-xs text-coffee-dark">
                              {formatRupiah(cartItem.price * cartItem.quantity)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCartItem(cartItem.id)}
                          className="text-gray-400 hover:text-red-600 transition p-1"
                          aria-label="Hapus"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Checkout Summary Form */}
                {cart.length > 0 && (
                  <form onSubmit={handleCheckout} className="space-y-3 border-t-2 border-coffee-dark bg-coffee-soft p-4 sm:p-5">
                    <div>
                      <label htmlFor="customer-name" className="block text-xs font-bold text-coffee-dark mb-1 flex items-center gap-1">
                        <FaUser size={9} /> Nama Pemesan <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer-name"
                        type="text"
                        required
                        placeholder="Nama Anda..."
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs bg-white focus:outline-none focus:border-coffee-amber transition shadow-neo-sm"
                      />
                    </div>

                    <div className="border-t border-b-2 border-coffee-dark/50 py-2.5 space-y-1 text-xs text-coffee-brown">
                      <div className="flex justify-between">
                        <span>Items:</span>
                        <span className="font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}x</span>
                      </div>
                      <div className="flex justify-between text-sm text-coffee-dark font-bold">
                        <span>Total:</span>
                        <span className="text-coffee-amber font-heading font-extrabold">{formatRupiah(cartTotal)}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-coffee-dark hover:bg-coffee-amber text-white rounded-none font-bold text-xs sm:text-sm transition shadow flex items-center justify-center gap-2"
                    >
                      <FaCheckCircle /> Kirim Order Ke Dapur
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CustomerOrder;
