import { useState, useEffect } from 'react';
import api from '../api/http';

const SaleFormAdvanced = () => {
  // Estados para tasas y configuración
  const [exchangeRate, setExchangeRate] = useState({ rate: 62.83 });
  const [shippingRate, setShippingRate] = useState({ internationalRate: 10 });
  const [exchangeRateMN, setExchangeRateMN] = useState(null);
  
  // Estados para datos
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // Estados para selección
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('efectivo');
  
  // Estados para filtros
  const [medicineFilter, setMedicineFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  
  // Estados para items de venta
  const [saleItems, setSaleItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    quantity: 0,
    saleDate: new Date().toISOString().slice(0, 10),
    precioVentaMN: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🚀 [DEBUG] Iniciando initializeData...');
        setInitialLoading(true);
        await loadInitialData();
        await loadPaymentMethods();
        const isValidMN = await checkExchangeRateMN();
        
        console.log('🔍 [DEBUG] isValidMN =', isValidMN);
        
        if (isValidMN) {
          console.log('✅ [DEBUG] Tasa válida, quitando loading...');
          setInitialLoading(false);
        } else {
          console.log('❌ [DEBUG] Tasa NO válida, manteniendo loading infinito...');
        }
        // Si no es válido, mantener loading (usuario será redirigido o verá alert)
      } catch (error) {
        console.error('❌ [DEBUG] Error en initializeData:', error);
        setInitialLoading(false);
      }
    };

    initializeData();

    const interval = setInterval(() => {
      const savedRate = localStorage.getItem('exchangeRate');
      if (savedRate) {
        try {
          const data = JSON.parse(savedRate);
          const today = new Date().toDateString();
          if (data.date === today && data.rate) {
            setExchangeRate({ rate: parseFloat(data.rate) });
          }
        } catch (e) {
          console.error('Error parsing exchangeRate from localStorage:', e);
        }
      }

      const savedShipping = localStorage.getItem('shippingRate');
      if (savedShipping) {
        try {
          const data = JSON.parse(savedShipping);
          if (data.internationalRate) {
            setShippingRate({ internationalRate: parseFloat(data.internationalRate) });
          }
        } catch (e) {
          console.error('Error parsing shippingRate from localStorage:', e);
        }
      }

      const savedMN = localStorage.getItem('exchangeRateMN');
      if (savedMN) {
        try {
          const data = JSON.parse(savedMN);
          const today = new Date().toDateString();
          if (data.date === today && data.rate) {
            setExchangeRateMN(parseFloat(data.rate));
          }
        } catch (e) {
          console.error('Error parsing exchangeRateMN from localStorage:', e);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkExchangeRateMN = async () => {
    console.log('🔍 [DEBUG] Iniciando checkExchangeRateMN...');
    try {
      const { data } = await api.get('/exchange-rates-mn/current');
      console.log('✅ [DEBUG] API respondió con data:', data);
      if (data) {
        // Verificar que la tasa sea del día de hoy
        const rateDate = new Date(data.date).toDateString();
        const today = new Date().toDateString();
        
        console.log('🔍 [DEBUG] Comparando fechas:', { rateDate, today, sonIguales: rateDate === today });
        
        if (rateDate === today) {
          // Es del día de hoy - válida
          setExchangeRateMN(parseFloat(data.sellRate || data.buyRate));
          localStorage.setItem('exchangeRateMN', JSON.stringify({ rate: parseFloat(data.sellRate || data.buyRate), date: today }));
          console.log('✅ [DEBUG] Tasa del día de hoy encontrada, retornando true');
          return true;
        } else {
          console.log('⚠️ [DEBUG] Tasa encontrada pero NO es del día de hoy (es del ' + rateDate + ')');
          // Continuar a validar localStorage
        }
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error de API:', error.response?.status, error.response?.data);
    }
    
    // Si llegamos aquí, no se pudo obtener la tasa de la API
    // Verificar si existe en localStorage para el día de hoy
    const today = new Date().toDateString();
    const saved = localStorage.getItem('exchangeRateMN');
    console.log('🔍 [DEBUG] Buscando en localStorage...', { today, saved });
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        console.log('🔍 [DEBUG] Data en localStorage:', data);
        if (data.date === today && data.rate) {
          setExchangeRateMN(parseFloat(data.rate));
          console.log('✅ [DEBUG] Tasa encontrada en localStorage, retornando true');
          return true; // Encontró tasa del día en localStorage - continuar
        } else {
          console.log('⚠️ [DEBUG] Tasa en localStorage NO es del día de hoy o no tiene rate');
        }
      } catch (e) {
        console.error('❌ [DEBUG] Error parsing exchangeRateMN from localStorage:', e);
      }
    } else {
      console.log('⚠️ [DEBUG] No hay datos en localStorage');
    }
    
    // NO HAY TASA CONFIGURADA PARA HOY - MOSTRAR ALERTA BLOQUEANTE
    console.log('⚠️ [DEBUG] NO HAY TASA VÁLIDA - Mostrando confirm...');
    const configure = confirm(
      '⚠️ ATENCIÓN: Debe configurar la Tasa de Cambio MN para el día de hoy antes de realizar salidas.\n\n' +
      '¿Desea ir a configurarla ahora?'
    );
    
    console.log('🔍 [DEBUG] Usuario respondió al confirm:', configure);
    
    if (configure) {
      // Redirigir a la página de configuración de tasas MN
      console.log('🔄 [DEBUG] Redirigiendo a /admin/usd-mn...');
      window.location.href = '/admin/usd-mn';
    } else {
      console.log('⚠️ [DEBUG] Mostrando alert de bloqueo...');
      alert(
        '❌ No se puede continuar sin configurar la Tasa de Cambio MN.\n\n' +
        'Por favor, diríjase a:\nCONFIGURACIÓN > Tasas de Cambio MN'
      );
    }
    
    console.log('❌ [DEBUG] Retornando false - NO hay tasa válida');
    return false; // No hay tasa válida
  };

  const loadInitialData = async () => {
    await Promise.all([
      loadMedicines(),
      loadCustomers(),
      loadExchangeRate(),
      loadShippingRate()
    ]);
  };

  const loadMedicines = async () => {
    try {
      const response = await api.get('/medicines?limit=1000');
      // El endpoint devuelve { data: [...], pagination: {...} }
      const medicines = response.data.data || response.data || [];
      setMedicines(medicines);
      console.log('✅ Medicamentos cargados:', medicines.length);
    } catch (error) {
      console.error('❌ Error cargando medicamentos:', error);
      setMedicines([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setCustomers([]);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const { data } = await api.get('/exchange-rates/current');
      setExchangeRate({ rate: parseFloat(data.rate) });
    } catch (error) {
      console.error('Error cargando tasa de cambio:', error);
    }
  };

  const loadShippingRate = async () => {
    try {
      const { data } = await api.get('/shipping-rates/current');
      if (data) {
        setShippingRate({ internationalRate: parseFloat(data.internationalRate) });
      }
    } catch (error) {
      console.error('Error cargando tasa de envío:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data } = await api.get('/payment-methods');
      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedPaymentMethod(data[0].name);
      }
    } catch (error) {
      console.error('Error cargando formas de pago:', error);
    }
  };

  const handleMedicineSelect = async (medicine) => {
    setSelectedMedicine(medicine);

    if (!medicine) return;

    // Cargar precio de venta MN activo desde BD
    const precioVentaMNActivo = medicine.preciosVentaMN?.find(p => p.activo);
    
    if (!precioVentaMNActivo) {
      alert('⚠️ Este medicamento no tiene un Precio de Venta MN activo.\n\nPor favor, configure un precio en: Gestión de Datos → Medicamentos → Precios');
      setSelectedMedicine(null);
      return;
    }
    
    const precioVentaMN = parseFloat(precioVentaMNActivo.precioVentaMN);
    
    setCurrentItem(prev => ({ 
      ...prev, 
      precioVentaMN
    }));
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const addItemToSale = () => {
    if (!selectedMedicine || !selectedCustomer) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (currentItem.quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (currentItem.quantity > selectedMedicine.stock) {
      alert(`Stock insuficiente. Disponible: ${selectedMedicine.stock}`);
      return;
    }

    if (!currentItem.precioVentaMN || currentItem.precioVentaMN <= 0) {
      alert('El medicamento no tiene un Precio de Venta MN válido');
      return;
    }

    // Verificar si el medicamento ya está en la lista
    const existingItemIndex = saleItems.findIndex(item => item.medicineId === selectedMedicine.id);

    if (existingItemIndex !== -1) {
      // Actualizar cantidad del item existente
      const existingItem = saleItems[existingItemIndex];
      const newTotalQuantity = existingItem.quantity + currentItem.quantity;

      if (newTotalQuantity > selectedMedicine.stock) {
        alert(`Stock insuficiente. Disponible: ${selectedMedicine.stock}`);
        return;
      }

      // Obtener precio de compra MAYOR del medicamento (desde precios activos)
      const activePrices = selectedMedicine.precios?.filter(p => p.activo) || [];
      const precioCompraDOP = activePrices.length > 0 
        ? Math.max(...activePrices.map(p => parseFloat(p.precioCompraUnitario)))
        : 0;
      
      const pesoKg = parseFloat(selectedMedicine.pesoKg) || 0;
      
      // Costo unitario en USD: (Precio de Compra DOP ÷ Tasa de cambio DOP-USD) + (Peso KG × Tasa de envío internacional)
      const costoUnitarioUSD = (precioCompraDOP / exchangeRate.rate) + (pesoKg * (shippingRate?.internationalRate || 0));
      
      // Costo/u MN = Costo/u USD × TC MN
      const costoUnitarioMN = costoUnitarioUSD * exchangeRateMN;
      
      // Precio de Venta = desde BD
      const precioVentaMN = currentItem.precioVentaMN;
      
      // Subtotal Costo MN = Costo/u MN × Cantidad
      const subtotalCostoMN = costoUnitarioMN * newTotalQuantity;
      
      // Subtotal de Venta = Precio de Venta × Cantidad
      const subtotalVenta = precioVentaMN * newTotalQuantity;

      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newTotalQuantity,
        costoUnitarioUSD,
        costoUnitarioMN,
        precioVentaMN,
        subtotalCostoMN,
        subtotalVenta
      };

      setSaleItems(updatedItems);
    } else {
      // Nuevo item
      // Obtener precio de compra MAYOR del medicamento (desde precios activos)
      const activePrices = selectedMedicine.precios?.filter(p => p.activo) || [];
      const precioCompraDOP = activePrices.length > 0 
        ? Math.max(...activePrices.map(p => parseFloat(p.precioCompraUnitario)))
        : 0;
      
      const pesoKg = parseFloat(selectedMedicine.pesoKg) || 0;
      
      // Costo unitario en USD: (Precio de Compra DOP ÷ Tasa de cambio DOP-USD) + (Peso KG × Tasa de envío internacional)
      const costoUnitarioUSD = (precioCompraDOP / exchangeRate.rate) + (pesoKg * (shippingRate?.internationalRate || 0));
      
      // Costo/u MN = Costo/u USD × TC MN
      const costoUnitarioMN = costoUnitarioUSD * exchangeRateMN;
      
      // Precio de Venta = desde BD
      const precioVentaMN = currentItem.precioVentaMN;
      
      // Subtotal Costo MN = Costo/u MN × Cantidad
      const subtotalCostoMN = costoUnitarioMN * currentItem.quantity;
      
      // Subtotal de Venta = Precio de Venta × Cantidad
      const subtotalVenta = precioVentaMN * currentItem.quantity;

      const newItem = {
        id: Date.now(),
        medicineId: selectedMedicine.id,
        nombreComercial: selectedMedicine.nombreComercial,
        presentacion: selectedMedicine.presentacion,
        stock: selectedMedicine.stock,

        // Datos del cliente
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,

        // Cálculos
        quantity: currentItem.quantity,
        costoUnitarioUSD,
        costoUnitarioMN,
        precioVentaMN,
        subtotalCostoMN,
        subtotalVenta,

        // Fecha
        saleDate: currentItem.saleDate
      };

      setSaleItems([...saleItems, newItem]);
    }

    // Limpiar formulario
    setCurrentItem({
      quantity: 0,
      saleDate: new Date().toISOString().slice(0, 10),
      precioVentaMN: 0
    });
    setSelectedMedicine(null);
    setSelectedCustomer(null);
    setMedicineFilter('');
    setCustomerFilter('');
  };

  const removeItem = (itemId) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  const handleSaveSale = async () => {
    if (saleItems.length === 0) {
      alert('No hay items en la venta');
      return;
    }

    if (!exchangeRateMN) {
      alert('⚠️ No se ha configurado la Tasa de Cambio MN.\n\nPor favor, configure la tasa en CONFIGURACIÓN > Tasas de Cambio MN antes de guardar la venta.');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customerId: saleItems[0].customerId,
        date: saleItems[0].saleDate,
        paymentMethod: selectedPaymentMethod,
        tipoVenta: 'MN',
        items: saleItems.map(item => ({
          medicineId: item.medicineId,
          qty: item.quantity,
          precio_venta_mn: item.precioVentaMN,
          costo_unitario_usd: item.costoUnitarioUSD
        }))
      };

      await api.post('/sales', saleData);
      
      alert('✅ Venta guardada exitosamente');
      
      // Limpiar formulario
      setSaleItems([]);
      setCurrentItem({
        quantity: 0,
        saleDate: new Date().toISOString().slice(0, 10),
        precioVentaMN: 0
      });
      setSelectedMedicine(null);
      setSelectedCustomer(null);
      setMedicineFilter('');
      setCustomerFilter('');
      
      // Recargar medicamentos para actualizar stock
      await loadMedicines();
    } catch (error) {
      console.error('Error saving sale:', error);
      alert(`Error al guardar venta: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCostoMN = () => {
    return saleItems.reduce((sum, item) => sum + (item.subtotalCostoMN || 0), 0);
  };

  const calculateTotalVenta = () => {
    return saleItems.reduce((sum, item) => sum + (item.subtotalVenta || 0), 0);
  };

  const filteredMedicines = (medicines || []).filter(med =>
    med.nombreComercial?.toLowerCase().includes(medicineFilter.toLowerCase()) ||
    med.codigo?.toLowerCase().includes(medicineFilter.toLowerCase())
  );

  const filteredCustomers = (customers || []).filter(customer =>
    customer.name?.toLowerCase().includes(customerFilter.toLowerCase())
  );

  // Mostrar pantalla de carga inicial
  if (initialLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            ⏳
          </div>
          <div style={{
            fontSize: '18px',
            color: '#2c3e50',
            fontWeight: 'bold'
          }}>
            Cargando Salidas MN...
          </div>
          <div style={{
            fontSize: '14px',
            color: '#7f8c8d',
            marginTop: '10px'
          }}>
            Por favor espere
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* Header con tasas */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span>💵 SALIDAS MN</span>
          <span>T.C. DOP-USD: {exchangeRate?.rate || 'Cargando...'}</span>
          <span>
            Envío: ${shippingRate?.internationalRate || '0'}
            <button
              onClick={() => {
                const newRate = prompt('Ingrese nueva tasa de envío internacional:', shippingRate?.internationalRate || '10');
                if (newRate && !isNaN(newRate) && parseFloat(newRate) > 0) {
                  const updatedRate = {
                    ...shippingRate,
                    internationalRate: parseFloat(newRate),
                    source: 'manual'
                  };
                  setShippingRate(updatedRate);
                  localStorage.setItem('shippingRate', JSON.stringify(updatedRate));
                }
              }}
              style={{
                marginLeft: '8px',
                padding: '2px 6px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ✏️
            </button>
          </span>
          <span>Fecha: {new Date().toLocaleDateString('es-DO')}</span>
          <span>T.C. MN: {exchangeRateMN ? `${exchangeRateMN} MN` : 'No configurado'}</span>
        </div>
      </div>

      {/* Sección superior - Formulario de salida */}
      <div style={{
        backgroundColor: '#e9ecef',
        padding: '16px',
        flex: '0 0 auto'
      }}>
        <h2 style={{ 
          margin: '0 0 16px 0', 
          color: '#2c3e50',
          fontSize: '18px'
        }}>
          Salida de Medicamentos (MN)
        </h2>

        {/* Formulario */}
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 200px 200px 140px 140px', gap: '12px', marginBottom: '8px' }}>
          {/* Medicamento */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Medicamento
            </label>
            <input
              type="text"
              value={medicineFilter}
              onChange={(e) => setMedicineFilter(e.target.value)}
              placeholder="Buscar..."
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '6px'
              }}
            />
            <select
              value={selectedMedicine?.id || ''}
              onChange={(e) => {
                const med = filteredMedicines.find(m => m.id === parseInt(e.target.value));
                handleMedicineSelect(med);
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="">Seleccionar medicamento...</option>
              {filteredMedicines.map(med => (
                <option key={med.id} value={med.id}>
                  {med.codigo} - {med.nombreComercial}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Cliente
            </label>
            <input
              type="text"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Buscar..."
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '6px'
              }}
            />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const cust = filteredCustomers.find(c => c.id === parseInt(e.target.value));
                handleCustomerSelect(cust);
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="">Seleccionar cliente...</option>
              {filteredCustomers.map(cust => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>

          {/* Precio de Venta MN (Read-only) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Precio Venta MN *
            </label>
            <input
              type="number"
              value={currentItem.precioVentaMN || ''}
              readOnly
              placeholder="Auto"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                color: '#28a745',
                fontWeight: 'bold',
                marginTop: '28px'
              }}
            />
          </div>

          {/* Stock disponible */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Stock disponible
            </label>
            <input
              type="text"
              value={selectedMedicine ? `Disponible: ${selectedMedicine.stock}` : 'Seleccione'}
              disabled
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: selectedMedicine && selectedMedicine.stock > 0 ? '#d4edda' : '#f8f9fa',
                color: selectedMedicine && selectedMedicine.stock > 0 ? '#155724' : '#6c757d',
                fontWeight: selectedMedicine && selectedMedicine.stock > 0 ? 'bold' : 'normal',
                marginTop: '28px'
              }}
            />
          </div>

          {/* Cantidad */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Cantidad
            </label>
            <input
              type="number"
              min="0"
              max={selectedMedicine ? selectedMedicine.stock : 0}
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                marginTop: '28px'
              }}
              placeholder="0"
            />
          </div>
        </div>

        {/* Segunda fila: Fecha y botones */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '12px', marginTop: '8px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Fecha de Salida
            </label>
            <input
              type="date"
              value={currentItem.saleDate}
              onChange={(e) => setCurrentItem({ ...currentItem, saleDate: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Forma de Pago */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#495057', fontWeight: '500', whiteSpace: 'nowrap' }}>
              💳 Forma de Pago:
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '2px solid #007bff',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              {paymentMethods.map(method => (
                <option key={method.id} value={method.name}>
                  {method.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={addItemToSale}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              ➕ Agregar
            </button>
            <button
              onClick={handleSaveSale}
              disabled={saleItems.length === 0}
              style={{
                padding: '6px 12px',
                backgroundColor: saleItems.length === 0 ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: saleItems.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              💾 Guardar
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Tabla de Items */}
      <div style={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'white',
        margin: '0 24px 24px 24px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        minHeight: 0
      }}>
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0',
          fontWeight: '600',
          fontSize: '14px',
          color: '#1e293b',
          flexShrink: 0
        }}>
          Medicamentos a Salir (MN)
        </div>
        
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '12px',
            tableLayout: 'fixed',
            minWidth: '100%'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', width: '150px' }}>Nombre Comercial</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', width: '120px' }}>Presentación</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '60px' }}>Cantidad</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '100px' }}>Costo/u MN</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '100px' }}>Precio Venta</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '120px' }}>SubTotal Costo MN</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '120px' }}>Subtotal Venta</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '60px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {saleItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#6c757d',
                    fontStyle: 'italic'
                  }}>
                    No hay medicamentos agregados
                  </td>
                </tr>
              ) : (
                saleItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={item.nombreComercial}>
                      <span style={{ marginRight: '4px' }}>▶</span>
                      {item.nombreComercial}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={item.presentacion}>{item.presentacion}</td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', textAlign: 'right', color: '#6c757d' }}>
                      MN {item.costoUnitarioMN?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#007bff', fontSize: '12px', textAlign: 'right' }}>
                      MN {item.precioVentaMN?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', textAlign: 'right', color: '#e67e22' }}>
                      MN {item.subtotalCostoMN?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#28a745', fontSize: '12px', textAlign: 'right' }}>
                      MN {item.subtotalVenta?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Total */}
        {saleItems.length > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', gap: '30px' }}>
              <span style={{ color: '#e67e22' }}>Total Costo MN: MN {calculateTotalCostoMN().toFixed(2)}</span>
              <span style={{ color: '#28a745' }}>Total Venta: MN {calculateTotalVenta().toFixed(2)}</span>
            </div>
            <span>Items: {saleItems.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleFormAdvanced;
