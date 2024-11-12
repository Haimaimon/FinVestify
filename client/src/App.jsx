import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthForms from "./components/AuthForms";
import Navbar from "./Navbar";
import Home from "./components/Menu/Home";
import News from "./components/Menu/News";
import StockData from "./components/Menu/StockData";
import Profile from "./components/userProfile/Profile";
import TradingViewCrypto from "./components/TradingView/TradingViewCrypto";
import StockPredictionPage from "./components/PredictCompo/StockPredictionPage";
import Favorites from "./components/Favorites/Favorites";
import About from "./components/Menu/About";
import StrategyTrade from "./components/Menu/StrategyTrade";

const queryClient = new QueryClient();

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token')); // בדיקה אם יש טוקן בזיכרון המקומי

  const openAuthForm = (type) => {
    setAuthType(type);
    setIsAuthOpen(true);
  };

  const closeAuthForm = () => {
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    closeAuthForm();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar openAuthForm={openAuthForm} isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
        <div style={{ marginTop: '20px' }}> {/* ספייס בין ה-Navbar לרכיב */}
          <TradingViewCrypto/>
        </div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/stockdata" element={<StockData />} />
          <Route path="/stockpredict" element={<StockPredictionPage />} />
          <Route path="/strategytrade" element={<StrategyTrade />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/about" element={<About />} />
        </Routes>
        {isAuthOpen && (
          <AuthForms formType={authType} onClose={closeAuthForm} onSuccess={handleLoginSuccess} />
        )}
      </Router>
      <ToastContainer/>
    </QueryClientProvider>
  );
}

export default App;
