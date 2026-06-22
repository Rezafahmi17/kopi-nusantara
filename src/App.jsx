import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Menu from './components/Menu'
import Gallery from './components/Gallery'
import CTABanner from './components/CTABanner'
import Footer from './components/Footer'
import CustomerOrder from './components/CustomerOrder'
import AdminDashboard from './components/AdminDashboard'
import AdminLogin from './components/AdminLogin'
import QRSimulator from './components/QRSimulator'
import { initDB } from './utils/storage'

function App() {
  const [route, setRoute] = useState('landing')
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('kn_admin_logged_in') === 'true'
  })

  useEffect(() => {
    // Initialize simulated database in localStorage
    initDB()

    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash.startsWith('#meja=')) {
        setRoute('order')
      } else if (hash === '#admin') {
        setRoute('admin')
      } else if (hash === '#qr-simulator') {
        setRoute('qr-simulator')
      } else {
        setRoute('landing')
      }
      // Scroll to top on route change
      window.scrollTo(0, 0)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true)
    sessionStorage.setItem('kn_admin_logged_in', 'true')
  }

  const handleLogout = () => {
    setIsAdminLoggedIn(false)
    sessionStorage.removeItem('kn_admin_logged_in')
  }

  return (
    <div className="min-h-screen bg-coffee-soft text-coffee-dark flex flex-col justify-between overflow-x-hidden font-body">
      <Navbar />
      <main className="flex-grow">
        {route === 'landing' && (
          <>
            <Hero />
            <About />
            <Menu />
            <Gallery />
            <CTABanner />
          </>
        )}
        {route === 'qr-simulator' && <QRSimulator />}
        {route === 'order' && <CustomerOrder />}
        {route === 'admin' && (
          isAdminLoggedIn ? (
            <AdminDashboard onLogout={handleLogout} />
          ) : (
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          )
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
