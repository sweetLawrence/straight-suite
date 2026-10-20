import { Outlet } from 'react-router-dom'
// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import ScrollToTop from '../components/ScrollTop'

export default function MainLayout () {
  return (
    <>
      {/* <ScrollToTop /> */}
      {/* <Navbar /> */}
      <main>
        <Outlet />
      </main>
      {/* <Footer /> */}
    </>
  )
}
