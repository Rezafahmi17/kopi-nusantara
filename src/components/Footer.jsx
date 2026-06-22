import { FaInstagram, FaMugHot, FaTiktok, FaWhatsapp } from "react-icons/fa";

const links = ["Home", "Menu", "About", "Contact"];

function Footer() {
  const scrollTo = (link) => {
    const targetId = link === "Home" ? "home" : link.toLowerCase();
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="section-padding border-t-2 border-coffee-dark bg-coffee-dark py-12 text-white">
      <div className="container-max grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center border-2 border-white bg-neo-yellow text-xl text-coffee-dark shadow-neo-sm">
              <FaMugHot />
            </span>
            <span className="font-heading text-2xl font-black uppercase">
              Kopi Nusantara
            </span>
          </div>
          <p className="mt-4 max-w-md border-l-4 border-neo-yellow pl-4 font-semibold leading-8 text-white/80">
            Tagline kami: satu cangkir, banyak cerita Nusantara. Menghadirkan
            kopi lokal dengan rasa premium dan suasana hangat.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-black uppercase tracking-[0.22em] text-neo-yellow">
            Navigasi
          </h3>
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <button key={link} onClick={() => scrollTo(link)} className="w-fit font-bold text-white/80 transition hover:text-neo-yellow">
                {link}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-black uppercase tracking-[0.22em] text-neo-yellow">
            Sosial Media
          </h3>
          <div className="flex gap-3">
            <a href="https://www.instagram.com/rezafmdni?igsh=MXNxbzdkbmQxdHU2cQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center border-2 border-white bg-neo-pink text-xl text-coffee-dark shadow-neo-sm transition hover:-translate-y-1">
              <FaInstagram />
            </a>
            <a href="https://www.tiktok.com/@alkhamdaniii?_r=1&_t=ZS-97MFSbP3Cy2" target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center border-2 border-white bg-neo-blue text-xl text-coffee-dark shadow-neo-sm transition hover:-translate-y-1">
              <FaTiktok />
            </a>
            <a href="https://wa.me/6281278734115" target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center border-2 border-white bg-neo-green text-xl text-coffee-dark shadow-neo-sm transition hover:-translate-y-1">
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      <div className="container-max mt-10 border-t-2 border-white pt-6 text-center text-sm font-bold text-white/65">
        Copyright © 2026 Kopi Nusantara. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
