import { useState } from 'react';
import { PAGE_CONTAINER, DARK_HEADER, CONTENT_CONTAINER } from '../styles/standardLayout';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('facturacion');

  return (
    <div style={PAGE_CONTAINER}>
      {/* Header */}
      <div style={DARK_HEADER}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Informes / Reportes</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Gestión de reportes e informes del sistema
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        ...CONTENT_CONTAINER,
        padding: '0'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #e9ecef',
          padding: '0 16px',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('facturacion')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'facturacion' ? '#2c3e50' : 'transparent',
              color: activeTab === 'facturacion' ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'facturacion' ? '600' : '400',
              fontSize: '14px',
              borderRadius: '4px 4px 0 0',
              transition: 'all 0.2s'
            }}
          >
            📄 Facturación
          </button>
          <button
            onClick={() => setActiveTab('ventas')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'ventas' ? '#2c3e50' : 'transparent',
              color: activeTab === 'ventas' ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'ventas' ? '600' : '400',
              fontSize: '14px',
              borderRadius: '4px 4px 0 0',
              transition: 'all 0.2s'
            }}
          >
            💰 Registro de Ventas
          </button>
        </div>

        {/* Tab Content */}
        <div style={{
          flex: 1,
          backgroundColor: '#ffffff',
          padding: '24px',
          overflow: 'auto'
        }}>
          {activeTab === 'facturacion' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', color: '#2c3e50' }}>
                📄 Reportes de Facturación
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Aquí se mostrarán los reportes de facturación...
              </p>
            </div>
          )}

          {activeTab === 'ventas' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', color: '#2c3e50' }}>
                💰 Reportes de Registro de Ventas
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Aquí se mostrarán los reportes de registro de ventas...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

