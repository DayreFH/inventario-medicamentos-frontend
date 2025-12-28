import { useState, useEffect } from 'react';
import { PERMISSIONS_HIERARCHY } from '../config/permissionsConfig';

/**
 * Modal Jerárquico para Crear/Editar Roles
 * 
 * Características:
 * - Módulos expandibles/colapsables
 * - Selección inteligente (padre → hijos)
 * - UI visual con iconos
 * - Contador de permisos
 */
const RoleModalHierarchical = ({ role, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startPanel: '/dashboard'
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar datos del rol al editar
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
          const parsed = typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions) 
            : role.permissions;
          
          // Si es un array, usarlo directamente
          if (Array.isArray(parsed)) {
            perms = parsed;
          } 
          // Si es un objeto (permisos granulares), extraer las claves que tienen permisos true
          else if (typeof parsed === 'object' && parsed !== null) {
            perms = Object.keys(parsed).filter(key => {
              const permission = parsed[key];
              // Si el permiso tiene sub-permisos (view, create, etc.), verificar si alguno es true
              if (typeof permission === 'object' && permission !== null) {
                return Object.values(permission).some(v => v === true);
              }
              return permission === true;
            });
          }
        } catch (err) {
          console.error('Error parsing permissions:', err);
          perms = [];
        }
      }
      setSelectedPermissions(perms);
      
      // Auto-expandir módulos que tienen permisos seleccionados
      const expanded = {};
      Object.keys(PERMISSIONS_HIERARCHY).forEach(moduleId => {
        const module = PERMISSIONS_HIERARCHY[moduleId];
        if (module.children.length > 0) {
          const hasSelectedChild = module.children.some(child => 
            perms.includes(child.id)
          );
          if (hasSelectedChild || perms.includes(moduleId)) {
            expanded[moduleId] = true;
          }
        }
      });
      setExpandedModules(expanded);
    }
  }, [role]);

  // Toggle expandir/colapsar módulo
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Verificar si un módulo está completamente seleccionado
  const isModuleFullySelected = (moduleId) => {
    const module = PERMISSIONS_HIERARCHY[moduleId];
    
    if (module.children.length === 0) {
      // Módulo sin hijos
      return selectedPermissions.includes(moduleId);
    }
    
    // Módulo con hijos - verificar si todos están seleccionados
    return module.children.every(child => 
      selectedPermissions.includes(child.id)
    );
  };

  // Verificar si un módulo está parcialmente seleccionado
  const isModulePartiallySelected = (moduleId) => {
    const module = PERMISSIONS_HIERARCHY[moduleId];
    
    if (module.children.length === 0) {
      return false;
    }
    
    const selectedCount = module.children.filter(child => 
      selectedPermissions.includes(child.id)
    ).length;
    
    return selectedCount > 0 && selectedCount < module.children.length;
  };

  // Manejar click en módulo padre
  const handleModuleToggle = (moduleId) => {
    const module = PERMISSIONS_HIERARCHY[moduleId];
    
    if (module.children.length === 0) {
      // Módulo sin hijos - toggle simple
      setSelectedPermissions(prev => 
        prev.includes(moduleId)
          ? prev.filter(p => p !== moduleId)
          : [...prev, moduleId]
      );
    } else {
      // Módulo con hijos - seleccionar/deseleccionar todos
      const allChildIds = module.children.map(c => c.id);
      const allSelected = allChildIds.every(id => selectedPermissions.includes(id));
      
      if (allSelected) {
        // Deseleccionar todos los hijos
        setSelectedPermissions(prev => 
          prev.filter(p => !allChildIds.includes(p))
        );
      } else {
        // Seleccionar todos los hijos
        setSelectedPermissions(prev => {
          const newPerms = [...prev];
          allChildIds.forEach(id => {
            if (!newPerms.includes(id)) {
              newPerms.push(id);
            }
          });
          return newPerms;
        });
      }
    }
  };

  // Manejar click en sub-módulo
  const handleChildToggle = (childId) => {
    setSelectedPermissions(prev => 
      prev.includes(childId)
        ? prev.filter(p => p !== childId)
        : [...prev, childId]
    );
  };

  // Contar permisos totales disponibles
  const getTotalPermissionsCount = () => {
    let count = 0;
    Object.values(PERMISSIONS_HIERARCHY).forEach(module => {
      if (module.children.length === 0) {
        count += 1;
      } else {
        count += module.children.length;
      }
    });
    return count;
  };

  // Manejar submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validaciones
    if (!formData.name.trim()) {
      setError('El nombre del rol es requerido');
      setLoading(false);
      return;
    }

    if (selectedPermissions.length === 0) {
      setError('Debe seleccionar al menos un permiso');
      setLoading(false);
      return;
    }

    try {
      await onSave({
        ...formData,
        permissions: selectedPermissions // ← Enviar como ARRAY, no como STRING
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
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
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

        {/* Error */}
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
          {/* Nombre */}
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

          {/* Descripción */}
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

          {/* Panel de inicio */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Panel de inicio
            </label>
            <select
              value={formData.startPanel}
              onChange={(e) => setFormData({ ...formData, startPanel: e.target.value })}
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
              <option value="/dashboard">Dashboard</option>
              <option value="/sales">Salidas</option>
              <option value="/receipts">Entradas</option>
              <option value="/medicines">Medicamentos</option>
              <option value="/customers">Clientes</option>
            </select>
          </div>

          {/* Permisos Jerárquicos */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>
              Permisos del sistema *
            </label>
            
            <div style={{ 
              border: '2px solid #e2e8f0', 
              borderRadius: '12px',
              padding: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              background: '#f8fafc'
            }}>
              {Object.values(PERMISSIONS_HIERARCHY).map((module) => {
                const isFullySelected = isModuleFullySelected(module.id);
                const isPartiallySelected = isModulePartiallySelected(module.id);
                const isExpanded = expandedModules[module.id];
                const hasChildren = module.children.length > 0;

                return (
                  <div key={module.id} style={{ marginBottom: '12px' }}>
                    {/* Módulo Padre */}
                    <div style={{
                      background: 'white',
                      border: `2px solid ${isFullySelected ? '#3b82f6' : isPartiallySelected ? '#fbbf24' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '12px',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isFullySelected}
                          ref={input => {
                            if (input) {
                              input.indeterminate = isPartiallySelected;
                            }
                          }}
                          onChange={() => handleModuleToggle(module.id)}
                          style={{ 
                            width: '20px', 
                            height: '20px',
                            cursor: 'pointer'
                          }}
                        />
                        
                        {/* Icono y Nombre */}
                        <div 
                          style={{ 
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: hasChildren ? 'pointer' : 'default'
                          }}
                          onClick={() => hasChildren && toggleModule(module.id)}
                        >
                          <span style={{ fontSize: '20px' }}>{module.icon}</span>
                          <span style={{ 
                            fontWeight: '600',
                            color: isFullySelected ? '#1e40af' : '#475569',
                            fontSize: '14px'
                          }}>
                            {module.name}
                          </span>
                          {hasChildren && (
                            <span style={{ 
                              fontSize: '12px',
                              color: '#64748b',
                              marginLeft: '4px'
                            }}>
                              ({module.children.filter(c => selectedPermissions.includes(c.id)).length}/{module.children.length})
                            </span>
                          )}
                        </div>
                        
                        {/* Flecha expandir/colapsar */}
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => toggleModule(module.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '16px',
                              color: '#64748b',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          >
                            ▶
                          </button>
                        )}
                      </div>
                      
                      {/* Descripción del módulo */}
                      {module.description && (
                        <div style={{ 
                          marginTop: '8px',
                          marginLeft: '32px',
                          fontSize: '12px',
                          color: '#64748b'
                        }}>
                          {module.description}
                        </div>
                      )}
                    </div>

                    {/* Sub-módulos (hijos) */}
                    {hasChildren && isExpanded && (
                      <div style={{ 
                        marginLeft: '32px',
                        marginTop: '8px',
                        paddingLeft: '16px',
                        borderLeft: '2px solid #e2e8f0'
                      }}>
                        {module.children.map((child) => {
                          const isSelected = selectedPermissions.includes(child.id);
                          
                          return (
                            <div
                              key={child.id}
                              style={{
                                background: 'white',
                                border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                borderRadius: '6px',
                                padding: '10px 12px',
                                marginBottom: '6px',
                                transition: 'all 0.2s'
                              }}
                            >
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleChildToggle(child.id)}
                                  style={{ 
                                    width: '18px', 
                                    height: '18px',
                                    cursor: 'pointer'
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: isSelected ? '#1e40af' : '#475569'
                                  }}>
                                    {child.name}
                                  </div>
                                  {child.description && (
                                    <div style={{ 
                                      fontSize: '11px',
                                      color: '#64748b',
                                      marginTop: '2px'
                                    }}>
                                      {child.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Contador */}
            <div style={{ 
              marginTop: '12px', 
              fontSize: '13px', 
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f1f5f9',
              borderRadius: '6px'
            }}>
              <span>
                <strong style={{ color: '#3b82f6' }}>{selectedPermissions.length}</strong> de <strong>{getTotalPermissionsCount()}</strong> permisos seleccionados
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedPermissions.length === getTotalPermissionsCount()) {
                    setSelectedPermissions([]);
                  } else {
                    const allPerms = [];
                    Object.values(PERMISSIONS_HIERARCHY).forEach(module => {
                      if (module.children.length === 0) {
                        allPerms.push(module.id);
                      } else {
                        module.children.forEach(child => allPerms.push(child.id));
                      }
                    });
                    setSelectedPermissions(allPerms);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#475569',
                  fontWeight: '500'
                }}
              >
                {selectedPermissions.length === getTotalPermissionsCount() ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
          </div>

          {/* Botones */}
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
              disabled={loading || selectedPermissions.length === 0}
              style={{
                flex: 1,
                padding: '12px',
                background: (loading || selectedPermissions.length === 0) ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (loading || selectedPermissions.length === 0) ? 'not-allowed' : 'pointer'
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

export default RoleModalHierarchical;

