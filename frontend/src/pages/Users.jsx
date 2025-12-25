import { useState, useEffect } from 'react';
import api from '../api/http';
import UserModal from '../components/UserModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ]);
      setUsers(usersRes.data.data || usersRes.data || []);
      setRoles(rolesRes.data.data || rolesRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      loadData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error al eliminar el usuario');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, {
        isActive: !user.isActive
      });
      loadData();
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Error al actualizar el usuario');
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userData);
      } else {
        await api.post('/users', userData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Error saving user:', err);
      throw err;
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Cargando usuarios...</p>
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
            👥 Gestión de Usuarios
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#7f8c8d' }}>
            Administra los usuarios del sistema
          </p>
        </div>
        <button
          onClick={handleCreateUser}
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
          ➕ Nuevo Usuario
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

      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Usuario</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Rol</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Estado</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr 
                key={user.id}
                style={{ 
                  borderBottom: '1px solid #e2e8f0',
                  background: index % 2 === 0 ? 'white' : '#f8fafc'
                }}
              >
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '500' }}>{user.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#64748b' }}>{user.email}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: user.role?.name === 'Administrador' || user.role === 'admin' ? '#dbeafe' : '#f1f5f9',
                    color: user.role?.name === 'Administrador' || user.role === 'admin' ? '#1d4ed8' : '#475569'
                  }}>
                    {user.role?.name || user.role || 'Sin rol'}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleActive(user)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: user.isActive ? '#dcfce7' : '#fee2e2',
                      color: user.isActive ? '#16a34a' : '#dc2626'
                    }}
                  >
                    {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                  </button>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEditUser(user)}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
            <p>No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          roles={roles}
          onSave={handleSaveUser}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Users;


