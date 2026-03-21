import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobDiscovery from './pages/JobDiscovery';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import useAuthStore from './store/authStore';

const Layout = ({ children }) => {
  const token = useAuthStore(state => state.token);
  return (
    <div className="flex">
      {token && <Navbar />}
      <main className={`flex-1 ${token ? 'ml-20' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />
          <Route 
            path="/dashboard" 
            element={token ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/discovery" 
            element={token ? <JobDiscovery /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={token ? <Profile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={token ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
