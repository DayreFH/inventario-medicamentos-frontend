import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import LoginDebug from './pages/LoginDebug';
import Navigation from './components/Navigation';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import FinanceReports from './pages/FinanceReports';
import Home from './pages/Home';
import Medicines from './pages/Medicines';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Receipts from './pages/Receipts';
import Sales from './pages/Sales';
import ExchangeRates from './pages/ExchangeRates';
import ExchangeRatesMN from './pages/ExchangeRatesMN';
import ShippingRates from './pages/ShippingRates';
// import UtilityRates from './pages/UtilityRates'; // ELIMINADO - archivo no existe
import Users from './pages/Users';
import Roles from './pages/Roles';
import Reports from './pages/Reports';
import ProfitabilityAnalysis from './pages/ProfitabilityAnalysis';
import InvoiceManager from './pages/InvoiceManager';
import CompanySettings from './pages/CompanySettings';
import { ROUTE_PERMISSION_MAP } from './config/permissionsConfig';

// Componente Layout para rutas protegidas
function ProtectedLayout({ children }) {
  return (
    <div style={{
      display: 'grid', 
      gridTemplateColumns: '280px 1fr', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      margin: 0,
      padding: 0
    }}>
      <Navigation />
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        width: '100%',
        height: '100vh'
      }}>
        <TopBar />
        <main style={{
          flex: 1,
          padding: '0',
          backgroundColor: '#f8fafc',
          overflow: 'auto',
          width: '100%',
          height: '100%'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* RUTAS PÚBLICAS */}
          <Route path="/login" element={<Login />} />
          <Route path="/login-debug" element={<LoginDebug />} />
          
          {/* RUTAS PROTEGIDAS */}
          <Route path="/" element={
            <PrivateRoute>
              <ProtectedLayout>
                <Navigate to="/dashboard" replace />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/home" element={
            <PrivateRoute requiredPermission="dashboard.alerts">
              <ProtectedLayout>
                <Home />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          {/* PANEL DE DATOS */}
          <Route path="/dashboard" element={
            <PrivateRoute requiredPermission="dashboard.alerts">
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/low-stock" element={
            <PrivateRoute requiredPermission="dashboard.alerts">
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/top-customers" element={
            <PrivateRoute requiredPermission="dashboard.top-customers">
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/best-prices" element={
            <PrivateRoute requiredPermission="dashboard.best-prices">
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/expiry-alerts" element={
            <PrivateRoute requiredPermission="dashboard.expiry">
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/idle-medicines" element={
            <PrivateRoute requiredPermission="dashboard.idle">
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          {/* ADMINISTRACIÓN */}
          <Route path="/admin/dop-usd" element={
            <PrivateRoute requiredPermission="admin.dop-usd">
              <ProtectedLayout>
                <ExchangeRates />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/admin/usd-mn" element={
            <PrivateRoute requiredPermission="admin.usd-mn">
              <ProtectedLayout>
                <ExchangeRatesMN />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/admin/shipping" element={
            <PrivateRoute requiredPermission="admin.shipping">
              <ProtectedLayout>
                <ShippingRates />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/admin/company" element={
            <PrivateRoute requiredPermission="admin.company">
              <ProtectedLayout>
                <CompanySettings />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          {/* RUTA ELIMINADA - UtilityRates no existe
          <Route path="/admin/utility" element={
            <PrivateRoute>
              <ProtectedLayout>
                <UtilityRates />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          */}
          
          {/* GESTIÓN DE DATOS */}
          <Route path="/medicines" element={
            <PrivateRoute requiredPermission="medicines">
              <ProtectedLayout>
                <Medicines />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/customers" element={
            <PrivateRoute requiredPermission="customers">
              <ProtectedLayout>
                <Customers />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/suppliers" element={
            <PrivateRoute requiredPermission="suppliers">
              <ProtectedLayout>
                <Suppliers />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          {/* OPERACIONES */}
          <Route path="/receipts" element={
            <PrivateRoute requiredPermission="receipts">
              <ProtectedLayout>
                <Receipts />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/sales" element={
            <PrivateRoute requiredPermission="sales">
              <ProtectedLayout>
                <Sales />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/operaciones/facturacion" element={
            <PrivateRoute requiredPermission="invoicing.manage">
              <ProtectedLayout>
                <InvoiceManager />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          {/* FINANZAS */}
          <Route path="/finanzas/reportes" element={
            <PrivateRoute requiredPermission="reports.financial">
              <ProtectedLayout>
                <FinanceReports />
              </ProtectedLayout>
            </PrivateRoute>
          } />

          <Route path="/finanzas/rentabilidad" element={
            <PrivateRoute requiredPermission="reports.profitability">
              <ProtectedLayout>
                <ProfitabilityAnalysis />
              </ProtectedLayout>
            </PrivateRoute>
          } />

          {/* INFORMES / REPORTES */}
          <Route path="/reports" element={
            <PrivateRoute requiredPermission="reports">
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            </PrivateRoute>
          } />

          {/* GESTIÓN DE USUARIOS */}
          <Route path="/users" element={
            <PrivateRoute requiredPermission="users.list">
              <ProtectedLayout>
                <Users />
              </ProtectedLayout>
            </PrivateRoute>
          } />
          
          <Route path="/roles" element={
            <PrivateRoute requiredPermission="users.roles">
              <ProtectedLayout>
                <Roles />
              </ProtectedLayout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}