import { useState, useEffect } from 'react';
import api from '../../api/http';

const PreciosTab = ({ medicines, onRefresh, loading }) => {
  const [selectedMedicine, setSelectedMedicine] = useState('');
  
  // Estados para Precio de Compra DOP
  const [precioCompraDOPForm, setPrecioCompraDOPForm] = useState({
    precioCompraUnitario: '',
    supplierId: ''
  });
  const [preciosCompraDOP, setPreciosCompraDOP] = useState([]);
  const [savingCompraDOP, setSavingCompraDOP] = useState(false);
  
  // Estados para Precio de Venta MN
  const [precioVentaMNForm, setPrecioVentaMNForm] = useState({
    precioVentaMN: ''
  });
  const [preciosVentaMN, setPreciosVentaMN] = useState([]);
  const [savingVentaMN, setSavingVentaMN] = useState(false);
  
  const [suppliers, setSuppliers] = useState([]);

  // Cargar proveedores
  const loadSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Cargar precios cuando se selecciona un medicamento
  const loadPrecios = async () => {
    if (!selectedMedicine) return;
    try {
      const { data } = await api.get(`/medicines/${selectedMedicine}`);
      setPreciosCompraDOP(data.precios || []);
      setPreciosVentaMN(data.preciosVentaMN || []);
    } catch (error) {
      console.error('Error cargando precios:', error);
    }
  };

  useEffect(() => {
    loadPrecios();
  }, [selectedMedicine]);

  // ============================================
  // HANDLERS PARA PRECIO DE COMPRA DOP
  // ============================================
  const handleSubmitCompraDOP = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    
    setSavingCompraDOP(true);
    try {
      await api.post(`/medicines/${selectedMedicine}/precios`, {
        precioCompraUnitario: precioCompraDOPForm.precioCompraUnitario,
        supplierId: precioCompraDOPForm.supplierId || null
      });
      
      setPrecioCompraDOPForm({
        precioCompraUnitario: '',
        supplierId: ''
      });
      loadPrecios();
      alert('Precio de compra agregado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al guardar precio de compra';
      alert(msg);
    } finally {
      setSavingCompraDOP(false);
    }
  };

  const handleDeleteCompraDOP = async (precioId) => {
    if (!window.confirm('¿Desactivar este precio de compra?')) {
      return;
    }
    
    try {
      await api.delete(`/medicines/precios/${precioId}`);
      loadPrecios();
      alert('Precio de compra desactivado');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al desactivar';
      alert(msg);
    }
  };

  const handleReactivarCompraDOP = async (precioId) => {
    if (!window.confirm('¿Reactivar este precio de compra?')) {
      return;
    }
    
    try {
      await api.put(`/medicines/precios/${precioId}/reactivar`);
      loadPrecios();
      alert('Precio de compra reactivado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al reactivar';
      alert(msg);
    }
  };

  // ============================================
  // HANDLERS PARA PRECIO DE VENTA MN
  // ============================================
  const handleSubmitVentaMN = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    
    // Validación: el precio debe ser mayor a 0
    const precio = parseFloat(precioVentaMNForm.precioVentaMN);
    if (isNaN(precio) || precio <= 0) {
      alert('El precio de venta MN debe ser mayor a 0');
      return;
    }
    
    setSavingVentaMN(true);
    try {
      await api.post(`/medicines/${selectedMedicine}/precios-venta-mn`, {
        precioVentaMN: precioVentaMNForm.precioVentaMN
      });
      
      setPrecioVentaMNForm({
        precioVentaMN: ''
      });
      loadPrecios();
      alert('Precio de venta MN agregado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al guardar precio de venta MN';
      alert(msg);
    } finally {
      setSavingVentaMN(false);
    }
  };

  const handleDeleteVentaMN = async (precioId) => {
    if (!window.confirm('¿Desactivar este precio de venta?')) {
      return;
    }
    
    try {
      await api.delete(`/medicines/precios-venta-mn/${precioId}`);
      loadPrecios();
      alert('Precio de venta MN desactivado');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al desactivar';
      alert(msg);
    }
  };

  const handleReactivarVentaMN = async (precioId) => {
    if (!window.confirm('¿Reactivar este precio de venta? El precio activo actual será desactivado.')) {
      return;
    }
    
    try {
      await api.put(`/medicines/precios-venta-mn/${precioId}/reactivar`);
      loadPrecios();
      alert('Precio de venta MN reactivado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al reactivar';
      alert(msg);
    }
  };

  return (
    <div style={{ 
      padding: '24px 0', 
      flex: 1, 
      overflow: 'auto',
      minHeight: '0'
    }}>
      <div style={{ padding: '0 24px' }}>
        {/* Selector de medicamento */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#495057' }}>
            Seleccionar Medicamento
          </label>
          <select
            value={selectedMedicine}
            onChange={(e) => setSelectedMedicine(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Seleccionar medicamento...</option>
            {medicines.map(medicine => (
              <option key={medicine.id} value={medicine.id}>
                {medicine.codigo} - {medicine.nombreComercial}
              </option>
            ))}
          </select>
        </div>

        {selectedMedicine && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* ============================================ */}
            {/* COLUMNA IZQUIERDA: PRECIO DE COMPRA (DOP) */}
            {/* ============================================ */}
            <div style={{ 
              backgroundColor: '#fff8f0', 
              padding: '20px', 
              borderRadius: '8px',
              border: '2px solid #ffc107'
            }}>
              <h3 style={{ 
                color: '#856404', 
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                💰 Precio de Compra (DOP)
              </h3>

              {/* Formulario de Compra DOP */}
              <form onSubmit={handleSubmitCompraDOP} style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057', fontSize: '13px' }}>
                      Proveedor (Opcional)
                    </label>
                    <select
                      value={precioCompraDOPForm.supplierId}
                      onChange={(e) => setPrecioCompraDOPForm({...precioCompraDOPForm, supplierId: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '13px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">Sin proveedor</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057', fontSize: '13px' }}>
                      Precio Compra (DOP) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={precioCompraDOPForm.precioCompraUnitario}
                      onChange={(e) => setPrecioCompraDOPForm({...precioCompraDOPForm, precioCompraUnitario: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingCompraDOP}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#ffc107',
                      color: '#856404',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: savingCompraDOP ? 'not-allowed' : 'pointer',
                      opacity: savingCompraDOP ? 0.7 : 1
                    }}
                  >
                    {savingCompraDOP ? 'Guardando...' : '+ Agregar Precio Compra'}
                  </button>
                </div>
              </form>

              {/* Historial de Precios de Compra DOP */}
              <div>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057', 
                  marginBottom: '12px' 
                }}>
                  Historial de Precios Compra
                </h4>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  {preciosCompraDOP.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                      Sin precios de compra
                    </div>
                  ) : (
                    <div style={{ padding: '12px' }}>
                      {preciosCompraDOP.map((precio) => (
                        <div
                          key={precio.id}
                          style={{
                            backgroundColor: '#f8f9fa',
                            padding: '12px',
                            marginBottom: '8px',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: '500', color: '#495057', marginBottom: '2px' }}>
                                {precio.supplier ? precio.supplier.name : 'Sin proveedor'}
                              </div>
                              <div style={{ fontSize: '15px', fontWeight: '600', color: '#856404', marginBottom: '2px' }}>
                                DOP ${parseFloat(precio.precioCompraUnitario).toFixed(2)}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                {new Date(precio.created_at).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                backgroundColor: precio.activo ? '#d4edda' : '#f8d7da',
                                color: precio.activo ? '#155724' : '#721c24',
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {precio.activo ? 'ACTIVO' : 'INACTIVO'}
                              </div>
                              {precio.activo ? (
                                <button
                                  onClick={() => handleDeleteCompraDOP(precio.id)}
                                  style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivarCompraDOP(precio.id)}
                                  style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reactivar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* COLUMNA DERECHA: PRECIO DE VENTA (MN) */}
            {/* ============================================ */}
            <div style={{ 
              backgroundColor: '#f0f8ff', 
              padding: '20px', 
              borderRadius: '8px',
              border: '2px solid #17a2b8'
            }}>
              <h3 style={{ 
                color: '#0c5460', 
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                💵 Precio de Venta (MN)
              </h3>

              {/* Formulario de Venta MN */}
              <form onSubmit={handleSubmitVentaMN} style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#495057', fontSize: '13px' }}>
                      Precio Venta (MN) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={precioVentaMNForm.precioVentaMN}
                      onChange={(e) => setPrecioVentaMNForm({...precioVentaMNForm, precioVentaMN: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    <small style={{ color: '#6c757d', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Solo puede haber 1 precio de venta MN activo
                    </small>
                  </div>

                  <button
                    type="submit"
                    disabled={savingVentaMN}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: savingVentaMN ? 'not-allowed' : 'pointer',
                      opacity: savingVentaMN ? 0.7 : 1
                    }}
                  >
                    {savingVentaMN ? 'Guardando...' : '+ Agregar Precio Venta'}
                  </button>
                </div>
              </form>

              {/* Historial de Precios de Venta MN */}
              <div>
                <h4 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#495057', 
                  marginBottom: '12px' 
                }}>
                  Historial de Precios Venta
                </h4>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  {preciosVentaMN.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d', fontSize: '13px' }}>
                      Sin precios de venta
                    </div>
                  ) : (
                    <div style={{ padding: '12px' }}>
                      {preciosVentaMN.map((precio) => (
                        <div
                          key={precio.id}
                          style={{
                            backgroundColor: '#f8f9fa',
                            padding: '12px',
                            marginBottom: '8px',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0c5460', marginBottom: '2px' }}>
                                MN ${parseFloat(precio.precioVentaMN).toFixed(2)}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                {new Date(precio.created_at).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                backgroundColor: precio.activo ? '#d4edda' : '#f8d7da',
                                color: precio.activo ? '#155724' : '#721c24',
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {precio.activo ? 'ACTIVO' : 'INACTIVO'}
                              </div>
                              {precio.activo ? (
                                <button
                                  onClick={() => handleDeleteVentaMN(precio.id)}
                                  style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivarVentaMN(precio.id)}
                                  style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reactivar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedMedicine && (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            color: '#6c757d',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            Selecciona un medicamento para gestionar sus precios
          </div>
        )}
      </div>
    </div>
  );
};

export default PreciosTab;
