import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import WorkflowEditor from './pages/WorkflowEditor';
import ConfigPage from './pages/ConfigPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="h-full">
          <Router>
            <Header />
            <main className="min-h-screen">
              <ReactFlowProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  
                  {/* Protected routes */}
                  <Route 
                    path="/editor" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <div className="pt-20 h-screen">
                            <div className="h-full">
                              <WorkflowEditor />
                            </div>
                          </div>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/config" 
                    element={
                      <ProtectedRoute>
                        <div className="pt-20">
                          <ConfigPage />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </ReactFlowProvider>
            </main>
          </Router>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;