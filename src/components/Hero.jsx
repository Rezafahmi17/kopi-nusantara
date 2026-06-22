import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowDown } from "react-icons/fi";
import { FaBolt, FaCoffee, FaQrcode } from "react-icons/fa";

const heroImage =
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1800&q=85";

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, 180]);
  const opacity = useTransform(scrollY, [0, 520], [1, 0.35]);

  return (
    <section
      id="home"
      className="section-padding relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-28 text-coffee-dark sm:pt-32"
    >
      <motion.div
        style={{ y, opacity }}
        className="absolute right-[-12rem] top-20 hidden h-[34rem] w-[34rem] rotate-6 border-2 border-coffee-dark bg-white p-4 shadow-neo-xl lg:block"
        aria-hidden="true"
      >
        <div
          className="h-full w-full border-2 border-coffee-dark bg-cover bg-center grayscale-[20%]"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
      </motion.div>

      <div className="absolute left-5 top-28 hidden h-20 w-20 rotate-12 border-2 border-coffee-dark bg-neo-pink shadow-neo md:block" />
      <div className="absolute bottom-24 right-14 hidden h-24 w-24 -rotate-12 border-2 border-coffee-dark bg-neo-blue shadow-neo md:block" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-coffee-soft to-transparent" />

      <div className="container-max relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_0.72fr]">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="neo-tag mb-6 rotate-[-1deg]"
          >
            <FaBolt /> Local Coffee · Maximum Flavor
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="font-heading text-[2.55rem] font-black uppercase leading-[0.95] tracking-[-0.055em] text-balance min-[390px]:text-5xl sm:text-7xl lg:text-8xl"
          >
            Kopi lokal, tampilan brutal, rasa maksimal.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2 }}
            className="mt-6 max-w-2xl border-2 border-coffee-dark bg-white px-4 py-4 text-sm font-semibold leading-7 shadow-neo-sm sm:border-l-4 sm:px-5 sm:text-lg sm:leading-8"
          >
            Nikmati racikan kopi lokal Aceh Gayo dan Toraja.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3 }}
            className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          >
            <a href="#menu" className="neo-button bg-neo-yellow px-8 py-4">
              <FaCoffee /> Lihat Menu
            </a>
            <button
              onClick={() => (window.location.hash = "#qr-simulator")}
              className="neo-button-dark px-8 py-4"
            >
              <FaQrcode /> QR Order
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, rotate: 5, y: 30 }}
          animate={{ opacity: 1, rotate: -2, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative mx-auto w-full max-w-sm border-2 border-coffee-dark bg-neo-orange p-3 shadow-neo-xl sm:p-5 lg:hidden"
        >
          <img
            src={heroImage}
            alt="Kopi Nusantara"
            className="h-56 w-full border-2 border-coffee-dark object-cover sm:h-72"
          />
          <div className="absolute -bottom-4 left-3 border-2 border-coffee-dark bg-neo-yellow px-4 py-2 font-heading text-xl font-black shadow-neo sm:-left-5 sm:px-5 sm:py-3 sm:text-2xl">
            FRESH ☕
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 z-20 grid h-12 w-12 -translate-x-1/2 place-items-center border-2 border-coffee-dark bg-white p-3 text-2xl shadow-neo-sm"
        aria-label="Scroll ke bagian about"
      >
        <FiArrowDown />
      </motion.a>
    </section>
  );
}

export default Hero;
