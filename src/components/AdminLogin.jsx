import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaLock, FaUser, FaCoffee, FaExclamationTriangle } from "react-icons/fa";

function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (username === "admin" && password === "kopi123") {
      onLoginSuccess();
    } else {
      setError("Username atau password salah!");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-coffee-soft px-4 py-24">
      <div className="absolute left-10 top-28 h-24 w-24 rotate-12 border-2 border-coffee-dark bg-neo-pink shadow-neo" />
      <div className="absolute bottom-20 right-10 h-28 w-28 -rotate-12 border-2 border-coffee-dark bg-neo-blue shadow-neo" />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md overflow-hidden border-2 border-coffee-dark bg-white p-8 shadow-neo-xl"
      >
        <div className="absolute right-[-2rem] top-[-2rem] h-24 w-24 border-2 border-coffee-dark bg-neo-yellow" />

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center border-2 border-coffee-dark bg-coffee-amber text-3xl text-coffee-dark shadow-neo-sm">
            <FaCoffee />
          </div>
          <h2 className="font-heading text-3xl font-black uppercase text-coffee-dark">
            Login Admin
          </h2>
          <p className="mt-2 border-2 border-coffee-dark bg-neo-yellow px-3 py-2 text-xs font-black uppercase tracking-widest text-coffee-dark shadow-neo-sm">
            Kopi Nusantara Control
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 flex items-center gap-2 border-2 border-coffee-dark bg-neo-pink p-3 text-xs font-black text-coffee-dark shadow-neo-sm"
            >
              <FaExclamationTriangle className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-black uppercase text-coffee-dark">
              <FaUser size={10} className="text-coffee-brown" /> Username
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="neo-input text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-black uppercase text-coffee-dark">
              <FaLock size={10} className="text-coffee-brown" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neo-input text-sm"
            />
          </div>

          <button type="submit" className="neo-button-dark w-full py-3 text-sm">
            Masuk ke Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default AdminLogin;
