import { useState, useEffect } from 'react';

// Lista de paneles del programa
const paneles = [
  { id: 'dashboard', name: 'Panel de Datos' },
  { id: 'admin', name: 'Administración' },
  { id: 'medicines', name: 'Medicamentos' },
  { id: 'customers', name: 'Clientes' },
  { id: 'suppliers', name: 'Proveedores' },
  { id: 'receipts', name: 'Entradas' },
  { id: 'sales', name: 'Salidas' },
  { id: 'finance', name: 'Finanzas' },
  { id: 'users', name: 'Gestión de Usuarios' }
];

const RoleModal = ({ role, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startPanel: '/dashboard'
  });
  const [selectedPanels, setSelectedPanels] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        startPanel: role.startPanel || '/dashboard'
      });
      
      // Parse permissions
      let perms = [];
      if (role.permissions) {
        try {
          perms = typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions) 
            : role.permissions;
        } catch {
          perms = [];
        }
      }
      setSelectedPanels(Array.isArray(perms) ? perms : []);
    }
  }, [role]);

  const handlePanelToggle = (panelId) => {
    setSelectedPanels(prev => 
      prev.includes(panelId)
        ? prev.filter(p => p !== panelId)
        : [...prev, panelId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSave({
        ...formData,
        permissions: JSON.stringify(selectedPanels)
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el rol');
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
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
            {role ? '✏️ Editar Rol' : '➕ Crear Rol'}
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
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Nombre del rol *
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
              placeholder="Ej: Vendedor"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                minHeight: '80px',
                resize: 'vertical'
              }}
              placeholder="Descripción del rol..."
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>
              Paneles del programa con acceso *
            </label>
            
            <div style={{ 
              border: '2px solid #e2e8f0', 
              borderRadius: '12px',
              padding: '16px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {paneles.map((panel) => (
                <label 
                  key={panel.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    background: selectedPanels.includes(panel.id) ? '#dbeafe' : '#f8fafc',
                    border: `2px solid ${selectedPanels.includes(panel.id) ? '#3b82f6' : '#e2e8f0'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPanels.includes(panel.id)}
                    onChange={() => handlePanelToggle(panel.id)}
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: selectedPanels.includes(panel.id) ? '#1e40af' : '#475569'
                  }}>
                    {panel.name}
                  </span>
                </label>
              ))}
            </div>
            
            <div style={{ 
              marginTop: '12px', 
              fontSize: '13px', 
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Paneles seleccionados: {selectedPanels.length} de {paneles.length}</span>
              <button
                type="button"
                onClick={() => setSelectedPanels(selectedPanels.length === paneles.length ? [] : paneles.map(p => p.id))}
                style={{
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                {selectedPanels.length === paneles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
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
              disabled={loading || selectedPanels.length === 0}
              style={{
                flex: 1,
                padding: '12px',
                background: (loading || selectedPanels.length === 0) ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (loading || selectedPanels.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Guardando...' : (role ? 'Actualizar Rol' : 'Crear Rol')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleModal;


