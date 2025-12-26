/**
 * Feature Flags - Control de características del sistema
 * 
 * Permite activar/desactivar funcionalidades sin modificar código
 * Útil para desarrollo incremental y rollback rápido
 */

export const FEATURES = {
  /**
   * GRANULAR_PERMISSIONS: Sistema de permisos jerárquicos
   * 
   * false = Sistema antiguo (permisos simples por módulo)
   * true = Sistema nuevo (permisos granulares con sub-módulos)
   * 
   * ✅ ACTIVADO - Fase 2 completada
   * - Script de migración ejecutado
   * - PrivateRoute.jsx actualizado
   * - App.jsx actualizado con permisos en todas las rutas
   */
  GRANULAR_PERMISSIONS: true,
  
  /**
   * DEBUG_PERMISSIONS: Modo debug para permisos
   * 
   * true = Mostrar logs detallados en consola sobre verificación de permisos
   * false = Sin logs (producción)
   */
  DEBUG_PERMISSIONS: true
};

/**
 * Helper para verificar si una feature está activa
 * @param {string} featureName - Nombre de la feature
 * @returns {boolean}
 */
export const isFeatureEnabled = (featureName) => {
  return FEATURES[featureName] === true;
};

/**
 * Helper para logging condicional basado en feature flags
 * @param {string} featureName - Nombre de la feature
 * @param {string} message - Mensaje a mostrar
 * @param {any} data - Datos adicionales
 */
export const featureLog = (featureName, message, data = null) => {
  const debugFlag = `DEBUG_${featureName}`;
  if (FEATURES[debugFlag]) {
    console.log(`[${featureName}] ${message}`, data || '');
  }
};

export default FEATURES;

