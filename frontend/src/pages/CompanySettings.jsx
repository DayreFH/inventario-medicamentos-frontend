import { useState, useEffect } from 'react';
import api from '../api/http';
import { DARK_HEADER } from '../styles/standardLayout';

const CompanySettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    rnc: '',
    address: '',
    phone: '',
    email: '',
    invoicePrefix: 'FAC',
    taxRate: 0,
    footerText: '',
    // Campos de NCF automático
    autoGenerateNCF: true,
    ncfType: 'B01',
    ncfPrefix: 'B01',
    ncfRangeStart: '',
    ncfRangeEnd: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/company');
      setSettings({
        companyName: data.companyName || '',
        rnc: data.rnc || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        invoicePrefix: data.invoicePrefix || 'FAC',
        taxRate: Number(data.taxRate) || 0,
        footerText: data.footerText || '',
        // Campos de NCF automático
        autoGenerateNCF: data.autoGenerateNCF !== undefined ? data.autoGenerateNCF : true,
        ncfType: data.ncfType || 'B01',
        ncfPrefix: data.ncfPrefix || 'B01',
        ncfRangeStart: data.ncfRangeStart || '',
        ncfRangeEnd: data.ncfRangeEnd || ''
      });
    } catch (error) {
      console.error('Error cargando configuración:', error);
      alert('Error al cargar la configuración de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validaciones
    if (!settings.companyName.trim()) {
      alert('El nombre de la empresa es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await api.put('/company', settings);
      alert('✅ Configuración guardada correctamente');
      loadSettings(); // Recargar para confirmar
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert(`Error al guardar: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={DARK_HEADER}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
            Administración · Datos de la Empresa
          </h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Cargando configuración...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={DARK_HEADER}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          Administración · Datos de la Empresa
        </h1>
      </div>

      {/* Información */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
          💡 <strong>Importante:</strong> Esta información aparecerá en todas las facturas que emitas.
          Asegúrate de que los datos sean correctos.
        </p>
      </div>

      {/* Formulario */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Columna izquierda: Información General */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b', 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e2e8f0'
          }}>
            📋 Información General
          </h2>

          {/* Nombre de la Empresa */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Ej: Farmacia San Juan"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* RNC */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              RNC / Cédula
            </label>
            <input
              type="text"
              value={settings.rnc}
              onChange={(e) => handleChange('rnc', e.target.value)}
              placeholder="Ej: 123-456789-0"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Dirección */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              Dirección
            </label>
            <textarea
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ej: Calle Principal #10, Santo Domingo"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Teléfono */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              Teléfono
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Ej: (809) 555-1234"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '0' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Ej: info@farmacia.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Columna derecha: Configuración de Facturas */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b', 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid #e2e8f0'
          }}>
            🧾 Configuración de Facturas
          </h2>

          {/* Prefijo de Factura */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              Prefijo de NCF
            </label>
            <input
              type="text"
              value={settings.invoicePrefix}
              onChange={(e) => handleChange('invoicePrefix', e.target.value)}
              placeholder="Ej: B01"
              maxLength={10}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
              Este prefijo se usará para generar los NCF automáticamente
            </p>
          </div>

          {/* ITBIS por defecto */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              ITBIS por defecto (%)
            </label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => handleChange('taxRate', e.target.value)}
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
              En República Dominicana el ITBIS estándar es 18%
            </p>
          </div>

          {/* Mensaje en Facturas */}
          <div style={{ marginBottom: '0' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#475569', 
              marginBottom: '8px' 
            }}>
              Mensaje en pie de factura
            </label>
            <textarea
              value={settings.footerText}
              onChange={(e) => handleChange('footerText', e.target.value)}
              placeholder="Ej: Gracias por su preferencia"
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
              Este mensaje aparecerá al final de cada factura
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de NCF Automático */}
      <div style={{
        marginTop: '24px',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1e293b', 
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          🔢 Configuración de NCF (Comprobante Fiscal)
        </h2>

        {/* Información sobre NCF */}
        <div style={{
          padding: '16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '13px', color: '#1e40af', margin: 0, lineHeight: '1.6' }}>
            💡 <strong>¿Qué es el NCF?</strong> Es el Número de Comprobante Fiscal requerido por la DGII en República Dominicana.
            Puedes activar la generación automática para que el sistema asigne el NCF secuencialmente.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Columna izquierda */}
          <div>
            {/* Activar NCF Automático */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '12px',
                backgroundColor: settings.autoGenerateNCF ? '#dcfce7' : '#f8fafc',
                border: `2px solid ${settings.autoGenerateNCF ? '#10b981' : '#e2e8f0'}`,
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={settings.autoGenerateNCF}
                  onChange={(e) => handleChange('autoGenerateNCF', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '12px',
                    cursor: 'pointer'
                  }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    Generar NCF automáticamente
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    El sistema asignará el NCF de forma secuencial
                  </div>
                </div>
              </label>
            </div>

            {/* Tipo de NCF */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#475569', 
                marginBottom: '8px' 
              }}>
                Tipo de NCF <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={settings.ncfType}
                onChange={(e) => {
                  handleChange('ncfType', e.target.value);
                  handleChange('ncfPrefix', e.target.value); // Sincronizar prefix
                }}
                disabled={!settings.autoGenerateNCF}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: settings.autoGenerateNCF ? 'white' : '#f1f5f9',
                  cursor: settings.autoGenerateNCF ? 'pointer' : 'not-allowed'
                }}
              >
                <option value="B01">B01 - Crédito Fiscal</option>
                <option value="B02">B02 - Consumidor Final</option>
                <option value="B14">B14 - Régimen Especial</option>
                <option value="B15">B15 - Gubernamental</option>
              </select>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
                Selecciona el tipo según tu autorización de la DGII
              </p>
            </div>

            {/* Prefijo NCF (readonly, se sincroniza con el tipo) */}
            <div style={{ marginBottom: '0' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#475569', 
                marginBottom: '8px' 
              }}>
                Prefijo NCF
              </label>
              <input
                type="text"
                value={settings.ncfPrefix}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b'
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
                Se sincroniza automáticamente con el tipo seleccionado
              </p>
            </div>
          </div>

          {/* Columna derecha */}
          <div>
            {/* Rango Autorizado - Inicio */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#475569', 
                marginBottom: '8px' 
              }}>
                Rango Autorizado - Inicio
              </label>
              <input
                type="text"
                value={settings.ncfRangeStart}
                onChange={(e) => handleChange('ncfRangeStart', e.target.value.toUpperCase())}
                placeholder="Ej: B0100000001"
                disabled={!settings.autoGenerateNCF}
                maxLength={11}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: settings.autoGenerateNCF ? 'white' : '#f1f5f9',
                  fontFamily: 'monospace'
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
                Primer NCF de tu rango autorizado por DGII
              </p>
            </div>

            {/* Rango Autorizado - Fin */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#475569', 
                marginBottom: '8px' 
              }}>
                Rango Autorizado - Fin
              </label>
              <input
                type="text"
                value={settings.ncfRangeEnd}
                onChange={(e) => handleChange('ncfRangeEnd', e.target.value.toUpperCase())}
                placeholder="Ej: B0100001000"
                disabled={!settings.autoGenerateNCF}
                maxLength={11}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: settings.autoGenerateNCF ? 'white' : '#f1f5f9',
                  fontFamily: 'monospace'
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
                Último NCF de tu rango autorizado por DGII
              </p>
            </div>

            {/* Advertencia sobre el rango */}
            <div style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '6px'
            }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: '1.5' }}>
                ⚠️ <strong>Importante:</strong> El sistema te alertará cuando estés cerca del límite del rango.
                Los rangos son opcionales pero recomendados para control.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vista Previa */}
      <div style={{
        marginTop: '24px',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1e293b', 
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          👁️ Vista Previa en Factura
        </h2>
        
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '16px', color: '#1e293b' }}>
              {settings.companyName || 'Mi Empresa'}
            </strong>
          </div>
          {settings.rnc && (
            <div style={{ fontSize: '14px', color: '#475569', marginBottom: '4px' }}>
              RNC: {settings.rnc}
            </div>
          )}
          {settings.address && (
            <div style={{ fontSize: '14px', color: '#475569', marginBottom: '4px' }}>
              {settings.address}
            </div>
          )}
          {settings.phone && (
            <div style={{ fontSize: '14px', color: '#475569', marginBottom: '4px' }}>
              Tel: {settings.phone}
            </div>
          )}
          {settings.email && (
            <div style={{ fontSize: '14px', color: '#475569', marginBottom: '4px' }}>
              Email: {settings.email}
            </div>
          )}
          {settings.footerText && (
            <div style={{ 
              marginTop: '16px', 
              paddingTop: '16px', 
              borderTop: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              {settings.footerText}
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
        <button
          onClick={loadSettings}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          🔄 Recargar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !settings.companyName.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: !settings.companyName.trim() ? '#cbd5e1' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: (!settings.companyName.trim() || saving) ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? '💾 Guardando...' : '✅ Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default CompanySettings;


