import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Home, CheckSquare, BookOpen, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FadeIn } from './components/PageTransition';
import LoginPage from './pages/Login';
import TodosPage from './pages/Todos';
import RecipesPage from './pages/Recipes';

// --- PROTECTED ROUTE WRAPPER ---
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Lädt...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <div className="pb-20 md:pb-0 md:pl-64 min-h-screen bg-slate-50">
      <Outlet />
      <BottomNav />
      <Sidebar />
    </div>
  );
};

// --- NAVIGATION COMPONENTS ---
const NavLinks = [
  { to: '/', icon: Home, label: 'Start' },
  { to: '/todos', icon: CheckSquare, label: 'Todos' },
  { to: '/recipes', icon: BookOpen, label: 'Rezepte' },
];

const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {NavLinks.map((link) => {
          const isActive = location.pathname === link.to;
          const IconComponent = link.icon;
          return (
            <Link key={link.to} to={link.to} className={`flex flex-col items-center p-2 transition-colors ${isActive ? 'text-brand-400' : 'text-slate-400'}`}>
              <IconComponent size={24} />
              <span className="text-[10px] mt-0.5 font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  );
};

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-brand-600">Plan & Plate</h1>
      </div>
      
      <div className="flex-1 space-y-1">
        {NavLinks.map((link) => {
           const isActive = location.pathname === link.to;
           const IconComponent = link.icon;
           return (
            <Link 
              key={link.to} 
              to={link.to} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-brand-100 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <IconComponent size={20} /> 
              <span className="font-medium">{link.label}</span>
            </Link>
           )
        })}
      </div>

      <div className="border-t pt-4 mt-auto">
        <div className="flex items-center gap-3 px-2 mb-4 text-sm text-slate-600">
            <User size={16} />
            <span className="truncate">{user?.username || user?.email}</span>
        </div>
        <button 
          onClick={logout} 
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-2 text-sm w-full transition-colors"
        >
            <LogOut size={16} /> Abmelden
        </button>
      </div>
    </aside>
  );
};

// --- DASHBOARD ---
const Dashboard = () => {
    const { user } = useAuth();
    return (
      <FadeIn>
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <h1 className="text-2xl font-bold text-slate-800">
              Hallo {user?.name || user?.username || 'Bene'}! 👋
          </h1>
          
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/todos" 
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center aspect-square hover:border-brand-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-3 text-brand-500 group-hover:bg-brand-200 transition-colors">
                  <CheckSquare size={24} />
              </div>
              <span className="font-semibold text-slate-700">Todos</span>
            </Link>
            
            <Link 
              to="/recipes" 
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center aspect-square hover:border-brand-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-3 text-brand-500 group-hover:bg-brand-200 transition-colors">
                  <BookOpen size={24} />
              </div>
              <span className="font-semibold text-slate-700">Rezepte</span>
            </Link>
          </div>
        </div>
      </FadeIn>
    );
  };

// --- APP COMPONENT ---
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}