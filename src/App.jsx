import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
// HIER WURDE "User" HINZUGEFÜGT:
import { Home, CheckSquare, BookOpen, LogOut, User } from 'lucide-react';
import { useAuthStore } from './lib/store';
import { pb } from './lib/pocketbase';
import LoginPage from './pages/Login';
import TodosPage from './pages/Todos';
import RecipesPage from './pages/Recipes';

// Wrapper für geschützte Seiten (nur wenn eingeloggt)
const ProtectedRoute = () => {
  const { checkAuth } = useAuthStore();
  
  // Prüft beim Laden einmalig den Status
  useEffect(() => { 
    checkAuth(); 
  }, []);

  // Wenn nicht eingeloggt -> Redirect zu Login
  if (!pb.authStore.isValid) return <Navigate to="/login" replace />;
  
  return (
    <div className="pb-20 md:pb-0 md:pl-64 min-h-screen bg-slate-50">
      <Outlet />
      <BottomNav />
      <Sidebar />
    </div>
  );
};

// Navigations-Links Konfiguration
const NavLinks = [
  { to: '/', icon: Home, label: 'Start' },
  { to: '/todos', icon: CheckSquare, label: 'Todos' },
  { to: '/recipes', icon: BookOpen, label: 'Rezepte' },
];

// Mobile Navigation (Unten)
const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {NavLinks.map((link) => {
          const isActive = location.pathname === link.to;
          // Wir speichern das Icon in einer Variable mit Großbuchstaben für React
          const IconComponent = link.icon;
          
          return (
            <Link key={link.to} to={link.to} className={`flex flex-col items-center p-2 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
              <IconComponent size={24} />
              <span className="text-[10px] mt-0.5 font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  );
};

// Desktop Sidebar (Links)
const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const location = useLocation();
  
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-slate-800">BeneApp</h1>
      </div>
      
      <div className="flex-1 space-y-1">
        {NavLinks.map((link) => {
           const isActive = location.pathname === link.to;
           const IconComponent = link.icon;
           
           return (
            <Link key={link.to} to={link.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <IconComponent size={20} /> 
              <span className="font-medium">{link.label}</span>
            </Link>
           )
        })}
      </div>

      {/* User Bereich unten */}
      <div className="border-t pt-4 mt-auto">
        <div className="flex items-center gap-3 px-2 mb-4 text-sm text-slate-600">
            <User size={16} />
            <span className="truncate">{user?.email}</span>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-2 text-sm w-full">
            <LogOut size={16} /> AbmeldenX3
        </button>
      </div>
    </aside>
  );
};

// Dashboard Seite
const Dashboard = () => {
    const { user } = useAuthStore();
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Hallo {user?.name || user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-slate-500 mb-6">Willkommen in deinem Dashboard.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <Link to="/todos" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center aspect-square hover:border-indigo-200 transition-colors">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 text-indigo-600">
                <CheckSquare size={24} />
            </div>
            <span className="font-semibold text-slate-700">Todos</span>
          </Link>
          
          <Link to="/recipes" className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center aspect-square hover:border-rose-200 transition-colors">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3 text-rose-600">
                <BookOpen size={24} />
            </div>
            <span className="font-semibold text-slate-700">Rezepte</span>
          </Link>
        </div>
      </div>
    );
  };

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}