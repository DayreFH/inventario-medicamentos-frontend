import { useState, useEffect } from 'react';
import api from '../api/http';

const SaleFormUSD = () => {
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
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('efectivo');
  
  // Estados para filtros
  const [medicineFilter, setMedicineFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  
  // Estados para items de venta
  const [saleItems, setSaleItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    quantity: 0,
    saleDate: new Date().toISOString().slice(0, 10),
    precioCompraDOP: 0
  });
  
  // Estados para proveedores y precios disponibles
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [availablePrices, setAvailablePrices] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setInitialLoading(true);
        await loadInitialData();
        await loadPaymentMethods();
        await checkExchangeRateMN();
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
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
    try {
      const { data } = await api.get('/exchange-rates-mn/current');
      if (data) {
        setExchangeRateMN(parseFloat(data.sellRate || data.buyRate));
        const today = new Date().toDateString();
        localStorage.setItem('exchangeRateMN', JSON.stringify({ rate: parseFloat(data.sellRate || data.buyRate), date: today }));
      }
    } catch (error) {
      console.error('Error cargando tasa de cambio MN:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadExchangeRate();
      await loadShippingRate();
      await loadMedicines();
      await loadCustomers();
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    } finally {
      setLoading(false);
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

  const loadMedicines = async () => {
    try {
      const response = await api.get('/medicines?limit=1000');
      // El endpoint devuelve { data: [...], pagination: {...} }
      const medicines = response.data.data || response.data || [];
      setMedicines(medicines);
      console.log('✅ Medicamentos cargados:', medicines.length);
    } catch (error) {
      console.error('❌ Error cargando medicamentos:', error);
      setMedicines([]); // Asegurar que sea array
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setCustomers([]); // Asegurar que sea array
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
    setSelectedSupplier(null);
    setSelectedPrice(null);
    setAvailableSuppliers([]);
    setAvailablePrices([]);

    if (!medicine) return;

    // Cargar proveedores que tienen precios para este medicamento
    try {
      const { data } = await api.get(`/medicines/${medicine.id}`);
      const preciosActivos = (data.precios || []).filter(p => p.activo);
      
      if (preciosActivos.length === 0) {
        alert('⚠️ Este medicamento no tiene precios con proveedores. Configure en: Gestión de Datos → Medicamentos → Precios');
        return;
      }

      // Obtener proveedores únicos
      const suppliersMap = new Map();
      preciosActivos.forEach(precio => {
        if (precio.supplier) {
          suppliersMap.set(precio.supplier.id, precio.supplier);
        }
      });

      setAvailableSuppliers(Array.from(suppliersMap.values()));
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const handleSupplierSelect = async (supplierId) => {
    setSelectedSupplier(supplierId);
    setSelectedPrice(null);
    setAvailablePrices([]);

    if (!supplierId || !selectedMedicine) return;

    // Cargar precios del proveedor seleccionado para este medicamento
    try {
      const { data } = await api.get(`/medicines/${selectedMedicine.id}`);
      const preciosDelProveedor = (data.precios || []).filter(
        p => p.activo && p.supplierId === parseInt(supplierId)
      );
      setAvailablePrices(preciosDelProveedor);
    } catch (error) {
      console.error('Error cargando precios:', error);
    }
  };

  const handlePriceSelect = (priceId) => {
    const precio = availablePrices.find(p => p.id === parseInt(priceId));
    setSelectedPrice(precio);
    if (precio) {
      setCurrentItem(prev => ({
        ...prev,
        precioCompraDOP: parseFloat(precio.precioCompraUnitario)
      }));
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const addItemToSale = () => {
    if (!selectedMedicine || !selectedCustomer || !selectedPrice) {
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

      const pesoKg = parseFloat(selectedMedicine.pesoKg) || 0;
      const precioCompraDOP = currentItem.precioCompraDOP;

      // Costo/u USD = (Precio Compra DOP / TC DOP-USD) + (Peso Kg × Tasa Envío)
      const costoUnitarioUSD = (precioCompraDOP / exchangeRate.rate) + (pesoKg * (shippingRate?.internationalRate || 0));

      // Precio X Kg Cuba
      const presentacionUpper = selectedMedicine.presentacion?.toUpperCase() || '';
      const esFrascoOTubo = presentacionUpper.includes('FRASCO') || presentacionUpper.includes('TUBO');
      const precioXKgCuba = esFrascoOTubo ? pesoKg * 5 : pesoKg * 15;

      // Precio de Venta USD = Costo/u USD + Precio X Kg Cuba
      const precioVentaUSD = costoUnitarioUSD + precioXKgCuba;

      // Subtotal USD = Precio de Venta USD × Cantidad
      const subtotalUSD = precioVentaUSD * newTotalQuantity;

      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newTotalQuantity,
        precioCompraDOP,
        costoUnitarioUSD,
        precioXKgCuba,
        precioVentaUSD,
        subtotalUSD
      };

      setSaleItems(updatedItems);
    } else {
      // Nuevo item
      const pesoKg = parseFloat(selectedMedicine.pesoKg) || 0;
      const precioCompraDOP = currentItem.precioCompraDOP;

      // Costo/u USD = (Precio Compra DOP / TC DOP-USD) + (Peso Kg × Tasa Envío)
      const costoUnitarioUSD = (precioCompraDOP / exchangeRate.rate) + (pesoKg * (shippingRate?.internationalRate || 0));

      // Precio X Kg Cuba
      const presentacionUpper = selectedMedicine.presentacion?.toUpperCase() || '';
      const esFrascoOTubo = presentacionUpper.includes('FRASCO') || presentacionUpper.includes('TUBO');
      const precioXKgCuba = esFrascoOTubo ? pesoKg * 5 : pesoKg * 15;

      // Precio de Venta USD = Costo/u USD + Precio X Kg Cuba
      const precioVentaUSD = costoUnitarioUSD + precioXKgCuba;

      // Subtotal USD = Precio de Venta USD × Cantidad
      const subtotalUSD = precioVentaUSD * currentItem.quantity;

      const newItem = {
        id: Date.now(),
        medicineId: selectedMedicine.id,
        nombreComercial: selectedMedicine.nombreComercial,
        presentacion: selectedMedicine.presentacion,
        stock: selectedMedicine.stock,
        pesoKg: parseFloat(pesoKg) || 0,

        // Datos del cliente
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,

        // Datos del proveedor y precio
        supplierId: selectedPrice.supplierId,
        priceId: selectedPrice.id,
        precioCompraDOP,

        // Cálculos
        quantity: currentItem.quantity,
        costoUnitarioUSD,
        precioXKgCuba,
        precioVentaUSD,
        subtotalUSD,

        saleDate: currentItem.saleDate,
        paymentMethod: selectedPaymentMethod
      };

      setSaleItems([...saleItems, newItem]);
    }

    // Limpiar formulario
    setCurrentItem({
      quantity: 0,
      saleDate: new Date().toISOString().slice(0, 10),
      precioCompraDOP: 0
    });
    setSelectedMedicine(null);
    setSelectedSupplier(null);
    setSelectedPrice(null);
    setAvailableSuppliers([]);
    setAvailablePrices([]);
    setMedicineFilter('');
  };

  const removeItem = (itemId) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  const calculateTotalUSD = () => {
    return saleItems.reduce((sum, item) => sum + item.subtotalUSD, 0);
  };

  const handleSaveSale = async () => {
    if (saleItems.length === 0) {
      alert('Debe agregar al menos un medicamento');
      return;
    }

    try {
      setLoading(true);

      const saleData = {
        customerId: saleItems[0].customerId,
        date: saleItems[0].saleDate,
        paymentMethod: selectedPaymentMethod,
        tipoVenta: 'USD',
        items: saleItems.map(item => ({
          medicineId: item.medicineId,
          qty: item.quantity,
          costo_unitario_usd: item.costoUnitarioUSD,
          precio_propuesto_usd: item.precioVentaUSD,
          supplierId: item.supplierId
        }))
      };

      await api.post('/sales', saleData);

      alert('✅ Venta USD registrada exitosamente');

      // Limpiar formulario
      setSaleItems([]);
      setSelectedCustomer(null);
      setCustomerFilter('');
      await loadMedicines(); // Recargar para actualizar stock
    } catch (error) {
      console.error('Error guardando venta:', error);
      alert(`Error al guardar venta: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
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
            Cargando Salidas USD...
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
          <span>💵 SALIDAS USD</span>
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
          Salida de Medicamentos (USD)
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

          {/* Proveedor */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Proveedor *
            </label>
            <select
              value={selectedSupplier || ''}
              onChange={(e) => handleSupplierSelect(e.target.value)}
              disabled={!selectedMedicine || availableSuppliers.length === 0}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: availableSuppliers.length === 0 && selectedMedicine ? '2px solid #dc3545' : '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: !selectedMedicine || availableSuppliers.length === 0 ? '#f5f5f5' : 'white',
                marginTop: '28px'
              }}
            >
              <option value="">Seleccionar...</option>
              {availableSuppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {selectedMedicine && availableSuppliers.length === 0 && (
              <div style={{ fontSize: '9px', color: '#dc3545', marginTop: '2px', fontWeight: '500' }}>
                ⚠️ Sin precios
              </div>
            )}
          </div>

          {/* Precio de Compra */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
              Precio Compra *
            </label>
            <select
              value={selectedPrice?.id || ''}
              onChange={(e) => handlePriceSelect(e.target.value)}
              disabled={!selectedSupplier || availablePrices.length === 0}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: !selectedSupplier ? '#f5f5f5' : 'white',
                marginTop: '28px'
              }}
            >
              <option value="">Seleccionar...</option>
              {availablePrices.map(precio => (
                <option key={precio.id} value={precio.id}>
                  ${parseFloat(precio.precioCompraUnitario).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Stock y Cantidad */}
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
                marginBottom: '6px'
              }}
            />
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
                fontSize: '12px'
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
          Medicamentos a Salir (USD)
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
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '80px' }}>Peso Kg</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '100px' }}>Precio de Venta USD</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '100px' }}>Subtotal USD</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '60px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {saleItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ 
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
                      {(item.pesoKg || 0).toFixed(3)} kg
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#007bff', fontSize: '12px', textAlign: 'right' }}>
                      ${item.precioVentaUSD.toFixed(2)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#28a745', fontSize: '12px', textAlign: 'right' }}>
                      ${item.subtotalUSD.toFixed(2)}
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
            <span style={{ color: '#28a745' }}>Total USD: ${calculateTotalUSD().toFixed(2)}</span>
            <span>Items: {saleItems.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleFormUSD;

