import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginDebug() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();

  // Agregar información de depuración
  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    addDebugLog('Componente LoginDebug montado', 'success');
    addDebugLog(`Estado de autenticación: ${isAuthenticated ? 'Autenticado' : 'No autenticado'}`, 'info');
    if (user) {
      addDebugLog(`Usuario actual: ${JSON.stringify(user)}`, 'info');
    }
  }, []);

  // Usuarios de prueba predefinidos
  const testUsers = [
    { email: 'admin@test.com', password: 'admin123', label: 'Admin' },
    { email: 'user@test.com', password: 'user123', label: 'Usuario' },
    { email: 'test@test.com', password: 'test123', label: 'Test' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    addDebugLog(`Intentando login con email: ${email}`, 'info');
    
    try {
      const result = await login(email, password);
      
      addDebugLog(`Respuesta del servidor: ${JSON.stringify(result)}`, 'info');
      
      if (result.success) {
        addDebugLog('Login exitoso, redirigiendo...', 'success');
        navigate('/dashboard');
      } else {
        const errorMsg = result.error || 'Error al iniciar sesión';
        setError(errorMsg);
        addDebugLog(`Error en login: ${errorMsg}`, 'error');
      }
    } catch (err) {
      const errorMsg = err.message || 'Error al iniciar sesión';
      setError(errorMsg);
      addDebugLog(`Error catch: ${errorMsg}`, 'error');
      addDebugLog(`Stack trace: ${err.stack}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillTestUser = (testUser) => {
    setEmail(testUser.email);
    setPassword(testUser.password);
    addDebugLog(`Credenciales de prueba cargadas: ${testUser.label}`, 'success');
  };

  const clearDebugLog = () => {
    setDebugInfo([]);
    addDebugLog('Log de depuración limpiado', 'info');
  };

  const checkAuthStatus = () => {
    addDebugLog(`isAuthenticated: ${isAuthenticated}`, 'info');
    addDebugLog(`user: ${JSON.stringify(user)}`, 'info');
    addDebugLog(`localStorage token: ${localStorage.getItem('token') ? 'Presente' : 'Ausente'}`, 'info');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      {/* Panel de Login */}
      <div style={{
        flex: '1 1 400px',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '500px'
      }}>
        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '8px'
          }}>
            🔧 Login Debug Mode
          </h1>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>
            Modo de depuración para desarrollo
          </p>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#ff4444',
            border: '2px solid #cc0000',
            borderRadius: '8px',
            color: '#ffffff',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Usuarios de prueba */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontWeight: '600',
            color: '#495057',
            fontSize: '14px'
          }}>
            🧪 Usuarios de Prueba
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {testUsers.map((testUser, index) => (
              <button
                key={index}
                type="button"
                onClick={() => fillTestUser(testUser)}
                style={{
                  padding: '8px 16px',
                  background: '#e3f2fd',
                  border: '1px solid #2196f3',
                  borderRadius: '6px',
                  color: '#1976d2',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#2196f3';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#e3f2fd';
                  e.target.style.color = '#1976d2';
                }}
              >
                {testUser.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#495057',
              fontSize: '14px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#495057',
              fontSize: '14px'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#a0a0a0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              marginBottom: '12px'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? '🔄 Iniciando sesión...' : '🚀 Iniciar Sesión'}
          </button>
        </form>

        {/* Botones de utilidad */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={checkAuthStatus}
            style={{
              flex: 1,
              padding: '10px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ✓ Check Auth
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              flex: 1,
              padding: '10px',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            → Login Normal
          </button>
        </div>
      </div>

      {/* Panel de Debug */}
      {showDebugPanel && (
        <div style={{
          flex: '1 1 400px',
          background: '#1e1e1e',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header del panel */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #444'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#fff',
              margin: 0
            }}>
              📊 Debug Console
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={clearDebugLog}
                style={{
                  padding: '6px 12px',
                  background: '#ff5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Limpiar
              </button>
              <button
                onClick={() => setShowDebugPanel(false)}
                style={{
                  padding: '6px 12px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Logs */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}>
            {debugInfo.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                No hay logs de depuración
              </div>
            ) : (
              debugInfo.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '4px',
                    background: log.type === 'error' ? '#3d1f1f' : 
                               log.type === 'success' ? '#1f3d1f' : '#1f2937',
                    borderLeft: `3px solid ${
                      log.type === 'error' ? '#ff4444' : 
                      log.type === 'success' ? '#4caf50' : '#2196f3'
                    }`,
                    borderRadius: '4px',
                    color: log.type === 'error' ? '#ff8a80' : 
                           log.type === 'success' ? '#a5d6a7' : '#90caf9',
                    wordBreak: 'break-word'
                  }}
                >
                  <span style={{ color: '#888', marginRight: '8px' }}>
                    [{log.timestamp}]
                  </span>
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Botón para mostrar panel si está oculto */}
      {!showDebugPanel && (
        <button
          onClick={() => setShowDebugPanel(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            background: '#1e1e1e',
            color: 'white',
            border: '2px solid #667eea',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          📊 Mostrar Debug Console
        </button>
      )}
    </div>
  );
}

