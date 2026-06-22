import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categories } from "../data/menuData";
import { getMenuSync } from "../utils/storage";

const cardColors = ["bg-white", "bg-neo-yellow", "bg-neo-blue", "bg-neo-pink", "bg-neo-green"];

function Menu() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const loadMenu = async () => {
      setMenuItems(await getMenuSync());
    };

    loadMenu();
    const interval = setInterval(loadMenu, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    if (typeof price === "number") return `Rp ${price.toLocaleString("id-ID")}`;
    return price;
  };

  const filteredMenu = useMemo(() => {
    const visibleMenu = menuItems.filter((item) => item.available !== false);
    if (activeCategory === "Semua") return visibleMenu;
    return visibleMenu.filter((item) => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  return (
    <section id="menu" className="section-padding bg-coffee-cream py-16 sm:py-28">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="neo-tag mx-auto mb-5 w-fit bg-neo-pink">Menu Kopi Nusantara</p>
          <h2 className="neo-section-title">
            Pilihan rasa untuk setiap suasana.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl border-2 border-coffee-dark bg-white p-4 text-sm font-semibold leading-7 shadow-neo-sm sm:text-base sm:leading-8">
            Menu kopi panas, kopi dingin, non-kopi, hingga makanan pendamping
            dengan bahan pilihan terbaik.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 flex gap-3 overflow-x-auto pb-2 sm:mt-10 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 no-scrollbar"
        >
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 border-2 border-coffee-dark px-4 py-3 text-xs font-black uppercase shadow-neo-sm transition hover:-translate-y-1 hover:shadow-neo sm:px-5 sm:text-sm ${
                activeCategory === category
                  ? "bg-coffee-dark text-white"
                  : index % 2 === 0
                    ? "bg-white text-coffee-dark"
                    : "bg-neo-yellow text-coffee-dark"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        <motion.div layout className="mt-9 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item, index) => (
              <motion.article
                layout
                key={item.id}
                initial={{ opacity: 0, y: 35, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.35, delay: index * 0.025 }}
                whileHover={{ y: -6, rotate: index % 2 === 0 ? -1 : 1 }}
                className={`group border-2 border-coffee-dark p-4 shadow-neo-lg transition sm:p-6 ${cardColors[index % cardColors.length]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center border-2 border-coffee-dark bg-white text-2xl shadow-neo-sm transition group-hover:rotate-6 sm:h-16 sm:w-16 sm:text-3xl">
                    {item.icon}
                  </span>
                  <span className="border-2 border-coffee-dark bg-coffee-dark px-2 py-1 text-[10px] font-black uppercase text-white shadow-neo-sm sm:px-3 sm:text-xs">
                    {item.category}
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-xl font-black uppercase leading-tight text-coffee-dark sm:mt-5 sm:text-2xl">
                  {item.name}
                </h3>
                <p className="mt-3 min-h-0 border-l-4 border-coffee-dark pl-3 text-sm font-semibold leading-6 text-coffee-brown sm:min-h-14 sm:text-base sm:leading-7">
                  {item.description}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-coffee-dark pt-4 sm:mt-6 sm:pt-5">
                  <span className="font-heading text-xl font-black text-coffee-dark sm:text-2xl">
                    {formatPrice(item.price)}
                  </span>
                  <button 
                    onClick={() => setSelectedItem(item)}
                    className="shrink-0 border-2 border-coffee-dark bg-white px-3 py-2 text-xs font-black text-coffee-dark shadow-neo-sm transition hover:-translate-y-1 hover:bg-coffee-dark hover:text-white sm:px-4 sm:text-sm">
                    Detail
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Modal Detail */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="absolute inset-0 bg-coffee-dark/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative z-10 w-full max-w-md border-4 border-coffee-dark bg-white p-6 shadow-neo-xl sm:p-8"
              >
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center border-2 border-coffee-dark bg-neo-pink text-xl font-black text-coffee-dark shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  X
                </button>
                
                <div className="mb-6 flex items-center gap-4">
                  <span className="grid h-20 w-20 shrink-0 place-items-center border-2 border-coffee-dark bg-neo-yellow text-4xl shadow-neo">
                    {selectedItem.icon}
                  </span>
                  <div>
                    <span className="mb-2 inline-block border-2 border-coffee-dark bg-coffee-dark px-3 py-1 text-xs font-black uppercase text-white shadow-neo-sm">
                      {selectedItem.category}
                    </span>
                    <h3 className="font-heading text-2xl font-black uppercase leading-tight text-coffee-dark">
                      {selectedItem.name}
                    </h3>
                  </div>
                </div>
                
                <div className="mb-6 border-l-4 border-neo-blue pl-4">
                  <h4 className="mb-1 font-bold uppercase text-coffee-dark">Keterangan:</h4>
                  <p className="text-base font-semibold leading-relaxed text-coffee-brown">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t-4 border-coffee-dark pt-5">
                  <span className="font-heading text-3xl font-black text-coffee-dark">
                    {formatPrice(selectedItem.price)}
                  </span>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="border-2 border-coffee-dark bg-neo-green px-6 py-2 font-black uppercase text-coffee-dark shadow-neo-sm transition hover:-translate-y-1 hover:shadow-neo"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}

export default Menu;
