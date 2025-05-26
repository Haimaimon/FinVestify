import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthForms from "./components/AuthForms";
import Navbar from "./Navbar";
import Home from "./components/Menu/Home";
import News from "./components/Menu/News";
import StockData from "./components/Menu/StockDataCompo/StockData";
import Profile from "./components/userProfile/Profile";
import TradingViewCrypto from "./components/TradingView/TradingViewCrypto";
import Favorites from "./components/Favorites/Favorites";
import About from "./components/Menu/About";
import StrategyTrade from "./components/Menu/StrategyTradeCompo/StrategyTrade";
import StockNews from "./components/NewsOfStock/StockNews";
import SentimentAnalysis from "./components/PredictNews/SentimentAnalysis";
import StockPrediction from "./components/Menu/PredictStockCompo/StockPrediction";
import SearchStocks from "./components/SearchStock/SearchStocks";
import ChatbotUI from "./components/Chatbot/ChatbotUI";
//import ChatbotBubble from "./components/Chatbot/ChatbotBubble";
import ChatbotBubbleWithText from "./components/Chatbot/ChatbotBubbleWithText";
import TestCrypto from "./components/Menu/Crypto/TestCrypto";

const queryClient = new QueryClient();

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('tokenim'));
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const openAuthForm = (type) => {
    setAuthType(type);
    setIsAuthOpen(true);
  };

  const closeAuthForm = () => {
    setIsAuthOpen(false);
  };

  const handleLoginSuccess = (token) => {
    localStorage.setItem('tokenim', token);
    setIsLoggedIn(true);
    closeAuthForm();
  };

  const handleLogout = () => {
    localStorage.removeItem('tokenim');
    setIsLoggedIn(false);
    queryClient.clear(); // מנקה את כל הקאש של React Query
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar openAuthForm={openAuthForm} isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
        <div style={{ marginTop: '1px' }}>
          <TradingViewCrypto />
          {/* בועה צפה שמופיעה תמיד */}
          <ChatbotBubbleWithText onClick={() => setIsChatbotOpen(true)} />

          {/* חלון הצ'אט עצמו */}
          <ChatbotUI
            isOpen={isChatbotOpen}
            onClose={() => setIsChatbotOpen(false)}
          />
        </div>
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
          <Route path="/news" element={<News />} />
          <Route path="/stockdata" element={<StockData />} />
          <Route path="/predictstock" element={<StockPrediction />} />
          <Route path="/strategytrade" element={<StrategyTrade />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/stocknews" element={<StockNews />} />
          <Route path="/sentiment" element={<SentimentAnalysis />} />
          <Route path="/search" element={<SearchStocks />} />
          <Route path="/about" element={<About />} />
          <Route path="/signal" element={<TestCrypto />} />
        </Routes>
        {isAuthOpen && (
          <AuthForms formType={authType} onClose={closeAuthForm} onSuccess={handleLoginSuccess} />
        )}
      </Router>
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
