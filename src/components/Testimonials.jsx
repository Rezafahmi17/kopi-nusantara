import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Raka Pratama",
    job: "Creative Designer",
    avatar: "https://i.pravatar.cc/120?img=12",
    text: "Tempatnya nyaman banget buat kerja. Kopi Torajanya kuat, aromanya khas, dan pelayanan cepat.",
  },
  {
    name: "Maya Salsabila",
    job: "Food Blogger",
    avatar: "https://i.pravatar.cc/120?img=47",
    text: "Es Kopi Susunya balance, tidak terlalu manis. Croissant butter-nya juga wajib dicoba.",
  },
  {
    name: "Dimas Arya",
    job: "Entrepreneur",
    avatar: "https://i.pravatar.cc/120?img=33",
    text: "Cafe premium dengan harga masih masuk akal. Cocok untuk meeting santai dan ngobrol lama.",
  },
];

function Testimonials() {
  return (
    <section className="section-padding bg-coffee-dark py-24 text-white sm:py-28">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-3 font-bold uppercase tracking-[0.28em] text-coffee-amber">
            Testimonial
          </p>
          <h2 className="font-heading text-4xl font-extrabold sm:text-5xl">
            Apa Kata Pelanggan Kami?
          </h2>
          <p className="mt-5 leading-8 text-white/75">
            Review hangat dari pelanggan yang menikmati suasana dan rasa Kopi
            Nusantara.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.12 }}
              whileHover={{ y: -8 }}
              className="rounded-none border-2 border-coffee-dark bg-white p-7 shadow-neo-lg backdrop-blur transition"
            >
              <div className="text-xl tracking-widest text-coffee-amber">
                ★★★★★
              </div>
              <p className="mt-5 leading-8 text-white/82">“{item.text}”</p>
              <div className="mt-8 flex items-center gap-4">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="h-14 w-14 rounded-none border-2 border-coffee-amber object-cover"
                />
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-sm text-white/65">{item.job}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
