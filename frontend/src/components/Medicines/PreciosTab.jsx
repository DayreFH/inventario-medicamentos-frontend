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
  
  // Estados para Precio de Venta MN
  const [precioVentaMNForm, setPrecioVentaMNForm] = useState({
    precioVentaMN: ''
  });
  const [preciosVentaMN, setPreciosVentaMN] = useState([]);
  
  const [suppliers, setSuppliers] = useState([]);
  const [savingCompraDOP, setSavingCompraDOP] = useState(false);
  const [savingVentaMN, setSavingVentaMN] = useState(false);

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
    if (selectedMedicine) {
      loadPrecios();
      // Limpiar formularios
      setPrecioCompraDOPForm({ precioCompraUnitario: '', supplierId: '' });
      setPrecioVentaMNForm({ precioVentaMN: '' });
    } else {
      setPreciosCompraDOP([]);
      setPreciosVentaMN([]);
    }
  }, [selectedMedicine]);

  // SUBMIT: Precio de Compra DOP
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
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al guardar precio';
      alert(msg);
    } finally {
      setSavingCompraDOP(false);
    }
  };

  // SUBMIT: Precio de Venta MN
  const handleSubmitVentaMN = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    
    setSavingVentaMN(true);
    try {
      await api.post(`/medicines/${selectedMedicine}/precios-venta-mn`, {
        precioVentaMN: precioVentaMNForm.precioVentaMN
      });
      
      setPrecioVentaMNForm({ precioVentaMN: '' });
      loadPrecios();
      alert('Precio de venta MN agregado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al guardar precio de venta';
      alert(msg);
    } finally {
      setSavingVentaMN(false);
    }
  };

  // DELETE: Precio de Compra DOP
  const handleDeleteCompraDOP = async (precioId) => {
    if (!window.confirm('¿Está seguro de que desea desactivar este precio de compra?')) {
      return;
    }
    
    try {
      await api.delete(`/medicines/precios/${precioId}`);
      loadPrecios();
      alert('Precio de compra desactivado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al desactivar precio';
      alert(msg);
    }
  };

  // DELETE: Precio de Venta MN
  const handleDeleteVentaMN = async (precioId) => {
    if (!window.confirm('¿Está seguro de que desea desactivar este precio de venta?')) {
      return;
    }
    
    try {
      await api.delete(`/medicines/precios-venta-mn/${precioId}`);
      loadPrecios();
      alert('Precio de venta MN desactivado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al desactivar precio de venta';
      alert(msg);
    }
  };

  // REACTIVAR: Precio de Compra DOP
  const handleReactivarCompraDOP = async (precioId) => {
    if (!window.confirm('¿Está seguro de que desea reactivar este precio de compra?')) {
      return;
    }
    
    try {
      await api.put(`/medicines/precios/${precioId}/reactivar`);
      loadPrecios();
      alert('Precio de compra reactivado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al reactivar precio';
      alert(msg);
    }
  };

  // REACTIVAR: Precio de Venta MN
  const handleReactivarVentaMN = async (precioId) => {
    if (!window.confirm('¿Está seguro de que desea reactivar este precio de venta? Esto desactivará el precio activo actual.')) {
      return;
    }
    
    try {
      await api.put(`/medicines/precios-venta-mn/${precioId}/reactivar`);
      loadPrecios();
      alert('Precio de venta MN reactivado exitosamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al reactivar precio de venta';
      alert(msg);
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      flex: 1, 
      overflow: 'auto',
      minHeight: '0'
    }}>
      {/* Selector de Medicamento */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50', fontSize: '16px' }}>
          Seleccionar Medicamento
        </label>
        <select
          value={selectedMedicine}
          onChange={(e) => setSelectedMedicine(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '600px',
            padding: '12px 16px',
            border: '2px solid #3498db',
            borderRadius: '6px',
            fontSize: '15px',
            backgroundColor: 'white',
            fontWeight: '500'
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

      {/* DOS COLUMNAS: Compra DOP y Venta MN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* ========== COLUMNA IZQUIERDA: PRECIO DE COMPRA DOP ========== */}
        <div>
          <h3 style={{ 
            color: '#2c3e50', 
            marginBottom: '16px', 
            fontSize: '18px',
            fontWeight: '600',
            borderBottom: '3px solid #e74c3c',
            paddingBottom: '8px'
          }}>
            💵 Precio de Compra (DOP)
          </h3>
          
          {selectedMedicine && (
            <form onSubmit={handleSubmitCompraDOP} style={{
              backgroundColor: '#fff5f5',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #e74c3c',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                    Proveedor (Opcional)
                  </label>
                  <select
                    value={precioCompraDOPForm.supplierId}
                    onChange={(e) => setPrecioCompraDOPForm({...precioCompraDOPForm, supplierId: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Sin proveedor específico</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Si no seleccionas un proveedor, el precio será genérico
                  </small>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                    Precio de Compra Unitario (DOP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioCompraDOPForm.precioCompraUnitario}
                    onChange={(e) => setPrecioCompraDOPForm({...precioCompraDOPForm, precioCompraUnitario: e.target.value})}
                    required
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e74c3c',
                      borderRadius: '4px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingCompraDOP}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: savingCompraDOP ? 'not-allowed' : 'pointer',
                    opacity: savingCompraDOP ? 0.7 : 1
                  }}
                >
                  {savingCompraDOP ? 'Guardando...' : '➕ Agregar Precio de Compra'}
                </button>
              </div>
            </form>
          )}

          {/* Historial de Precios de Compra DOP */}
          <div>
            <h4 style={{ color: '#2c3e50', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
              📋 Historial de Precios de Compra (DOP)
            </h4>
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {!selectedMedicine ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  Selecciona un medicamento
                </div>
              ) : preciosCompraDOP.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  No hay precios de compra registrados
                </div>
              ) : (
                <div style={{ padding: '12px' }}>
                  {preciosCompraDOP.map((precio) => (
                    <div
                      key={precio.id}
                      style={{
                        backgroundColor: precio.activo ? 'white' : '#f8d7da',
                        padding: '14px',
                        marginBottom: '10px',
                        borderRadius: '6px',
                        border: precio.activo ? '2px solid #e74c3c' : '1px solid #f5c6cb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                            {precio.supplier ? `Proveedor: ${precio.supplier.name}` : 'Precio genérico'}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c', marginBottom: '4px' }}>
                            DOP ${parseFloat(precio.precioCompraUnitario).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6c757d' }}>
                            Creado: {new Date(precio.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <div style={{
                            backgroundColor: precio.activo ? '#d4edda' : '#f8d7da',
                            color: precio.activo ? '#155724' : '#721c24',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
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
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
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
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
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

        {/* ========== COLUMNA DERECHA: PRECIO DE VENTA MN ========== */}
        <div>
          <h3 style={{ 
            color: '#2c3e50', 
            marginBottom: '16px', 
            fontSize: '18px',
            fontWeight: '600',
            borderBottom: '3px solid #27ae60',
            paddingBottom: '8px'
          }}>
            💰 Precio de Venta (MN)
          </h3>
          
          {selectedMedicine && (
            <form onSubmit={handleSubmitVentaMN} style={{
              backgroundColor: '#f0fff4',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #27ae60',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                    Precio de Venta (MN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioVentaMNForm.precioVentaMN}
                    onChange={(e) => setPrecioVentaMNForm({...precioVentaMNForm, precioVentaMN: e.target.value})}
                    required
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #27ae60',
                      borderRadius: '4px',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  />
                  <small style={{ color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Este precio es obligatorio para ventas en MN
                  </small>
                </div>

                <button
                  type="submit"
                  disabled={savingVentaMN}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: savingVentaMN ? 'not-allowed' : 'pointer',
                    opacity: savingVentaMN ? 0.7 : 1
                  }}
                >
                  {savingVentaMN ? 'Guardando...' : '➕ Agregar Precio de Venta'}
                </button>
              </div>
            </form>
          )}

          {/* Historial de Precios de Venta MN */}
          <div>
            <h4 style={{ color: '#2c3e50', marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
              📋 Historial de Precios de Venta (MN)
            </h4>
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {!selectedMedicine ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  Selecciona un medicamento
                </div>
              ) : preciosVentaMN.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  No hay precios de venta registrados
                </div>
              ) : (
                <div style={{ padding: '12px' }}>
                  {preciosVentaMN.map((precio) => (
                    <div
                      key={precio.id}
                      style={{
                        backgroundColor: precio.activo ? 'white' : '#f8d7da',
                        padding: '14px',
                        marginBottom: '10px',
                        borderRadius: '6px',
                        border: precio.activo ? '2px solid #27ae60' : '1px solid #f5c6cb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                            Precio de Venta MN
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#27ae60', marginBottom: '4px' }}>
                            MN ${parseFloat(precio.precioVentaMN).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6c757d' }}>
                            Creado: {new Date(precio.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <div style={{
                            backgroundColor: precio.activo ? '#d4edda' : '#f8d7da',
                            color: precio.activo ? '#155724' : '#721c24',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
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
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
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
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
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
    </div>
  );
};

export default PreciosTab;
