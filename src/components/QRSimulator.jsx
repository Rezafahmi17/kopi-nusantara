import { motion } from "framer-motion";
import { FaQrcode, FaPrint, FaCoffee, FaArrowLeft } from "react-icons/fa";

const TABLES = [1, 2, 3, 4, 5];
const tableColors = ["bg-neo-yellow", "bg-neo-blue", "bg-neo-pink", "bg-neo-green", "bg-coffee-amber"];

function QRSimulator() {
  const getTableUrl = (tableNum) => {
    const origin = window.location.origin + window.location.pathname;
    return `${origin}#meja=${tableNum}`;
  };

  const getQRImageUrl = (tableNum) => {
    const url = getTableUrl(tableNum);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&color=111111&bgcolor=FFF3D8`;
  };

  const handlePrint = (tableNum) => {
    const printWindow = window.open("", "_blank");
    const qrUrl = getQRImageUrl(tableNum);
    const tableUrl = getTableUrl(tableNum);

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak QR Meja ${tableNum} - Kopi Nusantara</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
              color: #111111;
              background-color: #FFF3D8;
            }
            .card {
              border: 4px solid #111111;
              padding: 30px;
              max-width: 350px;
              margin: 0 auto;
              background: #FFE14D;
              box-shadow: 12px 12px 0 #111111;
            }
            .logo { font-size: 24px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; }
            .subtitle { font-size: 12px; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; }
            .qr-code { margin: 20px 0; border: 4px solid #111111; padding: 10px; display: inline-block; background: white; }
            .table-num { font-size: 32px; font-weight: 900; margin: 15px 0 5px 0; }
            .instructions { font-size: 12px; margin-top: 20px; line-height: 1.5; font-weight: 700; }
            .url { font-size: 10px; word-break: break-all; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">☕ Kopi Nusantara</div>
            <div class="subtitle">Silakan Pindai untuk Memesan</div>
            <div class="qr-code"><img src="${qrUrl}" alt="QR Meja ${tableNum}" width="220" height="220" /></div>
            <div class="table-num">MEJA ${tableNum}</div>
            <div class="instructions">Pindai QR Code di atas menggunakan kamera smartphone Anda untuk melihat menu digital & langsung memesan dari meja.</div>
            <div class="url">${tableUrl}</div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSimulateScan = (tableNum) => {
    window.location.hash = `meja=${tableNum}`;
  };

  return (
    <div className="min-h-screen bg-coffee-soft px-4 pb-16 pt-24 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => (window.location.hash = "")}
          className="mb-6 flex w-full items-center justify-center gap-2 border-2 border-coffee-dark bg-white px-4 py-3 text-sm font-black text-coffee-dark shadow-neo-sm transition hover:-translate-y-1 hover:bg-neo-yellow sm:mb-8 sm:w-auto sm:justify-start"
        >
          <FaArrowLeft /> Kembali ke Landing Page
        </button>

        <div className="mb-8 text-center sm:mb-12">
          <div className="neo-tag mb-5 bg-neo-blue">
            <FaQrcode /> QR Meja
          </div>
          <h1 className="neo-section-title mb-4 uppercase safe-wrap">Pemesanan Berbasis QR</h1>
          <p className="mx-auto max-w-2xl border-2 border-coffee-dark bg-white p-4 text-sm font-semibold leading-7 shadow-neo-sm sm:p-5 sm:text-base sm:leading-relaxed">
            Setiap meja di kedai <strong>Kopi Nusantara</strong> dilengkapi QR Code.
            Pelanggan memindai QR ini untuk memesan langsung tanpa perlu mengantri di kasir.
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-3xl border-2 border-coffee-dark bg-neo-yellow p-4 shadow-neo-lg sm:mb-12 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-black uppercase text-coffee-dark sm:text-xl">
            Fitur Real-Time
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-xs font-semibold leading-6 text-coffee-dark sm:text-sm">
            <li>Buka <strong>Dashboard Admin</strong> di tab baru/window lain.</li>
            <li>Klik tombol <strong>Scan QR</strong> pada salah satu meja di bawah.</li>
            <li>Pesan menu, masukkan nama, lalu selesaikan pemesanan.</li>
            <li>Pesanan akan muncul real-time di admin disertai notifikasi suara.</li>
          </ol>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-5">
          {TABLES.map((tableNum, index) => (
            <motion.div
              key={tableNum}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: tableNum * 0.08 }}
              className={`group relative flex w-full flex-col items-center border-2 border-coffee-dark p-4 text-center shadow-neo-lg transition hover:-translate-y-2 sm:p-5 ${tableColors[index % tableColors.length]}`}
            >
              <div className="mb-3 flex w-full items-center justify-between">
                <span className="border-2 border-coffee-dark bg-white px-2 py-1 text-xs font-black text-coffee-dark shadow-neo-sm">
                  QR STAND
                </span>
                <span className="border-2 border-coffee-dark bg-coffee-dark px-2 py-1 text-xs font-black text-white">
                  ID: MEJA-0{tableNum}
                </span>
              </div>

              <div className="mb-4 flex h-14 w-14 items-center justify-center border-2 border-coffee-dark bg-white text-lg font-black text-coffee-dark shadow-neo-sm transition group-hover:rotate-6">
                {tableNum}
              </div>
              <h3 className="mb-1 font-heading text-xl font-black uppercase text-coffee-dark">Meja {tableNum}</h3>
              <p className="mb-4 text-xs font-black uppercase text-coffee-brown">Kopi Nusantara</p>

              <div className="group/qr relative mb-5 border-2 border-coffee-dark bg-white p-2 shadow-neo-sm">
                <img src={getQRImageUrl(tableNum)} alt={`QR Meja ${tableNum}`} className="h-36 w-36 object-contain transition duration-300 group-hover/qr:scale-95 sm:h-40 sm:w-40" />
                <div className="absolute inset-0 flex items-center justify-center bg-coffee-dark/85 opacity-0 transition duration-300 group-hover/qr:opacity-100">
                  <FaQrcode className="text-3xl text-white" />
                </div>
              </div>

              <div className="mt-auto w-full space-y-3">
                <button onClick={() => handleSimulateScan(tableNum)} className="neo-button-dark w-full py-2.5 text-sm">
                  <FaCoffee /> Scan QR
                </button>
                <button onClick={() => handlePrint(tableNum)} className="neo-button w-full bg-white py-2 text-xs">
                  <FaPrint /> Cetak QR
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QRSimulator;
