import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import MySearchesPage from './pages/MySearchesPage';
import SavedDealsPage from './pages/SavedDealsPage';
import SnipeWatchlistPage from './pages/SnipeWatchlistPage';
import SellerIntelPage from './pages/SellerIntelPage';
import MarketAlertsPage from './pages/MarketAlertsPage';
import SetBrowserPage from './pages/SetBrowserPage';
import PortfolioPage from './pages/PortfolioPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/my-searches" element={<MySearchesPage />} />
          <Route path="/saved-deals" element={<SavedDealsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/snipe" element={<SnipeWatchlistPage />} />
          <Route path="/sellers" element={<SellerIntelPage />} />
          <Route path="/market" element={<MarketAlertsPage />} />
          <Route path="/sets" element={<SetBrowserPage />} />
          <Route path="/sets/:setCode" element={<SetBrowserPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
