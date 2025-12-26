import { useState, useEffect } from 'react';
import api from '../api/http';
import RoleModal from '../components/RoleModal';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setShowModal(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('¿Estás seguro de eliminar este rol?')) return;
    
    try {
      await api.delete(`/roles/${roleId}`);
      loadRoles();
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Error al eliminar el rol');
    }
  };

  const handleSaveRole = async (roleData) => {
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, roleData);
      } else {
        await api.post('/roles', roleData);
      }
      setShowModal(false);
      loadRoles();
    } catch (err) {
      console.error('Error saving role:', err);
      throw err;
    }
  };

  const getPermissionsCount = (permissions) => {
    if (!permissions) return 0;
    try {
      const parsed = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
      return Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Cargando roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>
            🔐 Gestión de Roles
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#7f8c8d' }}>
            Administra los roles y permisos del sistema
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
          }}
        >
          ➕ Crear Rol
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        {roles.map((role) => (
          <div
            key={role.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              padding: '24px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>
                  {role.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                  {role.description || 'Sin descripción'}
                </p>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                background: role.name === 'Administrador' ? '#dbeafe' : '#f1f5f9',
                color: role.name === 'Administrador' ? '#1d4ed8' : '#475569'
              }}>
                {role.name === 'Administrador' ? '👑 Admin' : '👤 Usuario'}
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                <strong>Panel inicial:</strong> {role.startPanel || 'Dashboard'}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                <strong>Permisos:</strong> {getPermissionsCount(role.permissions)} módulos
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleEditRole(role)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => handleDeleteRole(role.id)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                disabled={role.name === 'Administrador'}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div style={{ 
          padding: '48px', 
          textAlign: 'center', 
          color: '#94a3b8',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <p>No hay roles creados</p>
          <button
            onClick={handleCreateRole}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Crear primer rol
          </button>
        </div>
      )}

      {showModal && (
        <RoleModal
          role={editingRole}
          onSave={handleSaveRole}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Roles;



