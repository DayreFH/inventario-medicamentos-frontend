/**
 * Estilos estándar basados en la página de Entradas (ReceiptFormAdvanced)
 * 
 * Estos estilos aseguran:
 * - Sin scroll horizontal
 * - Tamaños de fuente consistentes
 * - Layout que ocupa todo el espacio disponible
 */

// Contenedor principal de página (igual que Entradas)
export const PAGE_CONTAINER = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f5f5f5',
  overflow: 'hidden'
};

// Contenedor de contenido con scroll (SIN padding lateral para ocupar todo el ancho)
export const CONTENT_CONTAINER = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '16px 0'  // Solo padding arriba/abajo, NO lateral
};

// Header oscuro (como en Entradas)
export const DARK_HEADER = {
  backgroundColor: '#2c3e50',
  color: 'white',
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
  flexShrink: 0
};

// Header claro (alternativa)
export const LIGHT_HEADER = {
  backgroundColor: '#ffffff',
  borderBottom: '2px solid #e9ecef',
  padding: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
};

// Tamaños de fuente estandarizados (basados en Entradas)
export const FONT_SIZES = {
  // Títulos
  title: '18px',        // Título principal de sección
  subtitle: '16px',     // Subtítulos
  
  // Texto
  normal: '14px',       // Texto normal, headers
  body: '13px',         // Texto de cuerpo
  small: '12px',        // Labels, inputs, tablas
  tiny: '11px',         // Texto de ayuda, hints
  micro: '10px',        // Botones muy pequeños
  
  // Títulos grandes (solo para páginas especiales)
  large: '20px'
};

// Pesos de fuente
export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
};

// Colores estándar
export const COLORS = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  
  // Grises
  dark: '#2c3e50',
  gray: '#6c757d',
  lightGray: '#e9ecef',
  background: '#f5f5f5',
  white: '#ffffff',
  
  // Texto
  textDark: '#2c3e50',
  textMuted: '#6c757d',
  textLight: '#999999'
};

// Espaciado estándar
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px'
};

// Estilos para tablas (como en Entradas)
export const TABLE_STYLES = {
  container: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '500px',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    backgroundColor: '#ffffff'
  },
  
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px'
  },
  
  th: {
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontSize: '12px',
    fontWeight: '600',
    color: '#495057',
    position: 'sticky',
    top: 0,
    zIndex: 1
  },
  
  td: {
    padding: '8px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '12px',
    color: '#495057'
  }
};

// Estilos para botones
export const BUTTON_STYLES = {
  primary: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  
  secondary: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  
  small: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '500'
  }
};

// Estilos para inputs
export const INPUT_STYLES = {
  base: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
    fontWeight: '500'
  }
};

// Estilos para cards/secciones
export const CARD_STYLES = {
  base: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    padding: '16px',
    marginBottom: '16px'
  },
  
  header: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e9ecef'
  }
};

export default {
  PAGE_CONTAINER,
  CONTENT_CONTAINER,
  DARK_HEADER,
  LIGHT_HEADER,
  FONT_SIZES,
  FONT_WEIGHTS,
  COLORS,
  SPACING,
  TABLE_STYLES,
  BUTTON_STYLES,
  INPUT_STYLES,
  CARD_STYLES
};

