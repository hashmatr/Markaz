import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OrdersPage from './pages/OrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import SellersPage from './pages/SellersPage';
import StorePage from './pages/StorePage';
import BecomeSellerPage from './pages/BecomeSellerPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BrandsPage from './pages/BrandsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ScrollToTop from './components/ScrollToTop';
import Chatbot from './components/chatbot/Chatbot';
import SmoothScroll from './components/animation/SmoothScroll';
import PageTransition from './components/animation/PageTransition';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/shop" element={<PageTransition><ShopPage /></PageTransition>} />
            <Route path="/brands" element={<PageTransition><BrandsPage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
            <Route path="/product/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
            <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
            <Route path="/orders" element={<PageTransition><OrdersPage /></PageTransition>} />
            <Route path="/orders/:id" element={<PageTransition><OrderTrackingPage /></PageTransition>} />
            <Route path="/order-success" element={<PageTransition><OrderSuccessPage /></PageTransition>} />
            <Route path="/sellers" element={<PageTransition><SellersPage /></PageTransition>} />
            <Route path="/store/:slug" element={<PageTransition><StorePage /></PageTransition>} />
            <Route path="/become-seller" element={<PageTransition><BecomeSellerPage /></PageTransition>} />
            <Route path="/seller/dashboard" element={<PageTransition><SellerDashboardPage /></PageTransition>} />
            <Route path="/seller/add-product" element={<PageTransition><AddProductPage /></PageTransition>} />
            <Route path="/seller/edit-product/:id" element={<PageTransition><EditProductPage /></PageTransition>} />
            <Route path="/admin" element={<PageTransition><AdminDashboardPage /></PageTransition>} />
            <Route path="*" element={
              <PageTransition>
                <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
                  <h1 className="font-integral text-5xl font-bold mb-4">404</h1>
                  <p className="text-gray-500 mb-6">Page not found</p>
                  <a href="/" className="bg-black text-white px-8 py-3 rounded-full font-medium">Go Home</a>
                </div>
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { background: '#000', color: '#fff', borderRadius: '12px', fontSize: '14px' },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </SmoothScroll>
    </BrowserRouter>
  );
}

export default App;
