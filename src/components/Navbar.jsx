import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaMugHot } from "react-icons/fa";
import { HiMenuAlt3, HiX } from "react-icons/hi";

const navLinks = [
  { name: "Portal Utama", hash: "" },
  { name: "QR Order", hash: "#qr-simulator" },
  { name: "Dashboard Admin", hash: "#admin" },
];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRouteClick = (hash) => {
    window.location.hash = hash;
    setIsOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -90 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isScrolled || window.location.hash !== "" ? "py-3" : "py-5"
        }`}
    >
      <nav className="section-padding container-max flex items-center justify-between gap-2 text-coffee-dark">
        <button
          onClick={() => handleRouteClick("")}
          className="flex min-w-0 items-center gap-2 border-2 border-coffee-dark bg-white px-2 py-2 shadow-neo-sm transition hover:-translate-y-1 hover:shadow-neo sm:gap-3 sm:px-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-coffee-dark bg-neo-yellow text-lg shadow-neo-sm sm:h-11 sm:w-11 sm:text-xl">
            <FaMugHot />
          </span>
          <span className="hidden truncate font-heading text-base font-black tracking-tight min-[360px]:inline sm:text-2xl">
            Kopi Nusantara
          </span>
        </button>

        <div className="hidden items-center gap-3 lg:flex">
          {navLinks.map((link, index) => (
            <button
              key={link.name}
              onClick={() => handleRouteClick(link.hash)}
              className={`border-2 border-coffee-dark px-4 py-3 text-xs font-black uppercase tracking-[0.18em] shadow-neo-sm transition hover:-translate-y-1 hover:shadow-neo ${index === 1
                ? "bg-neo-blue"
                : index === 2
                  ? "bg-neo-pink"
                  : "bg-white"
                }`}
            >
              {link.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleRouteClick("")}
          className="hidden border-2 border-coffee-dark bg-coffee-dark px-6 py-3 text-sm font-black text-white shadow-neo-sm transition hover:-translate-y-1 hover:bg-neo-green hover:text-coffee-dark hover:shadow-neo lg:inline-flex"
        >
          Ganti Akses
        </button>

        <button
          onClick={() => setIsOpen((value) => !value)}
          className="grid h-11 w-11 shrink-0 place-items-center border-2 border-coffee-dark bg-neo-yellow text-2xl shadow-neo-sm lg:hidden"
          aria-label="Toggle navigation"
        >
          {isOpen ? <HiX /> : <HiMenuAlt3 />}
        </button>
      </nav>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-padding mt-3 lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 border-2 border-coffee-dark bg-white p-3 text-coffee-dark shadow-neo-lg sm:p-4">
            {navLinks.map((link, index) => (
              <button
                key={link.name}
                onClick={() => handleRouteClick(link.hash)}
                className={`border-2 border-coffee-dark px-4 py-3 text-left font-black shadow-neo-sm ${index === 1
                  ? "bg-neo-blue"
                  : index === 2
                    ? "bg-neo-pink"
                    : "bg-neo-yellow"
                  }`}
              >
                {link.name}
              </button>
            ))}
            <button
              onClick={() => handleRouteClick("")}
              className="border-2 border-coffee-dark bg-coffee-dark px-4 py-3 font-black text-white shadow-neo-sm"
            >
              Ganti Akses
            </button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

export default Navbar;
