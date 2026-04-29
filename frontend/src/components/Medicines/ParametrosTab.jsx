import { useState, useEffect } from 'react';
import api from '../../api/http';
import ComboBox from '../ComboBox';

const ParametrosTab = ({ medicines, onRefresh, loading }) => {
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [selectedMedicineObj, setSelectedMedicineObj] = useState(null);
  const [parametros, setParametros] = useState({
    stockMinimo: 10,
    alertaCaducidad: 30,
    tiempoSinMovimiento: 90
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    
    setSaving(true);
    try {
      await api.put(`/medicines/${selectedMedicine}/parametros`, parametros);
      alert('Parámetros actualizados correctamente');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.response?.data?.error || 'Error al actualizar parámetros';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const loadParametros = async () => {
    if (!selectedMedicine) return;
    try {
      const { data } = await api.get(`/medicines/${selectedMedicine}`);
      console.log('📊 Datos del medicamento:', data);
      console.log('📊 Parámetros recibidos:', data.parametros);
      
      if (data.parametros) {
        // parametros es un objeto, no un array (relación 1-a-1)
        setParametros({
          stockMinimo: data.parametros.stockMinimo || 10,
          alertaCaducidad: data.parametros.alertaCaducidad || 30,
          tiempoSinMovimiento: data.parametros.tiempoSinMovimiento || 90
        });
        console.log('✅ Parámetros cargados:', {
          stockMinimo: data.parametros.stockMinimo,
          alertaCaducidad: data.parametros.alertaCaducidad,
          tiempoSinMovimiento: data.parametros.tiempoSinMovimiento
        });
      } else {
        // Si no hay parámetros, usar valores por defecto
        setParametros({
          stockMinimo: 10,
          alertaCaducidad: 30,
          tiempoSinMovimiento: 90
        });
        console.log('⚠️ No hay parámetros, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ Error cargando parámetros:', error);
    }
  };

  useEffect(() => {
    loadParametros();
  }, [selectedMedicine]);

  return (
    <div style={{ 
      padding: '24px 0', 
      flex: 1, 
      overflow: 'auto',
      minHeight: '0'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 24px' }}>
        <h3 style={{ color: '#495057', marginBottom: '24px', textAlign: 'center' }}>
          Configuración de Parámetros
        </h3>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#495057' }}>
            Seleccionar Medicamento
          </label>
          <ComboBox
            items={medicines}
            value={selectedMedicineObj}
            onChange={(m) => {
              setSelectedMedicineObj(m || null);
              setSelectedMedicine(m?.id ? String(m.id) : '');
            }}
            getItemKey={(m) => m.id}
            getItemLabel={(m) => `${m.codigo} - ${m.nombreComercial}`}
            inputPlaceholder="Escribe nombre o código..."
            maxResults={30}
            styles={{
              input: {
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px'
              }
            }}
          />
        </div>

        {selectedMedicine && (
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#f8f9fa',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#495057' }}>
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  value={parametros.stockMinimo}
                  onChange={(e) => setParametros({...parametros, stockMinimo: parseInt(e.target.value)})}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  Cantidad mínima de unidades en stock antes de generar alerta
                </small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#495057' }}>
                  Alerta de Caducidad (días)
                </label>
                <input
                  type="number"
                  value={parametros.alertaCaducidad}
                  onChange={(e) => setParametros({...parametros, alertaCaducidad: parseInt(e.target.value)})}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  Días antes del vencimiento para generar alerta
                </small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#495057' }}>
                  Tiempo sin Movimiento (días)
                </label>
                <input
                  type="number"
                  value={parametros.tiempoSinMovimiento}
                  onChange={(e) => setParametros({...parametros, tiempoSinMovimiento: parseInt(e.target.value)})}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  Días sin movimiento antes de generar alerta
                </small>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Parámetros'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ParametrosTab;
