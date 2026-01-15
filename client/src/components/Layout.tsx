import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/recepten', label: 'Recepten' },
  { path: '/aanbiedingen', label: 'Aanbiedingen' },
  { path: '/boodschappenlijst', label: 'Boodschappenlijst' },
  { path: '/tips', label: 'Tips' },
];

function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🍳</span>
              <span className="font-bold text-xl text-gray-900">Budget Recepten</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-100">
          <div className="flex overflow-x-auto px-4 py-2 space-x-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Budget Recepten - Bespaar op je boodschappen met slimme recepten</p>
            <p className="mt-2">
              Aanbiedingen van{' '}
              <span className="text-ah-blue font-medium">Albert Heijn</span> en{' '}
              <span className="font-medium">Jumbo</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
