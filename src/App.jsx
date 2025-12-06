import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Home, CheckSquare, BookOpen, LogOut, User, ShoppingCart, Settings as SettingsIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { FadeIn } from './components/PageTransition';
import { pb, POCKETBASE_URL } from './lib/pocketbase';
import PullToRefresh from './components/PullToRefresh';
import ErrorBanner from './components/ErrorBanner';
import LoginPage from './pages/Login';
import TodosPage from './pages/Todos';
import RecipesPage from './pages/Recipes';
import RecipeDetailPage from './pages/RecipeDetail';
import ShoppingListPage from './pages/ShoppingList';
import SettingsPage from './pages/Settings';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">Lädt...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <div className="pb-20 md:pb-0 md:pl-64 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Outlet />
      <BottomNav />
      <Sidebar />
    </div>
  );
};

const NAV_LINKS = [
  { to: '/', icon: Home, label: 'Start' },
  { to: '/todos', icon: CheckSquare, label: 'Todos' },
  { to: '/recipes', icon: BookOpen, label: 'Rezepte' },
  { to: '/shopping', icon: ShoppingCart, label: 'Einkaufen' },
];

const NavLink = React.memo(({ link, isActive }) => {
  const IconComponent = link.icon;
  return (
    <Link 
      key={link.to} 
      to={link.to} 
      className={`flex flex-col items-center p-2 transition-colors ${isActive ? 'text-brand-400 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}
      aria-label={link.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <IconComponent size={24} />
      <span className="text-[10px] mt-0.5 font-medium">{link.label}</span>
    </Link>
  );
});

NavLink.displayName = 'NavLink';

const BottomNav = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  
  const handleLogoutClick = useCallback(() => setShowLogoutMenu(true), []);
  const handleCloseMenu = useCallback(() => setShowLogoutMenu(false), []);
  const handleLogout = useCallback(() => {
    logout();
    setShowLogoutMenu(false);
  }, [logout]);
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden z-50 safe-area-pb transition-colors" role="navigation" aria-label="Hauptnavigation">
        <div className="flex justify-around items-center h-16">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} link={link} isActive={location.pathname === link.to} />
          ))}
          <button 
            onClick={handleLogoutClick}
            className="flex flex-col items-center p-2 text-slate-400 dark:text-slate-500"
            aria-label="Profil öffnen"
          >
            <User size={24} />
            <span className="text-[10px] mt-0.5 font-medium">Profil</span>
          </button>
        </div>
      </nav>
      
      {showLogoutMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden flex items-end"
          onClick={handleCloseMenu}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full rounded-t-2xl p-6 space-y-4 animate-slideUp border-t border-slate-200 dark:border-slate-800"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-menu-title"
          >
            <h3 id="logout-menu-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">Account</h3>
            <Link
              to="/settings"
              onClick={handleCloseMenu}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <SettingsIcon size={20} />
              <span>Einstellungen</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Abmelden</span>
            </button>
            <button
              onClick={handleCloseMenu}
              className="w-full px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const SidebarLink = React.memo(({ link, isActive }) => {
  const IconComponent = link.icon;
  return (
    <Link 
      to={link.to} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
      aria-label={link.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <IconComponent size={20} /> 
      <span className="font-medium">{link.label}</span>
    </Link>
  );
});

SidebarLink.displayName = 'SidebarLink';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 transition-colors" role="navigation" aria-label="Seitennavigation">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-brand-600 dark:text-brand-400">Plan & Plate</h1>
      </div>
      
      <div className="flex-1 space-y-1">
        {NAV_LINKS.map((link) => (
          <SidebarLink key={link.to} link={link} isActive={location.pathname === link.to} />
        ))}
        
        <SidebarLink link={{ to: '/settings', icon: SettingsIcon, label: 'Einstellungen' }} isActive={location.pathname === '/settings'} />
      </div>

      <div className="border-t dark:border-slate-800 pt-4 mt-auto">
        <div className="flex items-center gap-3 px-2 mb-4 text-sm text-slate-600 dark:text-slate-400">
            <User size={16} />
            <span className="truncate">{user?.username || user?.email}</span>
        </div>
        <button 
          onClick={logout} 
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-red-600 px-2 text-sm w-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          aria-label="Abmelden"
        >
            <LogOut size={16} /> Abmelden
        </button>
      </div>
    </aside>
  );
};

// StatCard außerhalb der Dashboard-Komponente deklarieren
const StatCard = React.memo(({ value, label }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="text-2xl font-bold text-brand-500">{value}</div>
    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
  </div>
));

StatCard.displayName = 'StatCard';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ todos: 0, todosOpen: 0, recipes: 0, shoppingItems: 0 });
    const [quickTodos, setQuickTodos] = useState([]);
    const [randomRecipe, setRandomRecipe] = useState(null);
    const [error, setError] = useState(null);
    
    const fetchDashboardData = useCallback(async () => {
      if (!user) return;
      setError(null);
      try {
        const [todosResult, recipesResult, shoppingResult] = await Promise.all([
          pb.collection('todos').getList(1, 200, {
            filter: `owner = "${user.id}" || shared = true`,
            sort: '-status,-created'
          }),
          pb.collection('recipes').getList(1, 200, { sort: '-updated' }),
          pb.collection('shopping_items').getList(1, 200, {
            filter: `owner = "${user.id}" || shared = true`,
            sort: '-status,-created'
          })
        ]);
        
        const todosData = todosResult.items;
        const openTodos = todosData.filter(t => t.status === 'open');
        const recipesData = recipesResult.items;
        const openShoppingItems = shoppingResult.items.filter(s => s.status === 'open');
        
        setStats({
          todos: todosData.length,
          todosOpen: openTodos.length,
          recipes: recipesData.length,
          shoppingItems: openShoppingItems.length,
        });
        
        setQuickTodos(openTodos.slice(0, 3));
        
        if (recipesData.length > 0) {
          const random = recipesData[Math.floor(Math.random() * recipesData.length)];
          setRandomRecipe(random);
        }
      } catch (err) {
        console.error('Dashboard Daten laden fehlgeschlagen:', err);
        setError("Konnte Daten nicht aktualisieren.");
      }
    }, [user]);

    React.useEffect(() => {
      fetchDashboardData();
    }, [fetchDashboardData]);
    
    return (
      <PullToRefresh onRefresh={fetchDashboardData}>
        <FadeIn>
          <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                Hey {user?.name || user?.username || 'Bene'} 👋
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Deine Übersicht für heute</p>
            </div>

            {error && <ErrorBanner message={error} onRetry={fetchDashboardData} />}
            
            <div className="grid grid-cols-3 gap-3">
              <StatCard value={stats.todosOpen} label="offene Todos" />
              <StatCard value={stats.recipes} label="Rezepte" />
              <StatCard value={stats.shoppingItems} label="Einkaufen" />
            </div>
            
            {quickTodos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Anstehende Aufgaben</h2>
                  <Link to="/todos" className="text-xs text-brand-500 hover:text-brand-600">Alle →</Link>
                </div>
                <div className="space-y-2">
                  {quickTodos.map(todo => (
                    <Link 
                      key={todo.id} 
                      to="/todos"
                      className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group"
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-400 group-hover:bg-brand-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate">{todo.title}</span>
                      {todo.shared && (
                        <span className="text-[10px] bg-brand-50 dark:bg-brand-900 text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded-full">Gemeinsam</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {randomRecipe && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Rezept des Tages</h2>
                <Link 
                  to="/recipes"
                  className="block bg-gradient-to-br from-brand-50 to-pink-50 dark:from-brand-900/40 dark:to-slate-900 p-4 rounded-xl border border-brand-100 dark:border-slate-800 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {randomRecipe.mainImage ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm shrink-0">
                        <img 
                          src={`${POCKETBASE_URL}/api/files/${randomRecipe.collectionId}/${randomRecipe.id}/${randomRecipe.mainImage}`}
                          alt={randomRecipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-2xl shadow-sm shrink-0">
                        🍽️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {randomRecipe.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {randomRecipe.ingredients?.slice(0, 80)}...
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Link 
                to="/todos" 
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center aspect-square hover:border-brand-300 dark:hover:border-slate-600 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center mb-3 text-brand-500 group-hover:bg-brand-200 dark:group-hover:bg-brand-800 transition-colors">
                    <CheckSquare size={24} />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Todos</span>
              </Link>
              
              <Link 
                to="/recipes" 
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center aspect-square hover:border-brand-300 dark:hover:border-slate-600 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center mb-3 text-brand-500 group-hover:bg-brand-200 dark:group-hover:bg-brand-800 transition-colors">
                    <BookOpen size={24} />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Rezepte</span>
              </Link>
            </div>
          </div>
        </FadeIn>
      </PullToRefresh>
    );
  };

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider> 
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/todos" element={<TodosPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                <Route path="/shopping" element={<ShoppingListPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}