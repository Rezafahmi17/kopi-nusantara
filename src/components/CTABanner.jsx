import { motion, useScroll, useTransform } from "framer-motion";
import { FaMapMarkerAlt, FaClock, FaWhatsapp, FaQrcode } from "react-icons/fa";

const bgImage =
  "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1800&q=85";

function CTABanner() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [-80, 90]);

  return (
    <section id="contact" className="section-padding relative overflow-hidden py-16 sm:py-28">
      <motion.div style={{ y }} className="absolute inset-0 scale-110 bg-cover bg-center" aria-hidden="true">
        <div className="h-full w-full bg-cover bg-center grayscale" style={{ backgroundImage: `url(${bgImage})` }} />
      </motion.div>
      <div className="absolute inset-0 bg-neo-yellow/85" />
      <div className="absolute inset-0 brutal-dots opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="container-max relative z-10 border-2 border-coffee-dark bg-white p-5 text-center text-coffee-dark shadow-neo-xl sm:p-8 md:p-12"
      >
        <p className="neo-tag mx-auto mb-5 w-fit bg-neo-pink">Datang & Nikmati</p>
        <h2 className="font-heading text-3xl font-black uppercase leading-tight sm:text-6xl">
          Kunjungi kami hari ini.
        </h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
          <div className="border-2 border-coffee-dark bg-neo-blue p-4 shadow-neo-sm sm:p-5">
            <FaMapMarkerAlt className="mx-auto mb-3 text-2xl text-coffee-dark" />
            <p className="font-black">Jl. Sukarno Hatta No. 10, Bandar Lampung</p>
          </div>
          <div className="border-2 border-coffee-dark bg-neo-green p-4 shadow-neo-sm sm:p-5">
            <FaClock className="mx-auto mb-3 text-2xl text-coffee-dark" />
            <p className="font-black">Senin–Minggu 07.00–24.00</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:gap-4">
          <button onClick={() => (window.location.hash = "#qr-simulator")} className="neo-button bg-coffee-amber px-8 py-4 cursor-pointer">
            <FaQrcode /> Pemesanan QR
          </button>
          <a href="https://wa.me/6281278734115" target="_blank" rel="noreferrer" className="neo-button-dark px-8 py-4">
            <FaWhatsapp /> Hubungi Kami
          </a>
        </div>
      </motion.div>
    </section>
  );
}

export default CTABanner;
