/**
 * Configuración de Permisos Jerárquicos
 * 
 * Estructura:
 * - Cada módulo puede tener sub-módulos (children)
 * - Si un usuario tiene el permiso padre (ej: "dashboard"), tiene acceso a TODOS los hijos
 * - Si un usuario tiene un permiso hijo (ej: "dashboard.alerts"), solo tiene acceso a ese específico
 */

export const PERMISSIONS_HIERARCHY = {
  'dashboard': {
    id: 'dashboard',
    name: 'Panel de Datos',
    icon: '📊',
    description: 'Visualización de métricas y alertas del sistema',
    children: [
      { 
        id: 'dashboard.alerts', 
        name: 'Alertas de Stock', 
        route: '/dashboard',
        description: 'Ver alertas de stock bajo y medicamentos críticos'
      },
      { 
        id: 'dashboard.top-customers', 
        name: 'Principales Clientes', 
        route: '/top-customers',
        description: 'Visualizar ranking de mejores clientes'
      },
      { 
        id: 'dashboard.best-prices', 
        name: 'Mejores Precios-Proveedores', 
        route: '/best-prices',
        description: 'Comparativa de precios entre proveedores'
      },
      { 
        id: 'dashboard.expiry', 
        name: 'Alertas de Caducidad', 
        route: '/expiry-alerts',
        description: 'Medicamentos próximos a vencer'
      },
      { 
        id: 'dashboard.idle', 
        name: 'Tiempo sin Movimiento', 
        route: '/idle-medicines',
        description: 'Medicamentos sin movimiento en inventario'
      }
    ]
  },
  
  'admin': {
    id: 'admin',
    name: 'Administración',
    icon: '⚙️',
    description: 'Configuración de tasas de cambio y parámetros del sistema',
    children: [
      { 
        id: 'admin.dop-usd', 
        name: 'Tasa de Cambio DOP-USD', 
        route: '/admin/dop-usd',
        description: 'Gestionar tasa de cambio Peso Dominicano a Dólar'
      },
      { 
        id: 'admin.usd-mn', 
        name: 'Tasa de Cambio USD-MN', 
        route: '/admin/usd-mn',
        description: 'Gestionar tasa de cambio Dólar a Moneda Nacional'
      },
      { 
        id: 'admin.shipping', 
        name: 'Tasa de Envío', 
        route: '/admin/shipping',
        description: 'Configurar costos de envío'
      },
      { 
        id: 'admin.company', 
        name: 'Datos de la Empresa', 
        route: '/admin/company',
        description: 'Configurar información de la empresa para facturas'
      }
    ]
  },
  
  'medicines': {
    id: 'medicines',
    name: 'Medicamentos',
    icon: '💊',
    description: 'Gestión completa del inventario de medicamentos',
    children: [] // Sin sub-módulos, acceso directo
  },
  
  'customers': {
    id: 'customers',
    name: 'Clientes',
    icon: '👥',
    description: 'Administración de clientes del sistema',
    children: []
  },
  
  'suppliers': {
    id: 'suppliers',
    name: 'Proveedores',
    icon: '🏢',
    description: 'Gestión de proveedores y contactos',
    children: []
  },
  
  'receipts': {
    id: 'receipts',
    name: 'Entradas',
    icon: '📥',
    description: 'Registro de entradas de inventario y compras',
    children: []
  },
  
  'sales': {
    id: 'sales',
    name: 'Salidas',
    icon: '📤',
    description: 'Registro de ventas y salidas de inventario',
    children: []
  },
  
  'invoicing': {
    id: 'invoicing',
    name: 'Facturación',
    icon: '🧾',
    description: 'Gestión de facturas y documentos fiscales',
    children: [
      { 
        id: 'invoicing.manage', 
        name: 'Gestión de Facturas', 
        route: '/operaciones/facturacion',
        description: 'Crear, editar y gestionar facturas'
      }
    ]
  },
  
  'reports': {
    id: 'reports',
    name: 'Informes / Reportes',
    icon: '📊',
    description: 'Sistema completo de informes y reportes',
    children: [
      { 
        id: 'reports.financial', 
        name: 'Reporte Financiero', 
        route: '/finanzas/reportes',
        description: 'Reportes detallados de finanzas'
      },
      { 
        id: 'reports.profitability', 
        name: 'Análisis de Rentabilidad', 
        route: '/finanzas/rentabilidad',
        description: 'Análisis de rentabilidad por medicamento, cliente y proveedor'
      },
      { 
        id: 'reports.main', 
        name: 'Informes / Reportes', 
        route: '/reports',
        description: 'Reportes de facturación y registro de ventas'
      }
    ]
  },
  
  'users': {
    id: 'users',
    name: 'Gestión de Usuarios',
    icon: '🔐',
    description: 'Administración de usuarios y roles del sistema',
    children: [
      { 
        id: 'users.list', 
        name: 'Lista de Usuarios', 
        route: '/users',
        description: 'Ver y administrar usuarios'
      },
      { 
        id: 'users.roles', 
        name: 'Gestión de Roles', 
        route: '/roles',
        description: 'Crear y editar roles y permisos'
      }
    ]
  }
};

/**
 * Obtener todas las rutas asociadas a un permiso
 * @param {string} permission - El permiso a verificar (ej: "dashboard" o "dashboard.alerts")
 * @returns {string[]} - Array de rutas a las que da acceso
 */
export const getRoutesForPermission = (permission) => {
  // Si es un permiso padre (ej: "dashboard")
  if (PERMISSIONS_HIERARCHY[permission]) {
    const module = PERMISSIONS_HIERARCHY[permission];
    
    // Si no tiene hijos, mapear directamente a la ruta del módulo
    if (module.children.length === 0) {
      return [`/${permission}`];
    }
    
    // Si tiene hijos, retornar todas las rutas de los hijos
    return module.children.map(child => child.route);
  }
  
  // Si es un permiso hijo (ej: "dashboard.alerts")
  const [parent] = permission.split('.');
  if (PERMISSIONS_HIERARCHY[parent]) {
    const childModule = PERMISSIONS_HIERARCHY[parent].children.find(c => c.id === permission);
    return childModule ? [childModule.route] : [];
  }
  
  return [];
};

/**
 * Verificar si un usuario tiene acceso a una ruta específica
 * @param {string[]} userPermissions - Array de permisos del usuario
 * @param {string} route - Ruta a verificar (ej: "/dashboard")
 * @returns {boolean} - true si tiene acceso, false si no
 */
export const hasAccessToRoute = (userPermissions, route) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  
  for (const permission of userPermissions) {
    const routes = getRoutesForPermission(permission);
    if (routes.includes(route)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Obtener el mapeo completo de ruta → permiso requerido
 * Útil para configurar las rutas en App.jsx
 */
export const ROUTE_PERMISSION_MAP = {
  '/home': 'dashboard', // Acceso si tiene cualquier permiso de dashboard
  '/dashboard': 'dashboard.alerts',
  '/top-customers': 'dashboard.top-customers',
  '/best-prices': 'dashboard.best-prices',
  '/expiry-alerts': 'dashboard.expiry',
  '/idle-medicines': 'dashboard.idle',
  
  '/admin/dop-usd': 'admin.dop-usd',
  '/admin/usd-mn': 'admin.usd-mn',
  '/admin/shipping': 'admin.shipping',
  
  '/medicines': 'medicines',
  '/customers': 'customers',
  '/suppliers': 'suppliers',
  
  '/receipts': 'receipts',
  '/receipts/history': 'receipts',
  '/sales': 'sales',
  '/operaciones/facturacion': 'invoicing.manage',
  
  '/finanzas/reportes': 'reports.financial',
  '/finanzas/rentabilidad': 'reports.profitability',
  '/reports': 'reports.main',
  
  '/users': 'users.list',
  '/roles': 'users.roles'
};

/**
 * Obtener todos los permisos disponibles en formato plano
 * Útil para migraciones y debugging
 */
export const getAllPermissions = () => {
  const permissions = [];
  
  Object.values(PERMISSIONS_HIERARCHY).forEach(module => {
    if (module.children.length === 0) {
      // Módulo sin hijos
      permissions.push(module.id);
    } else {
      // Módulo con hijos - agregar el padre y todos los hijos
      permissions.push(module.id);
      module.children.forEach(child => {
        permissions.push(child.id);
      });
    }
  });
  
  return permissions;
};

/**
 * Expandir permisos padre a todos sus hijos
 * Útil para migración de permisos antiguos
 * @param {string[]} permissions - Array de permisos (puede incluir padres)
 * @returns {string[]} - Array expandido con todos los permisos específicos
 */
export const expandPermissions = (permissions) => {
  const expanded = new Set();
  
  permissions.forEach(permission => {
    if (PERMISSIONS_HIERARCHY[permission]) {
      const module = PERMISSIONS_HIERARCHY[permission];
      
      if (module.children.length === 0) {
        // Módulo sin hijos, agregar tal cual
        expanded.add(permission);
      } else {
        // Módulo con hijos, agregar todos los hijos
        module.children.forEach(child => {
          expanded.add(child.id);
        });
      }
    } else {
      // Es un permiso hijo específico, agregar tal cual
      expanded.add(permission);
    }
  });
  
  return Array.from(expanded);
};

/**
 * Contraer permisos hijos a su padre si tiene todos
 * Útil para mostrar permisos de forma compacta
 * @param {string[]} permissions - Array de permisos específicos
 * @returns {string[]} - Array contraído con permisos padre cuando aplique
 */
export const collapsePermissions = (permissions) => {
  const collapsed = new Set();
  
  Object.values(PERMISSIONS_HIERARCHY).forEach(module => {
    if (module.children.length === 0) {
      // Módulo sin hijos
      if (permissions.includes(module.id)) {
        collapsed.add(module.id);
      }
    } else {
      // Verificar si tiene TODOS los hijos
      const allChildIds = module.children.map(c => c.id);
      const hasAllChildren = allChildIds.every(childId => permissions.includes(childId));
      
      if (hasAllChildren) {
        // Tiene todos los hijos, agregar solo el padre
        collapsed.add(module.id);
      } else {
        // No tiene todos, agregar solo los que tiene
        allChildIds.forEach(childId => {
          if (permissions.includes(childId)) {
            collapsed.add(childId);
          }
        });
      }
    }
  });
  
  return Array.from(collapsed);
};

export default PERMISSIONS_HIERARCHY;

