import { useState } from 'react';
import { PAGE_CONTAINER, DARK_HEADER, CONTENT_CONTAINER } from '../styles/standardLayout';
import InventoryReports from '../components/InventoryReports';
import ExecutiveReports from '../components/ExecutiveReports';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div style={PAGE_CONTAINER}>
      {/* Header */}
      <div style={DARK_HEADER}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Informes / Reportes</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Reportes especializados de inventario y ejecutivos
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
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'inventory' ? '#3b82f6' : 'transparent',
              color: activeTab === 'inventory' ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'inventory' ? '600' : '400',
              fontSize: '14px',
              borderRadius: '4px 4px 0 0',
              transition: 'all 0.2s'
            }}
          >
            📦 Inventario
          </button>
          <button
            onClick={() => setActiveTab('executive')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'executive' ? '#3b82f6' : 'transparent',
              color: activeTab === 'executive' ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: activeTab === 'executive' ? '600' : '400',
              fontSize: '14px',
              borderRadius: '4px 4px 0 0',
              transition: 'all 0.2s'
            }}
          >
            💼 Ejecutivos
          </button>
        </div>

        {/* Tab Content */}
        <div style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          overflow: 'auto'
        }}>
          {activeTab === 'inventory' && (
            <InventoryReports />
          )}

          {activeTab === 'executive' && (
            <ExecutiveReports />
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
