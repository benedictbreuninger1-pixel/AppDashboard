import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Home, CheckSquare, BookOpen, LogOut, User, ShoppingCart, Settings as SettingsIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext'; // NEU
import { FadeIn } from './components/PageTransition';
import { pb, POCKETBASE_URL } from './lib/pocketbase';
import LoginPage from './pages/Login';
import TodosPage from './pages/Todos';
import RecipesPage from './pages/Recipes';
import RecipeDetailPage from './pages/RecipeDetail';
import ShoppingListPage from './pages/ShoppingList';
import SettingsPage from './pages/Settings';

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
  { to: '/shopping', icon: ShoppingCart, label: 'Einkaufen' },
];

const BottomNav = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutMenu, setShowLogoutMenu] = React.useState(false);
  
  return (
    <>
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
          <button 
            onClick={() => setShowLogoutMenu(true)}
            className="flex flex-col items-center p-2 text-slate-400"
          >
            <User size={24} />
            <span className="text-[10px] mt-0.5 font-medium">Profil</span>
          </button>
        </div>
      </nav>
      
      {/* Logout Menu (Mobile) */}
      {showLogoutMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden flex items-end"
          onClick={() => setShowLogoutMenu(false)}
        >
          <div 
            className="bg-white w-full rounded-t-2xl p-6 space-y-4 animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800">Account</h3>
            <Link
              to="/settings"
              onClick={() => setShowLogoutMenu(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <SettingsIcon size={20} />
              <span>Einstellungen</span>
            </Link>
            <button
              onClick={() => {
                logout();
                setShowLogoutMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Abmelden</span>
            </button>
            <button
              onClick={() => setShowLogoutMenu(false)}
              className="w-full px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </>
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
        
        <Link 
          to="/settings" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === '/settings' ? 'bg-brand-100 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <SettingsIcon size={20} /> 
          <span className="font-medium">Einstellungen</span>
        </Link>
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
    const [stats, setStats] = React.useState({ todos: 0, todosOpen: 0, recipes: 0, shoppingItems: 0 });
    const [quickTodos, setQuickTodos] = React.useState([]);
    const [randomRecipe, setRandomRecipe] = React.useState(null);
    
    React.useEffect(() => {
      const fetchDashboardData = async () => {
        try {
          // Fetch Todos
          const todosData = await pb.collection('todos').getFullList();
          const openTodos = todosData.filter(t => t.status === 'open');
          
          // Fetch Recipes
          const recipesData = await pb.collection('recipes').getFullList({ sort: '-updated' });
          
          // Fetch Shopping Items
          const shoppingData = await pb.collection('shopping_items').getFullList();
          const openShoppingItems = shoppingData.filter(s => s.status === 'open');
          
          setStats({
            todos: todosData.length,
            todosOpen: openTodos.length,
            recipes: recipesData.length,
            shoppingItems: openShoppingItems.length,
          });
          
          // Quick-Access: Nächste 3 offene Todos
          setQuickTodos(openTodos.slice(0, 3));
          
          // Zufälliges Rezept des Tages
          if (recipesData.length > 0) {
            const random = recipesData[Math.floor(Math.random() * recipesData.length)];
            setRandomRecipe(random);
          }
        } catch (err) {
          console.error('Dashboard Daten laden fehlgeschlagen:', err);
        }
      };
      
      if (user) fetchDashboardData();
    }, [user]);
    
    return (
      <FadeIn>
        <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">
              Hey {user?.name || user?.username || 'Bene'} 👋
            </h1>
            <p className="text-slate-500 text-sm">Deine Übersicht für heute</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-2xl font-bold text-brand-500">{stats.todosOpen}</div>
              <div className="text-xs text-slate-500 mt-1">offene Todos</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-2xl font-bold text-brand-500">{stats.recipes}</div>
              <div className="text-xs text-slate-500 mt-1">Rezepte</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="text-2xl font-bold text-brand-500">{stats.shoppingItems}</div>
              <div className="text-xs text-slate-500 mt-1">Einkaufen</div>
            </div>
          </div>
          
          {/* Quick Access: Nächste Todos */}
          {quickTodos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">Anstehende Aufgaben</h2>
                <Link to="/todos" className="text-xs text-brand-500 hover:text-brand-600">Alle →</Link>
              </div>
              <div className="space-y-2">
                {quickTodos.map(todo => (
                  <Link 
                    key={todo.id} 
                    to="/todos"
                    className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100 hover:border-brand-200 transition-colors group"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand-400 group-hover:bg-brand-500" />
                    <span className="text-sm text-slate-700 flex-1 truncate">{todo.title}</span>
                    {todo.shared && (
                      <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">Gemeinsam</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Rezept des Tages */}
          {randomRecipe && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">Rezept des Tages</h2>
              <Link 
                to="/recipes"
                className="block bg-gradient-to-br from-brand-50 to-pink-50 p-4 rounded-xl border border-brand-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  {randomRecipe.image ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm shrink-0">
                      <img 
                        src={`${POCKETBASE_URL}/api/files/${randomRecipe.collectionId}/${randomRecipe.id}/${randomRecipe.image}`}
                        alt={randomRecipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm shrink-0">
                      🍽️
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
                      {randomRecipe.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {randomRecipe.ingredients?.slice(0, 80)}...
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {/* Hauptnavigation Cards */}
          <div className="grid grid-cols-2 gap-4 pt-4">
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
      <ToastProvider> {/* Provider hier eingefügt */}
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
    </AuthProvider>
  );
}