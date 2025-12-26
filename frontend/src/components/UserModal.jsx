import { useState, useEffect } from 'react';
import PasswordInput from './PasswordInput';

const UserModal = ({ user, roles, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // No prellenar contraseña
        roleId: user.roleId || user.roles?.id || '',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validaciones básicas
    if (!formData.name || !formData.email) {
      setError('Nombre y email son requeridos');
      setLoading(false);
      return;
    }

    if (!user && !formData.password) {
      setError('La contraseña es requerida para nuevos usuarios');
      setLoading(false);
      return;
    }

    // Validación fuerte de contraseña
    if (formData.password) {
      if (formData.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        setLoading(false);
        return;
      }
      if (!/[a-zA-Z]/.test(formData.password)) {
        setError('La contraseña debe incluir letras');
        setLoading(false);
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError('La contraseña debe incluir números');
        setLoading(false);
        return;
      }
    }

    try {
      // Preparar datos para enviar
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId ? parseInt(formData.roleId) : undefined,
        isActive: formData.isActive
      };

      // Solo incluir password si se proporcionó
      if (formData.password) {
        dataToSend.password = formData.password;
      }

      await onSave(dataToSend);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
            {user ? '✏️ Editar Usuario' : '➕ Crear Usuario'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#94a3b8'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Juan Pérez"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <PasswordInput
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!user}
            label={`Contraseña ${user ? '(dejar vacío para no cambiar)' : ''}`}
            placeholder="••••••••"
            showStrength={true}
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Rol
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="">Sin rol asignado</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '2px solid #e2e8f0'
            }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Usuario activo
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Guardando...' : (user ? 'Actualizar Usuario' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
