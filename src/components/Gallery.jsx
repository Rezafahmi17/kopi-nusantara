import { motion, useScroll, useTransform } from "framer-motion";

const images = [
  {
    src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85",
    caption: "Signature latte art",
    depth: [-50, 70],
  },
  {
    src: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=85",
    caption: "Manual brew pilihan",
    depth: [40, -70],
  },
  {
    src: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85",
    caption: "Biji kopi lokal",
    depth: [-30, 55],
  },
  {
    src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=85",
    caption: "Suasana cafe hangat",
    depth: [55, -45],
  },
];

const colors = ["bg-neo-yellow", "bg-neo-pink", "bg-neo-blue", "bg-neo-green"];

function GalleryCard({ item, index }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], item.depth);

  return (
    <motion.div
      style={{ y }}
      initial={{ opacity: 0, y: 55 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.65, delay: index * 0.08 }}
      className={`group relative border-2 border-coffee-dark p-3 shadow-neo-lg ${colors[index % colors.length]} ${index === 0 || index === 3 ? "lg:row-span-2" : ""}`}
    >
      <img
        src={item.src}
        alt={item.caption}
        className="h-64 w-full border-2 border-coffee-dark object-cover transition duration-500 group-hover:scale-[1.02] sm:h-80 lg:h-full"
      />
      <div className="absolute inset-x-4 bottom-4 border-2 border-coffee-dark bg-white p-3 text-coffee-dark shadow-neo-sm transition duration-300 group-hover:-translate-y-1 sm:inset-x-6 sm:bottom-6 sm:p-4">
        <p className="font-heading text-lg font-black uppercase leading-tight sm:text-xl">
          {item.caption}
        </p>
        <p className="mt-1 text-xs font-bold text-coffee-brown">
          Detail rasa, visual kuat, dan suasana yang memorable.
        </p>
      </div>
    </motion.div>
  );
}

function Gallery() {
  return (
    <section className="section-padding py-16 sm:py-28">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-9 flex flex-col justify-between gap-5 sm:mb-12 lg:flex-row lg:items-end"
        >
          <div>
            <p className="neo-tag mb-5 w-fit bg-neo-green">Gallery</p>
            <h2 className="neo-section-title max-w-2xl">
              Visual hangat, rasa yang melekat.
            </h2>
          </div>
          <p className="max-w-xl border-2 border-coffee-dark bg-white p-4 text-sm font-semibold leading-7 shadow-neo-sm sm:p-5 sm:text-base sm:leading-8">
            Nikmati nuansa premium dari bar, manual brew, hingga area cafe yang
            nyaman untuk bekerja, bertemu teman, atau menikmati waktu sendiri.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:auto-rows-[260px] sm:gap-8 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[230px]">
          {images.map((item, index) => (
            <GalleryCard key={item.caption} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;
