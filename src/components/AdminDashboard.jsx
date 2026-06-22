import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChartBar,
  FaClipboardList,
  FaCoffee,
  FaFileExcel,
  FaMoneyBillWave,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaVolumeUp,
  FaPlusCircle,
  FaExclamationCircle,
  FaCalendarAlt,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaStar,
} from "react-icons/fa";
import {
  getMenuSync,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getOrdersSync,
  updateOrderStatusSync,
  getExpensesSync,
  addExpense,
  deleteExpense,
} from "../utils/storage";
import { exportToExcelCSV } from "../utils/exportExcel";

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, orders, menu, financial
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Real-time tracking reference to play sounds
  const prevOrdersCount = useRef(0);
  const isInitialLoad = useRef(true);

  // sound player using Web Audio API (so it doesn't need external audio files)
  const playNewOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      // Chime note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Chime note 2 (delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.log("Chime sound blocked or unsupported", e);
    }
  };

  // Synchronize data on mount and poll for real-time updates
  const loadData = async () => {
    const freshOrders = await getOrdersSync();
    const freshMenu = await getMenuSync();
    const freshExpenses = await getExpensesSync();

    setOrders(freshOrders);
    setMenuItems(freshMenu);
    setExpenses(freshExpenses);

    // Audio chime on new incoming orders (only if it increases and not initial load)
    const incomingCount = freshOrders.filter(
      (o) => o.status === "Masuk",
    ).length;
    if (
      !isInitialLoad.current &&
      freshOrders.length > prevOrdersCount.current
    ) {
      const newOrders = freshOrders.slice(
        0,
        freshOrders.length - prevOrdersCount.current,
      );
      const hasNewIncoming = newOrders.some((o) => o.status === "Masuk");
      if (hasNewIncoming) {
        playNewOrderChime();
      }
    }

    prevOrdersCount.current = freshOrders.length;
    isInitialLoad.current = false;
  };

  useEffect(() => {
    loadData();

    // Polling data every 2 seconds for real-time order updates
    const interval = setInterval(loadData, 2000);

    // Listen to changes from other tabs
    const handleStorageChange = (e) => {
      if (["kn_orders", "kn_menu", "kn_expenses"].includes(e.key)) {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Format currency
  const formatRupiah = (num) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- STATS COMPUTATION ---
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    const todayOrders = orders.filter(
      (o) => o.tanggal.slice(0, 10) === todayStr && o.status !== "Dibatalkan",
    );
    const todayCompletedOrders = todayOrders.filter(
      (o) => o.status === "Selesai",
    );

    const todayRevenue = todayCompletedOrders.reduce(
      (sum, o) => sum + o.total,
      0,
    );
    const activeOrdersCount = orders.filter(
      (o) => o.status === "Masuk" || o.status === "Diproses",
    ).length;
    const completedOrdersCount = orders.filter(
      (o) => o.status === "Selesai",
    ).length;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.jumlah, 0);

    return {
      revenueToday: todayRevenue,
      activeOrders: activeOrdersCount,
      completedOrders: completedOrdersCount,
      totalExpenses,
    };
  }, [orders, expenses]);

  // --- CHART SVG COMPUTATION ---
  // Returns last 7 days labels, income, expenses for custom line/bar chart
  const chartData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const dayIncome = orders
        .filter(
          (o) => o.tanggal.slice(0, 10) === dateStr && o.status === "Selesai",
        )
        .reduce((sum, o) => sum + o.total, 0);

      const dayExpense = expenses
        .filter((e) => e.tanggal === dateStr)
        .reduce((sum, e) => sum + e.jumlah, 0);

      result.push({
        label: d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        }),
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
      });
    }
    return result;
  }, [orders, expenses]);

  // SVG Chart sizing details
  const chartMaxVal = useMemo(() => {
    const vals = chartData.flatMap((d) => [d.income, d.expense]);
    const max = Math.max(...vals, 100000); // minimum scale limit
    return Math.ceil(max / 50000) * 50000; // round up to multiple of 50k
  }, [chartData]);

  // --- CRUD MENU MODAL STATE ---
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null); // null if adding
  const [menuForm, setMenuForm] = useState({
    name: "",
    category: "Kopi Panas",
    price: "",
    description: "",
    icon: "☕",
    available: true,
    recommended: false,
  });

  const handleOpenAddMenu = () => {
    setEditingMenuItem(null);
    setMenuForm({
      name: "",
      category: "Kopi Panas",
      price: "",
      description: "",
      icon: "☕",
      available: true,
      recommended: false,
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (item) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      icon: item.icon,
      available: item.available !== undefined ? item.available : true,
      recommended: item.recommended === true,
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuForm.name.trim() || !menuForm.price) return;

    if (editingMenuItem) {
      await updateMenuItem(editingMenuItem.id, menuForm);
    } else {
      await addMenuItem(menuForm);
    }

    await loadData();
    setIsMenuModalOpen(false);
  };

  const handleDeleteMenu = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini?")) {
      await deleteMenuItem(id);
      await loadData();
    }
  };

  const toggleMenuAvailability = async (id, currentVal) => {
    await updateMenuItem(id, { available: !currentVal });
    await loadData();
  };

  const toggleMenuRecommendation = async (id, currentVal) => {
    await updateMenuItem(id, { recommended: !currentVal });
    await loadData();
  };

  // --- MANUAL EXPENSE FORM STATE ---
  const [expenseForm, setExpenseForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: "Bahan Baku",
    deskripsi: "",
    jumlah: "",
  });

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.deskripsi.trim() || !expenseForm.jumlah) return;

    await addExpense(expenseForm);
    setExpenseForm({
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: "Bahan Baku",
      deskripsi: "",
      jumlah: "",
    });
    await loadData();
  };

  const handleDeleteExpense = async (id) => {
    if (confirm("Hapus pencatatan pengeluaran ini?")) {
      await deleteExpense(id);
      await loadData();
    }
  };

  // --- EXPORT TO EXCEL FEATURE ---
  const [exportRange, setExportRange] = useState("all"); // today, month, all

  const handleExportFinancial = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

    let filteredOrders = orders.filter((o) => o.status === "Selesai");
    let filteredExpenses = expenses;

    if (exportRange === "today") {
      filteredOrders = filteredOrders.filter(
        (o) => o.tanggal.slice(0, 10) === todayStr,
      );
      filteredExpenses = filteredExpenses.filter((e) => e.tanggal === todayStr);
    } else if (exportRange === "month") {
      filteredOrders = filteredOrders.filter(
        (o) => o.tanggal.slice(0, 7) === thisMonthStr,
      );
      filteredExpenses = filteredExpenses.filter(
        (e) => e.tanggal.slice(0, 7) === thisMonthStr,
      );
    }

    // Combine into ledger entries chronologically
    const ledger = [];

    filteredOrders.forEach((o) => {
      ledger.push({
        tanggal: o.tanggal,
        id: o.shortId,
        tipe: "Pemasukan",
        kategori: "Penjualan Menu",
        keterangan: `Pemesanan Meja ${o.meja} (${o.nama})`,
        masuk: o.total,
        keluar: 0,
      });
    });

    filteredExpenses.forEach((e) => {
      ledger.push({
        tanggal: `${e.tanggal}T00:00:00.000Z`,
        id: e.id.slice(0, 10),
        tipe: "Pengeluaran",
        kategori: e.kategori,
        keterangan: e.deskripsi,
        masuk: 0,
        keluar: e.jumlah,
      });
    });

    // Sort by date ascending
    ledger.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    // Formulate sheets data
    const headers = [
      "No",
      "Tanggal",
      "Kode/ID",
      "Tipe",
      "Kategori",
      "Keterangan",
      "Pemasukan (Rp)",
      "Pengeluaran (Rp)",
      "Laba/Saldo (Rp)",
    ];

    let balance = 0;
    const rows = ledger.map((item, idx) => {
      balance += item.masuk - item.keluar;
      return [
        idx + 1,
        new Date(item.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        item.id,
        item.tipe,
        item.kategori,
        item.keterangan,
        item.masuk,
        item.keluar,
        balance,
      ];
    });

    // Add summary row at bottom
    const totalMasuk = ledger.reduce((sum, item) => sum + item.masuk, 0);
    const totalKeluar = ledger.reduce((sum, item) => sum + item.keluar, 0);
    rows.push([]);
    rows.push([
      "",
      "",
      "TOTAL REKAPITULASI",
      "",
      "",
      "",
      totalMasuk,
      totalKeluar,
      totalMasuk - totalKeluar,
    ]);

    exportToExcelCSV(
      `Laporan_Keuangan_Kopi_Nusantara_${exportRange}`,
      headers,
      rows,
    );
  };

  // --- KANBAN ORDER STATUS MANAGEMENT ---
  const handleUpdateStatus = (orderId, newStatus) => {
    updateOrderStatusSync(orderId, newStatus).then(loadData);
  };

  const handleConfirmPayment = (orderId) => {
    updateOrderStatusSync(orderId, null, "Selesai").then(loadData);
  };

  const incomingOrders = orders.filter((o) => o.status === "Masuk");
  const inProgressOrders = orders.filter((o) => o.status === "Diproses");
  const completedOrders = orders.filter((o) => o.status === "Selesai");

  // Calculates elapsed minutes for orders in progress
  const getElapsedMinutes = (dateStr) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    return Math.floor(elapsedMs / 60000);
  };

  // Timer refresh just for elapsed minutes in UI
  const [, setTimerTrigger] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTrigger((prev) => prev + 1);
    }, 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[100svh] flex-col bg-coffee-soft pt-20 md:flex-row">
      {/* Sidebar navigation */}
      <aside className="z-40 flex w-full shrink-0 gap-2 overflow-x-auto bg-coffee-dark px-3 py-3 text-white no-scrollbar md:fixed md:bottom-0 md:top-20 md:w-64 md:flex-col md:overflow-y-auto md:p-6">
        <div className="hidden md:block mb-8">
          <h2 className="font-heading font-extrabold text-xl text-coffee-amber">
            Panel Admin
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Sistem Kontrol Kopi Nusantara
          </p>
        </div>

        <button
          onClick={() => setActiveTab("overview")}
          className={`flex flex-none min-w-max items-center gap-2 rounded-none px-3 py-3 text-left text-xs font-bold transition sm:text-sm md:min-w-0 md:flex-initial md:gap-3 md:px-4 ${activeTab === "overview"
              ? "bg-coffee-amber text-white"
              : "hover:bg-white text-white/80"
            }`}
        >
          <FaChartBar /> Ringkasan
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-none min-w-max items-center gap-2 rounded-none px-3 py-3 text-left text-xs font-bold transition sm:text-sm md:min-w-0 md:flex-initial md:gap-3 md:px-4 relative ${activeTab === "orders"
              ? "bg-coffee-amber text-white"
              : "hover:bg-white text-white/80"
            }`}
        >
          <FaClipboardList /> Kontrol Pesanan
          {incomingOrders.length > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-white w-5 h-5 rounded-none text-[10px] font-bold flex items-center justify-center animate-bounce shadow">
              {incomingOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-none min-w-max items-center gap-2 rounded-none px-3 py-3 text-left text-xs font-bold transition sm:text-sm md:min-w-0 md:flex-initial md:gap-3 md:px-4 ${activeTab === "menu"
              ? "bg-coffee-amber text-white"
              : "hover:bg-white text-white/80"
            }`}
        >
          <FaCoffee /> Kelola Menu
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex flex-none min-w-max items-center gap-2 rounded-none px-3 py-3 text-left text-xs font-bold transition sm:text-sm md:min-w-0 md:flex-initial md:gap-3 md:px-4 ${activeTab === "recommendations"
              ? "bg-coffee-amber text-white"
              : "hover:bg-white text-white/80"
            }`}
        >
          <FaStar /> Rekomendasi Hari Ini
        </button>
        <button
          onClick={() => setActiveTab("financial")}
          className={`flex flex-none min-w-max items-center gap-2 rounded-none px-3 py-3 text-left text-xs font-bold transition sm:text-sm md:min-w-0 md:flex-initial md:gap-3 md:px-4 ${activeTab === "financial"
              ? "bg-coffee-amber text-white"
              : "hover:bg-white text-white/80"
            }`}
        >
          <FaMoneyBillWave /> Laporan & Pengeluaran
        </button>

        <button
          onClick={onLogout}
          className="mt-0 flex min-w-max flex-none items-center gap-2 rounded-none border border-red-500/20 px-3 py-3 text-left text-xs font-bold text-red-400 transition hover:bg-red-600/20 md:mt-auto md:w-auto md:gap-3 md:px-4 md:py-2.5"
        >
          <FaTimesCircle /> Keluar (Logout)
        </button>

        <div className="hidden md:block bg-white/5 border-2 border-coffee-dark p-2.5 rounded-none w-full">
          <p className="text-[10px] text-white/70 font-semibold flex items-center gap-1.5 justify-center">
            <FaVolumeUp className="text-coffee-amber" /> Sound Notif Aktif
          </p>
        </div>
      </aside>

      {/* Main Panel Content (Shifted on desktop for fixed sidebar) */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 md:ml-64">
        {/* STATS TILES GRID */}
        <div className="mb-5 grid gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-5">
            <span className="text-xs font-bold text-coffee-brown uppercase tracking-wider block mb-1">
              Pemasukan Hari Ini
            </span>
            <span className="font-heading font-extrabold text-2xl text-coffee-amber">
              {formatRupiah(stats.revenueToday)}
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">
              Khusus pesanan selesai hari ini
            </span>
          </div>
          <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-5">
            <span className="text-xs font-bold text-coffee-brown uppercase tracking-wider block mb-1">
              Pesanan Aktif
            </span>
            <span className="font-heading font-extrabold text-2xl text-coffee-dark">
              {stats.activeOrders}
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">
              Pesanan mengantre & diproses
            </span>
          </div>
          <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-5">
            <span className="text-xs font-bold text-coffee-brown uppercase tracking-wider block mb-1">
              Pesanan Selesai
            </span>
            <span className="font-heading font-extrabold text-2xl text-emerald-600">
              {stats.completedOrders}
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">
              Total riwayat pesanan selesai
            </span>
          </div>
          <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-5">
            <span className="text-xs font-bold text-coffee-brown uppercase tracking-wider block mb-1">
              Total Pengeluaran
            </span>
            <span className="font-heading font-extrabold text-2xl text-red-600">
              {formatRupiah(stats.totalExpenses)}
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">
              Dicatat manual oleh manajemen
            </span>
          </div>
        </div>

        {/* --- TAB: OVERVIEW --- */}
        {activeTab === "overview" && (
          <div className="space-y-5 sm:space-y-8">
            {/* SVG CHART CONTAINER */}
            <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
              <h3 className="font-heading font-extrabold text-xl text-coffee-dark mb-6">
                Analitik Arus Keuangan (7 Hari Terakhir)
              </h3>

              <div className="w-full overflow-x-auto">
                <div className="min-w-[500px] h-64 relative flex flex-col justify-between">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const val = chartMaxVal * (1 - ratio);
                    return (
                      <div
                        key={i}
                        className="absolute left-16 right-0 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400"
                        style={{ top: `${ratio * 80}%` }}
                      >
                        <span className="absolute -left-16 text-right w-12">
                          {formatRupiah(val)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Chart Bars */}
                  <div className="absolute left-16 right-0 bottom-10 top-0 flex justify-around items-end">
                    {chartData.map((data, idx) => {
                      const incomePct = (data.income / chartMaxVal) * 100;
                      const expensePct = (data.expense / chartMaxVal) * 100;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1 w-12 group relative"
                        >
                          <div className="flex items-end gap-1.5 h-44 w-full justify-center">
                            {/* Income Bar (Amber) */}
                            <div
                              className="w-4 bg-coffee-amber rounded-t-sm transition-all duration-500 relative group/inc hover:brightness-110"
                              style={{ height: `${Math.max(incomePct, 2)}%` }}
                            >
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-coffee-dark text-white text-[9px] px-1 rounded opacity-0 group-hover/inc:opacity-100 transition whitespace-nowrap shadow z-10">
                                {formatRupiah(data.income)}
                              </span>
                            </div>
                            {/* Expense Bar (Red) */}
                            <div
                              className="w-4 bg-red-500 rounded-t-sm transition-all duration-500 relative group/exp hover:brightness-110"
                              style={{ height: `${Math.max(expensePct, 2)}%` }}
                            >
                              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-coffee-dark text-white text-[9px] px-1 rounded opacity-0 group-hover/exp:opacity-100 transition whitespace-nowrap shadow z-10">
                                {formatRupiah(data.expense)}
                              </span>
                            </div>
                          </div>

                          {/* Label */}
                          <span className="text-[10px] text-coffee-brown font-semibold mt-2 text-center truncate w-16 whitespace-nowrap">
                            {data.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 justify-center mt-6 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-coffee-dark">
                  <span className="w-3.5 h-3.5 bg-coffee-amber rounded-sm"></span>{" "}
                  Pemasukan (Penjualan Kopi/Makanan)
                </span>
                <span className="flex items-center gap-1.5 text-coffee-dark">
                  <span className="w-3.5 h-3.5 bg-red-500 rounded-sm"></span>{" "}
                  Pengeluaran Operasional
                </span>
              </div>
            </div>

            {/* RECENT TRANSACTIONS TABLE */}
            <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
              <h3 className="font-heading font-extrabold text-xl text-coffee-dark mb-4">
                Transaksi Terbaru
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-coffee-dark text-coffee-brown font-bold">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Tanggal</th>
                      <th className="py-3 px-2">Meja</th>
                      <th className="py-3 px-2">Nama Pelanggan</th>
                      <th className="py-3 px-2 text-right">Total Tagihan</th>
                      <th className="py-3 px-2 text-center">Status</th>
                      <th className="py-3 px-2 text-center">Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b-2 border-coffee-dark/40 hover:bg-coffee-soft/30 transition text-coffee-dark"
                      >
                        <td className="py-3 px-2 font-bold">{order.shortId}</td>
                        <td className="py-3 px-2">
                          {formatDate(order.tanggal)}
                        </td>
                        <td className="py-3 px-2 font-semibold">
                          Meja {order.meja}
                        </td>
                        <td className="py-3 px-2 truncate max-w-32">
                          {order.nama}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-coffee-amber">
                          {formatRupiah(order.total)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-none text-[10px] font-bold ${order.status === "Masuk"
                                ? "bg-amber-100 text-amber-700"
                                : order.status === "Diproses"
                                  ? "bg-blue-100 text-blue-700"
                                  : order.status === "Selesai"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-none text-[10px] font-bold ${order.pembayaran === "Selesai"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-orange-100 text-orange-700"
                              }`}
                          >
                            {order.pembayaran === "Selesai"
                              ? "Lunas"
                              : "Belum Bayar"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-6 text-gray-400"
                        >
                          Belum ada transaksi terekam.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: ORDERS (KANBAN CONTROL) --- */}
        {activeTab === "orders" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-extrabold text-2xl text-coffee-dark">
                  Alur & Kontrol Pesanan
                </h3>
                <p className="text-xs text-coffee-brown mt-0.5">
                  Ubah status pesanan pelanggan dan konfirmasi pembayaran secara
                  langsung.
                </p>
              </div>
              <button
                onClick={playNewOrderChime}
                className="py-2 px-3 border-2 border-coffee-dark hover:bg-white text-coffee-brown rounded-none text-xs font-bold transition flex items-center gap-1.5 shadow-neo-sm"
              >
                <FaVolumeUp /> Tes Bunyi Chime
              </button>
            </div>

            {/* Kanban Columns */}
            <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-3">
              {/* COLUMN 1: MASUK (Incoming) */}
              <div className="bg-white border-2 border-coffee-dark rounded-none p-4 shadow-neo-sm min-h-[500px] flex flex-col">
                <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-coffee-dark pb-3">
                  <h4 className="font-heading font-bold text-coffee-dark flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-none animate-ping"></span>{" "}
                    Masuk / Antrean
                  </h4>
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-none">
                    {incomingOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {incomingOrders.map((order) => (
                    <motion.div
                      layout
                      key={order.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="border border-amber-200 bg-amber-50/50 p-4 rounded-none relative overflow-hidden transition shadow-neo-sm hover:shadow"
                    >
                      {/* Customer & Table info */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-heading font-extrabold text-sm text-coffee-dark block">
                            Meja {order.meja}
                          </span>
                          <span className="text-xs text-coffee-brown/80 font-semibold">
                            {order.nama}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                          {order.shortId}
                        </span>
                      </div>

                      {/* Items ordered list */}
                      <div className="space-y-1.5 text-xs text-coffee-brown border-t border-b border-amber-200/50 py-2 my-2">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start"
                          >
                            <span>
                              <span className="font-bold text-coffee-dark">
                                {it.quantity}x
                              </span>{" "}
                              {it.name}
                              <div className="text-[9px] text-gray-400 mt-0.5">
                                {it.customization.ukuran !== "Regular" &&
                                  `[${it.customization.ukuran}] `}
                                {it.customization.suhu !== "Tidak Berlaku" &&
                                  `${it.customization.suhu} `}
                                {it.customization.manis !== "Tidak Berlaku" &&
                                  `- ${it.customization.manis}`}
                                {it.customization.catatan &&
                                  ` | "${it.customization.catatan}"`}
                              </div>
                            </span>
                            <span className="font-semibold text-coffee-dark">
                              {formatRupiah(it.price * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total bill & actions */}
                      <div className="flex justify-between items-center text-xs mt-3">
                        <span className="font-bold text-coffee-dark">
                          Total:{" "}
                          <span className="text-coffee-amber">
                            {formatRupiah(order.total)}
                          </span>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "Dibatalkan")
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-none transition"
                            title="Batalkan Pesanan"
                          >
                            <FaTimesCircle size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "Diproses")
                            }
                            className="py-1.5 px-3 bg-coffee-dark text-white text-xs font-bold rounded-none transition hover:bg-coffee-amber"
                          >
                            Terima / Proses
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {incomingOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      Tidak ada pesanan masuk.
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 2: DIPROSES (In-progress) */}
              <div className="bg-white border-2 border-coffee-dark rounded-none p-4 shadow-neo-sm min-h-[500px] flex flex-col">
                <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-coffee-dark pb-3">
                  <h4 className="font-heading font-bold text-coffee-dark flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-none animate-pulse"></span>{" "}
                    Sedang Disiapkan
                  </h4>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-none">
                    {inProgressOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {inProgressOrders.map((order) => {
                    const minutesElapsed = getElapsedMinutes(order.tanggal);
                    return (
                      <motion.div
                        layout
                        key={order.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="border border-blue-200 bg-blue-50/20 p-4 rounded-none transition shadow-neo-sm hover:shadow"
                      >
                        {/* Customer & Table info */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-heading font-extrabold text-sm text-coffee-dark block">
                              Meja {order.meja}
                            </span>
                            <span className="text-xs text-coffee-brown/80 font-semibold">
                              {order.nama}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded block mb-1">
                              {order.shortId}
                            </span>
                            <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-1">
                              ⏱️ {minutesElapsed} m
                            </span>
                          </div>
                        </div>

                        {/* Items ordered list */}
                        <div className="space-y-1.5 text-xs text-coffee-brown border-t border-b border-blue-200/50 py-2 my-2">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-start"
                            >
                              <span>
                                <span className="font-bold text-coffee-dark">
                                  {it.quantity}x
                                </span>{" "}
                                {it.name}
                                <div className="text-[9px] text-gray-400 mt-0.5">
                                  {it.customization.ukuran !== "Regular" &&
                                    `[${it.customization.ukuran}] `}
                                  {it.customization.suhu !== "Tidak Berlaku" &&
                                    `${it.customization.suhu} `}
                                  {it.customization.manis !== "Tidak Berlaku" &&
                                    `- ${it.customization.manis}`}
                                  {it.customization.catatan &&
                                    ` | "${it.customization.catatan}"`}
                                </div>
                              </span>
                              <span className="font-semibold text-coffee-dark">
                                {formatRupiah(it.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total bill & actions */}
                        <div className="flex justify-between items-center text-xs mt-3">
                          <span className="font-bold text-coffee-dark">
                            Total:{" "}
                            <span className="text-coffee-amber">
                              {formatRupiah(order.total)}
                            </span>
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "Selesai")
                            }
                            className="py-1.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-none transition hover:bg-emerald-700"
                          >
                            Selesai & Sajikan
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  {inProgressOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      Tidak ada pesanan sedang dibuat.
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 3: SELESAI (Completed) */}
              <div className="bg-white border-2 border-coffee-dark rounded-none p-4 shadow-neo-sm min-h-[500px] flex flex-col">
                <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-coffee-dark pb-3">
                  <h4 className="font-heading font-bold text-coffee-dark flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-none"></span>{" "}
                    Selesai / Disajikan
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-none">
                    {completedOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {completedOrders.map((order) => (
                    <motion.div
                      layout
                      key={order.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="border border-emerald-200 bg-emerald-50/10 p-4 rounded-none transition shadow-neo-sm hover:shadow"
                    >
                      {/* Customer & Table info */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-heading font-extrabold text-sm text-coffee-dark block">
                            Meja {order.meja}
                          </span>
                          <span className="text-xs text-coffee-brown/80 font-semibold">
                            {order.nama}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                          {order.shortId}
                        </span>
                      </div>

                      {/* Items summary */}
                      <div className="text-xs text-coffee-brown border-t border-b border-emerald-200/50 py-2 my-2 space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              <span className="font-bold text-coffee-dark">
                                {it.quantity}x
                              </span>{" "}
                              {it.name}
                            </span>
                            <span>{formatRupiah(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Payment manual confirmation trigger */}
                      <div className="flex justify-between items-center text-xs mt-3 flex-wrap gap-2">
                        <span className="font-bold text-coffee-dark">
                          Total:{" "}
                          <span className="text-coffee-amber">
                            {formatRupiah(order.total)}
                          </span>
                        </span>

                        {order.pembayaran === "Selesai" ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-none flex items-center gap-1">
                            <FaCheckCircle /> Lunas
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConfirmPayment(order.id)}
                            className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-none transition shadow-neo-sm flex items-center gap-1"
                          >
                            Konfirmasi Lunas
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {completedOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      Belum ada pesanan disajikan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: MENU MANAGEMENT (CRUD) --- */}
        {activeTab === "menu" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-extrabold text-2xl text-coffee-dark">
                  Kelola Menu Makanan & Minuman
                </h3>
                <p className="text-xs text-coffee-brown mt-0.5">
                  Tambah, edit, hapus, atau atur ketersediaan menu Kopi
                  Nusantara.
                </p>
              </div>
              <button
                onClick={handleOpenAddMenu}
                className="py-3 px-5 bg-coffee-dark hover:bg-coffee-amber text-white rounded-none font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow"
              >
                <FaPlus /> Tambah Menu Baru
              </button>
            </div>

            {/* Menu List Table */}
            <div className="overflow-hidden rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-coffee-dark text-coffee-brown font-bold">
                      <th className="py-3 px-3">Ikon</th>
                      <th className="py-3 px-3">Nama Menu</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Deskripsi</th>
                      <th className="py-3 px-3 text-right">Harga</th>
                      <th className="py-3 px-3 text-center">Status Stok</th>
                      <th className="py-3 px-3 text-center">Rekomendasi</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b-2 border-coffee-dark/40 hover:bg-coffee-soft/30 transition text-coffee-dark"
                      >
                        <td className="py-3 px-3 text-2xl shrink-0">
                          {item.icon}
                        </td>
                        <td className="py-3 px-3 font-bold">{item.name}</td>
                        <td className="py-3 px-3">
                          <span className="bg-coffee-soft text-coffee-brown px-2 py-0.5 rounded font-semibold text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td
                          className="py-3 px-3 truncate max-w-48"
                          title={item.description}
                        >
                          {item.description}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-coffee-amber">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() =>
                              toggleMenuAvailability(item.id, item.available)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[10px] font-bold transition ${item.available !== false
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                          >
                            {item.available !== false ? (
                              <>💡 Tersedia</>
                            ) : (
                              <>❌ Habis</>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() =>
                              toggleMenuRecommendation(
                                item.id,
                                item.recommended,
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[10px] font-bold transition ${item.recommended === true
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                          >
                            {item.recommended === true ? (
                              <>⭐ Tampil</>
                            ) : (
                              <>☆ Tidak</>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleOpenEditMenu(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-none transition"
                              title="Edit Menu"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMenu(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-none transition"
                              title="Hapus Menu"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {menuItems.length === 0 && (
                      <tr>
                        <td
                          colSpan="8"
                          className="text-center py-8 text-gray-400"
                        >
                          Daftar menu kosong.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: RECOMMENDATION MANAGEMENT --- */}
        {activeTab === "recommendations" && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="font-heading font-extrabold text-2xl text-coffee-dark">
                Kelola Rekomendasi Hari Ini
              </h3>
              <p className="text-xs text-coffee-brown mt-0.5">
                Pilih menu yang ingin tampil pada bagian “Rekomendasi Hari Ini”
                di halaman pelanggan.
              </p>
            </div>

            <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      toggleMenuRecommendation(item.id, item.recommended)
                    }
                    className={`text-left rounded-none border p-5 transition hover:-translate-y-1 ${item.recommended === true
                        ? "border-coffee-amber bg-neo-yellow shadow-neo-sm"
                        : "border-coffee-cream bg-white hover:border-coffee-amber/40"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-none bg-coffee-soft text-2xl">
                        {item.icon}
                      </span>
                      <span
                        className={`rounded-none px-3 py-1 text-[10px] font-bold ${item.recommended === true
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {item.recommended === true
                          ? "⭐ Direkomendasikan"
                          : "Tidak tampil"}
                      </span>
                    </div>
                    <h4 className="mt-4 font-heading text-xl font-bold text-coffee-dark">
                      {item.name}
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-coffee-brown min-h-10">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t-2 border-coffee-dark pt-3">
                      <span className="text-xs font-bold text-coffee-brown">
                        {item.category}
                      </span>
                      <span className="font-heading font-extrabold text-coffee-amber">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {menuItems.filter((item) => item.recommended === true).length ===
                0 && (
                  <p className="mt-5 rounded-none bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                    Belum ada menu rekomendasi. Klik salah satu menu agar tampil
                    di halaman pelanggan.
                  </p>
                )}
            </div>
          </div>
        )}

        {/* --- TAB: FINANCIAL REPORTS & EXPENSES --- */}
        {activeTab === "financial" && (
          <div className="grid gap-5 sm:gap-8 lg:grid-cols-3">
            {/* Input expense manually */}
            <div className="h-fit rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6 lg:col-span-1">
              <h3 className="font-heading font-extrabold text-xl text-coffee-dark mb-4">
                Catat Pengeluaran Kafe
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-coffee-dark mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.tanggal}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        tanggal: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs focus:outline-none focus:border-coffee-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-dark mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={expenseForm.kategori}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        kategori: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs focus:outline-none focus:border-coffee-amber"
                  >
                    <option>Bahan Baku</option>
                    <option>Gaji Staf</option>
                    <option>Listrik & Air</option>
                    <option>Operasional</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-dark mb-1">
                    Keterangan / Deskripsi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Beli Biji Kopi Gayo 5kg"
                    value={expenseForm.deskripsi}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        deskripsi: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs focus:outline-none focus:border-coffee-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-dark mb-1">
                    Jumlah Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="750000"
                    value={expenseForm.jumlah}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, jumlah: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs focus:outline-none focus:border-coffee-amber"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-coffee-dark hover:bg-coffee-amber text-white rounded-none font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
                >
                  <FaPlusCircle /> Simpan Pengeluaran
                </button>
              </form>
            </div>

            {/* General Ledger & Download reports */}
            <div className="space-y-4 sm:space-y-6 lg:col-span-2">
              {/* Export Panel widget */}
              <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
                <h3 className="font-heading font-extrabold text-xl text-coffee-dark mb-4 flex items-center gap-2">
                  <FaFileExcel className="text-emerald-600" /> Ekspor Laporan
                  Keuangan ke Excel
                </h3>
                <p className="text-xs text-coffee-brown mb-5">
                  Unduh ringkasan data transaksi kasir dan pengeluaran
                  operasional ke dalam format Excel (.csv semicolon).
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex gap-2">
                    {["today", "month", "all"].map((rng) => (
                      <button
                        key={rng}
                        onClick={() => setExportRange(rng)}
                        className={`px-3 py-2 rounded-none text-xs font-bold transition border ${exportRange === rng
                            ? "bg-coffee-dark border-coffee-dark text-white shadow-neo-sm"
                            : "bg-white border-coffee-cream text-coffee-brown hover:bg-coffee-soft"
                          }`}
                      >
                        {rng === "today"
                          ? "Hari Ini"
                          : rng === "month"
                            ? "Bulan Ini"
                            : "Semua Data"}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleExportFinancial}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-bold text-xs transition flex items-center gap-2 shadow"
                  >
                    <FaFileExcel /> Unduh File Excel (.csv)
                  </button>
                </div>
              </div>

              {/* Ledger list of expenses & incomes */}
              <div className="rounded-none border-2 border-coffee-dark bg-white p-4 shadow-neo-sm sm:p-6">
                <h3 className="font-heading font-extrabold text-xl text-coffee-dark mb-4">
                  Buku Kas & Pengeluaran
                </h3>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
                  <table className="min-w-[720px] w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-coffee-dark text-coffee-brown font-bold">
                        <th className="py-2.5 px-2">Tanggal</th>
                        <th className="py-2.5 px-2">Kategori</th>
                        <th className="py-2.5 px-2">Keterangan</th>
                        <th className="py-2.5 px-2 text-right">Pemasukan</th>
                        <th className="py-2.5 px-2 text-right">Pengeluaran</th>
                        <th className="py-2.5 px-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Chronological order */}
                      {[
                        ...orders
                          .filter((o) => o.status === "Selesai")
                          .map((o) => ({
                            id: o.id,
                            tanggal: o.tanggal.slice(0, 10),
                            kategori: "Penjualan",
                            deskripsi: `Pemesanan Meja ${o.meja} (${o.nama})`,
                            masuk: o.total,
                            keluar: 0,
                            isOrder: true,
                          })),
                        ...expenses.map((e) => ({
                          id: e.id,
                          tanggal: e.tanggal,
                          kategori: e.kategori,
                          deskripsi: e.deskripsi,
                          masuk: 0,
                          keluar: e.jumlah,
                          isOrder: false,
                        })),
                      ]
                        .sort(
                          (a, b) => new Date(b.tanggal) - new Date(a.tanggal),
                        ) // Newest first
                        .map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b-2 border-coffee-dark/40 hover:bg-coffee-soft/30 transition text-coffee-dark"
                          >
                            <td className="py-2.5 px-2 font-semibold">
                              {new Date(row.tanggal).toLocaleDateString(
                                "id-ID",
                                { day: "numeric", month: "short" },
                              )}
                            </td>
                            <td className="py-2.5 px-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.isOrder
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {row.kategori}
                              </span>
                            </td>
                            <td
                              className="py-2.5 px-2 truncate max-w-40"
                              title={row.deskripsi}
                            >
                              {row.deskripsi}
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-emerald-600">
                              {row.masuk > 0 ? formatRupiah(row.masuk) : "-"}
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-red-600">
                              {row.keluar > 0 ? formatRupiah(row.keluar) : "-"}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {!row.isOrder ? (
                                <button
                                  onClick={() => handleDeleteExpense(row.id)}
                                  className="text-red-500 hover:bg-red-50 p-1 rounded transition"
                                  title="Hapus Pengeluaran"
                                >
                                  <FaTrash size={11} />
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">
                                  Auto
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {orders.filter((o) => o.status === "Selesai").length ===
                        0 &&
                        expenses.length === 0 && (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center py-6 text-gray-400"
                            >
                              Belum ada pencatatan kas.
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- CRUD MODAL DIALOG --- */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-h-[92svh] w-full max-w-md overflow-hidden rounded-none border-2 border-coffee-dark bg-white shadow-neo-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b-2 border-coffee-dark bg-coffee-soft p-4 sm:p-6">
                <h3 className="font-heading text-lg font-bold text-coffee-dark flex items-center gap-2">
                  <FaCoffee />{" "}
                  {editingMenuItem ? "Edit Detail Menu" : "Tambah Menu Baru"}
                </h3>
                <button
                  onClick={() => setIsMenuModalOpen(false)}
                  className="w-8 h-8 rounded-none bg-white text-coffee-brown font-bold text-sm flex items-center justify-center hover:bg-coffee-cream shadow-neo-sm"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveMenu} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-coffee-dark mb-1">
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Kopi Luwak"
                    value={menuForm.name}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs focus:outline-none focus:border-coffee-amber"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-coffee-dark mb-1">
                      Kategori
                    </label>
                    <select
                      value={menuForm.category}
                      onChange={(e) =>
                        setMenuForm({ ...menuForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs bg-white focus:outline-none focus:border-coffee-amber"
                    >
                      <option>Kopi Panas</option>
                      <option>Kopi Dingin</option>
                      <option>Non-Kopi</option>
                      <option>Makanan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-coffee-dark mb-1">
                      Ikon Emoji
                    </label>
                    <select
                      value={menuForm.icon}
                      onChange={(e) =>
                        setMenuForm({ ...menuForm, icon: e.target.value })
                      }
                      className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs bg-white focus:outline-none focus:border-coffee-amber"
                    >
                      <option>☕</option>
                      <option>🧊</option>
                      <option>🍵</option>
                      <option>🥛</option>
                      <option>🧋</option>
                      <option>🫖</option>
                      <option>🥤</option>
                      <option>🥐</option>
                      <option>🍞</option>
                      <option>🍌</option>
                      <option>🍰</option>
                      <option>🍪</option>
                      <option>🍛</option>
                      <option>🥪</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-dark mb-1">
                    Harga Menu (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="35000"
                    value={menuForm.price}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-coffee-dark rounded-none text-xs focus:outline-none focus:border-coffee-amber"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coffee-dark mb-1">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    required
                    placeholder="Deskripsi cita rasa..."
                    value={menuForm.description}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, description: e.target.value })
                    }
                    className="w-full border-2 border-coffee-dark p-3 rounded-none text-xs focus:outline-none focus:border-coffee-amber resize-none h-20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="menu-available"
                    checked={menuForm.available}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, available: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-coffee-amber focus:ring-coffee-amber border-coffee-cream"
                  />
                  <label
                    htmlFor="menu-available"
                    className="text-xs font-bold text-coffee-dark"
                  >
                    Tersedia / Dapat dipesan pelanggan
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="menu-recommended"
                    checked={menuForm.recommended}
                    onChange={(e) =>
                      setMenuForm({
                        ...menuForm,
                        recommended: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-coffee-amber focus:ring-coffee-amber border-coffee-cream"
                  />
                  <label
                    htmlFor="menu-recommended"
                    className="text-xs font-bold text-coffee-dark"
                  >
                    Tampilkan di Rekomendasi Hari Ini
                  </label>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-coffee-dark mt-6">
                  <button
                    type="button"
                    onClick={() => setIsMenuModalOpen(false)}
                    className="flex-1 py-2.5 border-2 border-coffee-dark text-coffee-brown rounded-none font-bold text-xs transition hover:bg-coffee-soft"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-coffee-dark text-white rounded-none font-bold text-xs transition hover:bg-coffee-amber"
                  >
                    Simpan Menu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;
