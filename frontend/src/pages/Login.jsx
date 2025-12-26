import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirigir al panel inicial del rol del usuario
        const startPanel = result.user?.role?.startPanel || '/dashboard';
        console.log('🔄 Redirigiendo a:', startPanel);
        navigate(startPanel);
      } else {
        setError(result.error || 'Error al iniciar sesión');
        console.error('Error en login:', result);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      console.error('Error catch en login:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
        {/* Columna izquierda - Imagen como fondo (oculta en móvil) */}
        {!isMobile && <div style={{
          backgroundImage: 'url(/welcome-hero.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '40px 60px 60px 60px',
          position: 'relative',
          height: '100vh',
          overflow: 'hidden'
        }}>
          {/* Overlay oscuro solo en la parte inferior para los textos */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.8) 100%)',
            zIndex: 0
          }}></div>
          
          {/* Textos en la parte inferior con espacio reducido */}
          <div style={{
            textAlign: 'center',
            color: 'white',
            zIndex: 1,
            position: 'relative',
            width: '100%',
            maxWidth: '600px',
            paddingBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '34px',
              fontWeight: 'bold',
              marginBottom: '4px',
              textShadow: '0 4px 12px rgba(0,0,0,0.9)',
              lineHeight: '1.1'
            }}>
              💊 Inventario de Medicamentos
            </h2>
            <h3 style={{
              fontSize: '26px',
              fontWeight: '600',
              marginBottom: '4px',
              textShadow: '0 4px 12px rgba(0,0,0,0.9)',
              lineHeight: '1.1'
            }}>
              Sistema de Gestión
            </h3>
            <p style={{
              fontSize: '18px',
              lineHeight: '1.3',
              margin: '0',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              opacity: 0.95
            }}>
              Controla tu inventario de medicamentos de manera eficiente y segura
            </p>
          </div>
        </div>}

        {/* Columna derecha - Formulario */}
        <div style={{
          padding: isMobile ? '30px' : '60px',
          background: '#ffffff',
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {isMobile && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#667eea',
                margin: '0 0 12px 0'
              }}>
                💊 Inventario de Medicamentos
              </h2>
            </div>
          )}
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '12px'
          }}>
            🔐 Iniciar Sesión
          </h1>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div style={{
            padding: '16px 20px',
            background: '#ff4444',
            border: '2px solid #cc0000',
            borderRadius: '8px',
            color: '#ffffff',
            marginBottom: '24px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 4px 8px rgba(255,68,68,0.3)',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* FORMULARIO DE LOGIN */}
        <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
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
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={true}
              label="Contraseña"
              placeholder="••••••••"
              showStrength={false}
              style={{ marginBottom: '24px' }}
            />

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
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
    </div>
  );
}

