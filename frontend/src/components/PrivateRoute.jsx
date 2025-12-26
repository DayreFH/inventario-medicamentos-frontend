import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FEATURES } from '../config/featureFlags';
import { hasAccessToRoute, getRoutesForPermission } from '../config/permissionsConfig';

/**
 * Componente para proteger rutas privadas
 * Redirige a login si el usuario no está autenticado
 * Verifica permisos si se especifica requiredPermission
 * 
 * Soporta dos modos:
 * - GRANULAR_PERMISSIONS: false → Verificación simple (permiso exacto)
 * - GRANULAR_PERMISSIONS: true → Verificación jerárquica (padre o hijo)
 */
export default function PrivateRoute({ children, requiredPermission }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('🔒 PrivateRoute:', { 
    loading, 
    user: user ? user.name : 'NO AUTH',
    requiredPermission 
  });

  // Mientras carga, mostrar un spinner o pantalla de carga
  if (loading) {
    console.log('⏳ PrivateRoute: Mostrando spinner de carga...');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>Verificando sesión...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    console.log('❌ PrivateRoute: No hay usuario, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  // Si no se requiere permiso específico, permitir acceso
  if (!requiredPermission) {
    console.log('✅ PrivateRoute: Sin permiso requerido, mostrando contenido');
    return children;
  }

  // Verificar si es administrador (acceso total)
  const isAdmin = 
    user?.roles === 'admin' ||
    user?.roles?.name === 'Administrador' ||
    user?.email === 'admin@admin.com' ||
    user?.email === 'admin@inventario.com';
  
  if (isAdmin) {
    console.log('✅ PrivateRoute: Usuario es admin, acceso total');
    return children;
  }

  // Obtener permisos del usuario
  const userPermissions = user?.roles?.permissions || [];
  
  // DEBUG: Mostrar estructura completa del usuario
  console.log('🔍 DEBUG - Estructura del usuario:', {
    userExists: !!user,
    rolesExists: !!user?.roles,
    rolesType: typeof user?.roles,
    rolesContent: user?.roles,
    permissionsRaw: userPermissions,
    permissionsType: typeof userPermissions
  });
  
  // Manejar permisos como string o array
  let permissions = [];
  if (typeof userPermissions === 'string') {
    try {
      permissions = JSON.parse(userPermissions);
      console.log('✅ Permisos parseados desde string:', permissions);
    } catch (e) {
      console.error('❌ Error parseando permisos:', e);
      permissions = [];
    }
  } else if (Array.isArray(userPermissions)) {
    permissions = userPermissions;
    console.log('✅ Permisos ya son array:', permissions);
  } else {
    console.warn('⚠️ Permisos en formato desconocido:', userPermissions);
  }

  console.log('🔍 PrivateRoute: Verificando permiso', {
    requiredPermission,
    userPermissions: permissions,
    granularMode: FEATURES.GRANULAR_PERMISSIONS,
    currentRoute: location.pathname
  });

  // Verificar si tiene el permiso requerido
  let hasPermission = false;
  
  if (FEATURES.GRANULAR_PERMISSIONS) {
    // MODO GRANULAR: Verificar usando lógica jerárquica
    // Un usuario puede tener el permiso padre (ej: "dashboard") o el hijo específico (ej: "dashboard.alerts")
    hasPermission = permissions.some(userPerm => {
      // Si el usuario tiene el permiso exacto requerido
      if (userPerm === requiredPermission) {
        return true;
      }
      
      // Si el usuario tiene el permiso padre del requerido
      // Ej: usuario tiene "dashboard", ruta requiere "dashboard.alerts"
      if (requiredPermission.startsWith(userPerm + '.')) {
        return true;
      }
      
      // Si el usuario tiene un permiso hijo y la ruta requiere el padre
      // Ej: usuario tiene "dashboard.alerts", ruta requiere "dashboard"
      if (userPerm.startsWith(requiredPermission + '.')) {
        return true;
      }
      
      return false;
    });
    
    console.log('🔍 PrivateRoute (GRANULAR):', { hasPermission });
  } else {
    // MODO SIMPLE: Verificación directa
    hasPermission = permissions.includes(requiredPermission);
    console.log('🔍 PrivateRoute (SIMPLE):', { hasPermission });
  }

  if (!hasPermission) {
    console.log('❌ PrivateRoute: Sin permiso, mostrando acceso denegado');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '40px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          background: 'white',
          padding: '48px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔒</div>
          <h1 style={{ 
            fontSize: '28px', 
            color: '#2c3e50', 
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            Acceso Denegado
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#6c757d', 
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            No tienes permisos para acceder a esta página.
          </p>
          <div style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#495057',
              margin: '0 0 8px 0'
            }}>
              <strong>Usuario:</strong> {user?.name}
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#495057',
              margin: '0 0 8px 0'
            }}>
              <strong>Rol:</strong> {user?.roles?.name || user?.roles || 'Sin rol'}
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#495057',
              margin: '0'
            }}>
              <strong>Permiso requerido:</strong> {requiredPermission}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                // Obtener permisos del usuario
                const userPermissions = user?.roles?.permissions || [];
                const permissions = typeof userPermissions === 'string' 
                  ? JSON.parse(userPermissions) 
                  : userPermissions;

                console.log('🔍 Permisos del usuario:', permissions);

                // Intentar encontrar la primera ruta accesible
                let targetRoute = null;

                // Primero intentar el startPanel configurado
                const startPanel = user?.roles?.startPanel || '/dashboard';
                if (FEATURES.GRANULAR_PERMISSIONS) {
                  if (hasAccessToRoute(startPanel, permissions)) {
                    targetRoute = startPanel;
                  }
                } else {
                  targetRoute = startPanel;
                }

                // Si el startPanel no es accesible, buscar la primera ruta que sí lo sea
                if (!targetRoute && FEATURES.GRANULAR_PERMISSIONS) {
                  for (const permission of permissions) {
                    const routes = getRoutesForPermission(permission);
                    if (routes.length > 0) {
                      targetRoute = routes[0];
                      console.log(`✅ Ruta accesible encontrada: ${targetRoute} (permiso: ${permission})`);
                      break;
                    }
                  }
                }

                // Fallback final
                if (!targetRoute) {
                  targetRoute = '/dashboard';
                }

                console.log('🏠 Redirigiendo a:', targetRoute);
                navigate(targetRoute);
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🏠 Ir al inicio
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                padding: '12px 24px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado y con permisos, mostrar contenido
  console.log('✅ PrivateRoute: Usuario tiene permiso, mostrando contenido');
  return children;
}


