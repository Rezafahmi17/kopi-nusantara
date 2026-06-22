import { motion } from "framer-motion";
import { FaMugHot, FaUsers, FaAward } from "react-icons/fa";

const aboutImage =
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=85";

const stats = [
  { icon: <FaMugHot />, value: "50+", label: "Menu" },
  { icon: <FaAward />, value: "8", label: "Tahun Berpengalaman" },
  { icon: <FaUsers />, value: "10rb+", label: "Pelanggan" },
];

function About() {
  return (
    <section id="about" className="section-padding py-16 sm:py-28">
      <div className="container-max grid items-center gap-9 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75 }}
          className="relative"
        >
          <div className="absolute -left-2 -top-2 h-20 w-20 border-2 border-coffee-dark bg-neo-pink shadow-neo sm:-left-5 sm:-top-5 sm:h-32 sm:w-32" />
          <img
            src={aboutImage}
            alt="Barista menyiapkan kopi"
            className="relative h-72 w-full border-2 border-coffee-dark object-cover shadow-neo-lg sm:h-[430px]"
          />
          <div className="absolute bottom-4 left-4 rotate-[-2deg] border-2 border-coffee-dark bg-neo-yellow p-3 shadow-neo sm:bottom-6 sm:left-6 sm:p-5">
            <p className="font-heading text-2xl font-black text-coffee-dark sm:text-3xl">
              Sejak 2026
            </p>
            <p className="text-xs font-black uppercase tracking-wide text-coffee-dark sm:text-sm">
              Racikan lokal berkualitas
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75 }}
        >
          <p className="neo-tag mb-5 w-fit bg-neo-blue">Tentang Kami</p>
          <h2 className="neo-section-title">
            Dari biji kopi lokal pilihan menjadi citarasa yang beda.
          </h2>
          <p className="mt-5 border-2 border-coffee-dark bg-white p-4 text-sm font-semibold leading-7 shadow-neo-sm sm:mt-6 sm:p-5 sm:text-base sm:leading-8">
            Kopi Nusantara berdiri pada tahun 2026 dengan misi menghadirkan kopi
            lokal Indonesia ke dalam pengalaman cafe modern. Kami memilih biji
            kopi dari Aceh Gayo dan Toraja, lalu meraciknya dengan teknik yang
            menjaga karakter asli setiap daerah.
          </p>
          <p className="mt-4 border-2 border-coffee-dark bg-neo-green p-4 text-sm font-semibold leading-7 shadow-neo-sm sm:p-5 sm:text-base sm:leading-8">
            Setiap cangkir dibuat untuk menghadirkan suasana hangat, aroma khas,
            dan rasa yang nyaman dinikmati dari pagi hingga malam.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                className="neo-card p-5 text-center"
              >
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center border-2 border-coffee-dark bg-coffee-amber text-xl text-coffee-dark shadow-neo-sm">
                  {stat.icon}
                </div>
                <h3 className="font-heading text-3xl font-black">
                  {stat.value}
                </h3>
                <p className="mt-1 text-sm font-black uppercase text-coffee-brown">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default About;
