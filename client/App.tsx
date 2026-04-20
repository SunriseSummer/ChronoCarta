import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/context';
import MapView from './pages/MapView';
import GridView from './pages/GridView';
import PlacePage from './pages/PlacePage';
import ViewPage from './pages/ViewPage';
import DetailPage from './pages/DetailPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="relative min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/grid" element={<GridView />} />
            <Route path="/place" element={<PlacePage />} />
            <Route path="/view/:id" element={<ViewPage />} />
            <Route path="/edit/:id" element={<DetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
      </HashRouter>
    </AppProvider>
  );
}
