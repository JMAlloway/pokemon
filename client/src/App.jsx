import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import MySearchesPage from './pages/MySearchesPage';
import SavedDealsPage from './pages/SavedDealsPage';
import ChaseListPage from './pages/ChaseListPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/my-searches" element={<MySearchesPage />} />
          <Route path="/saved-deals" element={<SavedDealsPage />} />
          <Route path="/chase" element={<ChaseListPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
