import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import MySearchesPage from './pages/MySearchesPage';
import SavedDealsPage from './pages/SavedDealsPage';
import SnipeWatchlistPage from './pages/SnipeWatchlistPage';
import SellerIntelPage from './pages/SellerIntelPage';
import MarketAlertsPage from './pages/MarketAlertsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/my-searches" element={<MySearchesPage />} />
          <Route path="/saved-deals" element={<SavedDealsPage />} />
          <Route path="/snipe" element={<SnipeWatchlistPage />} />
          <Route path="/sellers" element={<SellerIntelPage />} />
          <Route path="/market" element={<MarketAlertsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
