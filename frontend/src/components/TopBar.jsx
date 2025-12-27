import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/http';
import ProfileModalSimple from './ProfileModalSimple';

/**
 * TopBar - Barra superior con búsqueda, notificaciones, métricas y usuario
 * 
 * Características:
 * - Búsqueda global (medicamentos, clientes, facturas)
 * - Notificaciones en tiempo real
 * - Métricas rápidas
 * - Menú de usuario con opciones
 * - Diseño con gradiente
 * - Responsive
 */
const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [metrics, setMetrics] = useState({
    totalMedicines: 0,
    activeAlerts: 0,
    unreadNotifications: 0
  });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Refs para cerrar dropdowns al hacer click fuera
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Actualizar fecha/hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar notificaciones y métricas al montar
  useEffect(() => {
    loadNotifications();
    loadMetrics();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadNotifications();
      loadMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      const response = await api.get('/topbar/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Datos de ejemplo si falla
      setNotifications([
        {
          id: 1,
          type: 'warning',
          icon: '⚠️',
          title: '5 medicamentos por vencer',
          message: 'Vencen en los próximos 7 días',
          time: 'Hace 2 horas',
          read: false
        },
        {
          id: 2,
          type: 'danger',
          icon: '📉',
          title: 'Stock bajo: Aspirina',
          message: 'Solo quedan 10 unidades',
          time: 'Hace 5 horas',
          read: false
        },
        {
          id: 3,
          type: 'success',
          icon: '✅',
          title: 'Entrada registrada',
          message: 'Se registraron 50 productos',
          time: 'Hace 1 día',
          read: true
        }
      ]);
    }
  };

  // Cargar métricas
  const loadMetrics = async () => {
    try {
      const response = await api.get('/topbar/metrics');
      const data = response.data.data || {};
      
      setMetrics({
        totalMedicines: data.totalMedicines || 0,
        activeAlerts: data.activeAlerts || 0,
        unreadNotifications: notifications.filter(n => !n.read).length
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      // Datos de ejemplo si falla
      setMetrics({
        totalMedicines: 125,
        activeAlerts: 8,
        unreadNotifications: 3
      });
    }
  };

  // Búsqueda global
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setLoadingSearch(true);
    setShowSearchResults(true);

    try {
      const response = await api.get(`/topbar/search?q=${encodeURIComponent(query)}`);
      console.log('🔍 Respuesta del backend:', response.data);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Navegar a resultado de búsqueda
  const handleResultClick = (path) => {
    console.log('🔍 Click en resultado, navegando a:', path);
    console.log('🔍 Resultado completo:', path);
    navigate(path);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/topbar/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Formatear fecha y hora: "27 Dic 14:35"
  const formatDateTime = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = currentTime.getDate();
    const month = months[currentTime.getMonth()];
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${hours}:${minutes}`;
  };

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: '70px',
      background: '#2c3e50',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Logo + Nombre */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '220px',
        cursor: 'pointer'
      }}
      onClick={() => navigate('/dashboard')}
      >
        <span style={{ fontSize: '28px' }}>🏥</span>
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'white',
          whiteSpace: 'nowrap'
        }}>
          Inventario Meds
        </span>
      </div>

      {/* Búsqueda Global */}
      <div ref={searchRef} style={{
        flex: 1,
        maxWidth: '500px',
        position: 'relative'
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            fontSize: '18px',
            color: '#94a3b8'
          }}>
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar medicamento, cliente, factura..."
            style={{
              width: '100%',
              padding: '10px 16px 10px 44px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              background: 'rgba(255,255,255,0.95)',
              outline: 'none',
              transition: 'all 0.2s',
              boxShadow: showSearchResults ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
            }}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          />
        </div>

        {/* Resultados de búsqueda */}
        {showSearchResults && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1001
          }}>
            {loadingSearch ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                Buscando...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultClick(result.path)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #e2e8f0' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <span style={{ fontSize: '24px' }}>{result.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      {result.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {result.subtitle}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Métricas Rápidas */}
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        {/* Total Medicamentos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => navigate('/medicines')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          title="Total de medicamentos"
        >
          <span style={{ fontSize: '18px' }}>💊</span>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
            {metrics.totalMedicines}
          </span>
        </div>

        {/* Alertas Activas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          title="Alertas activas"
        >
          <span style={{ fontSize: '18px' }}>📦</span>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
            {metrics.activeAlerts}
          </span>
        </div>
      </div>

      {/* Notificaciones */}
      <div ref={notificationsRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 12px',
            cursor: 'pointer',
            fontSize: '20px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          🔔
          {metrics.unreadNotifications > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {metrics.unreadNotifications}
            </span>
          )}
        </button>

        {/* Dropdown de notificaciones */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '360px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1001
          }}>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>
                Notificaciones
              </span>
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                {notifications.filter(n => !n.read).length} nuevas
              </span>
            </div>

            {/* Lista de notificaciones */}
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    background: notification.read ? 'white' : '#f8fafc'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notification.read ? 'white' : '#f8fafc'}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{notification.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: notification.read ? '500' : '700',
                        color: '#1e293b',
                        fontSize: '14px',
                        marginBottom: '4px'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {notification.time}
                      </div>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        marginTop: '6px'
                      }} />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748b'
              }}>
                No hay notificaciones
              </div>
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{
                padding: '12px 16px',
                textAlign: 'center',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/dashboard');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2c3e50',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fecha y Hora */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
        color: '#ecf0f1',
        padding: '0 16px',
        borderLeft: '1px solid rgba(255,255,255,0.15)',
        borderRight: '1px solid rgba(255,255,255,0.15)',
        whiteSpace: 'nowrap',
        fontWeight: '500'
      }}>
        📅 {formatDateTime()}
      </div>

      {/* Usuario */}
      <div ref={userMenuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          <span style={{ fontSize: '24px' }}>👤</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}>
              {user?.name || 'Usuario'}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '11px',
              whiteSpace: 'nowrap'
            }}>
              {user?.roles?.name || user?.role?.name || 'Sin rol'}
            </div>
          </div>
          <span style={{ color: 'white', fontSize: '12px' }}>▼</span>
        </button>

        {/* Dropdown de usuario */}
        {showUserMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '240px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 1001
          }}>
            {/* Header del menú */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                {user?.name || 'Usuario'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {user?.email || 'email@example.com'}
              </div>
              <div style={{
                marginTop: '8px',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '6px',
                fontSize: '11px',
                display: 'inline-block'
              }}>
                🏷️ {user?.roles?.name || user?.role?.name || 'Sin rol'}
              </div>
            </div>

            {/* Opciones del menú */}
            <div style={{ padding: '8px' }}>
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setShowUserMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  color: '#2c3e50',
                  transition: 'background 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <span style={{ fontSize: '18px' }}>🔑</span>
                <span>Cambiar Contraseña</span>
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  color: '#ef4444',
                  transition: 'background 0.2s',
                  textAlign: 'left',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '18px' }}>🚪</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ProfileModalSimple - TEMPORAL hasta resolver el problema */}
      <ProfileModalSimple
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default TopBar;

