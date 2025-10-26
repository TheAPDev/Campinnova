import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Counselling from './pages/Counselling';
import Groups from './pages/Groups';
import BottomNav from './components/BottomNav';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  function renderPage() {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'counselling':
        return <Counselling />;
      case 'groups':
        return <Groups />;
      default:
        return <Home />;
    }
  }

  return (
    <div className="relative min-h-screen">
      {renderPage()}
      <BottomNav activePage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
