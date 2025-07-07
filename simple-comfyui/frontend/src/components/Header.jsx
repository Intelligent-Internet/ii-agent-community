import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Workflow } from 'lucide-react';

function Header() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Don't show header on landing, login, register, or demo pages
  const hideHeaderPaths = ['/', '/login', '/register', '/demo'];
  if (hideHeaderPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10 px-6 py-4"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <motion.div className="flex items-center space-x-8">
          <Link to="/editor" className="flex items-center space-x-3">
            <motion.div
              className="p-2 bg-white rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Workflow className="w-6 h-6 text-black" />
            </motion.div>
            <h1 className="text-xl font-bold text-white">
              Node Media Generator
            </h1>
          </Link>
          
          {isAuthenticated && (
            <nav className="flex space-x-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/editor"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === '/editor'
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Workflow Editor
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/config"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === '/config'
                      ? 'bg-white text-black'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Configuration
                </Link>
              </motion.div>
            </nav>
          )}
        </motion.div>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {user?.full_name || user?.username}
                </span>
              </div>
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Sign In
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="bg-white text-black px-6 py-2 rounded-xl font-medium hover:bg-gray-100 transition-all"
                >
                  Sign Up
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

export default Header;