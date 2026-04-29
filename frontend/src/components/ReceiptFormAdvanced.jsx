import { useState, useEffect } from 'react';
import api from '../api/http';
import ComboBox from './ComboBox';

const ReceiptFormAdvanced = () => {
  const [exchangeRate, setExchangeRate] = useState({
    rate: 62.83,
    buyRate: 62.51,
    sellRate: 63.16,
    source: 'default'
  });
  const [shippingRate, setShippingRate] = useState({
    domesticRate: 2,
    internationalRate: 10,
    weight: 1,
    source: 'default'
  });
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicinePrices, setMedicinePrices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para los combobox
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [medicineFilter, setMedicineFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  
  // Estados para la tabla de entrada
  const [receiptItems, setReceiptItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    medicineId: '',
    supplierId: '',
    priceId: '',
    quantity: 0,
    lot: '',
    expirationDate: '',
    unitCost: 0,
    weightKg: 0
  });


  useEffect(() => {
    loadInitialData();
  }, []);

  // Efecto separado para pre-selección cuando los datos están cargados
  useEffect(() => {
    // Solo ejecutar si hay datos y hay parámetros en la URL
    if (medicines.length > 0 && suppliers.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const medicineId = urlParams.get('medicineId');
      const supplierId = urlParams.get('supplierId');
      const priceId = urlParams.get('priceId');
      
      if (medicineId || supplierId || priceId) {
        // Usar un flag para evitar ejecutar múltiples veces
        const hasPreselected = sessionStorage.getItem('urlPreselected');
        if (!hasPreselected) {
          sessionStorage.setItem('urlPreselected', 'true');
          setTimeout(() => {
            handleUrlPreselection(medicineId, supplierId, priceId);
          }, 300);
        }
      }
    }
  }, [medicines, suppliers]);

  const handleUrlPreselection = async (medicineId, supplierId, priceId) => {
    try {
      // Pre-seleccionar medicamento
      if (medicineId) {
        let medicine = medicines.find(m => m.id === parseInt(medicineId));
        
        // Si no está en la lista, cargarlo específicamente
        if (!medicine) {
          const { data } = await api.get(`/medicines/${medicineId}`);
          if (data) {
            medicine = data;
            // Agregar a la lista si no está
            if (!medicines.find(m => m.id === data.id)) {
              setMedicines([...medicines, data]);
            }
          }
        }
        
        if (medicine) {
          await handleMedicineSelect(medicine);
          
          // Esperar un momento para que se carguen los precios
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Pre-seleccionar proveedor
          if (supplierId) {
            const supplier = suppliers.find(s => s.id === parseInt(supplierId));
            if (supplier) {
              await handleSupplierSelect(supplier);
              
              // Esperar un momento para que se filtren los precios
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Pre-seleccionar precio
              if (priceId) {
                const price = medicinePrices.find(p => p.id === parseInt(priceId));
                if (price) {
                  handlePriceSelect(price);
                } else {
                  // Intentar buscar en los precios del medicamento si no está en la lista filtrada
                  const allPrices = medicine.precios || [];
                  const priceFromMedicine = allPrices.find(p => p.id === parseInt(priceId));
                  if (priceFromMedicine) {
                    handlePriceSelect(priceFromMedicine);
                  }
                }
              }
            }
          } else if (priceId) {
            // Si no hay proveedor pero sí precio, intentar seleccionarlo directamente
            const allPrices = medicine.precios || [];
            const price = allPrices.find(p => p.id === parseInt(priceId));
            if (price) {
              handlePriceSelect(price);
            }
          }
        }
      }
      
      // Limpiar parámetros de URL después de pre-seleccionar
      window.history.replaceState({}, '', '/receipts');
      // Limpiar el flag de sessionStorage
      sessionStorage.removeItem('urlPreselected');
    } catch (error) {
      console.error('Error en pre-selección desde URL:', error);
      // Limpiar el flag incluso si hay error
      sessionStorage.removeItem('urlPreselected');
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar tasa de envío desde localStorage primero
      const savedShippingRate = localStorage.getItem('shippingRate');
      if (savedShippingRate) {
        const parsedRate = JSON.parse(savedShippingRate);
        setShippingRate(parsedRate);
        console.log('Tasa de envío cargada desde localStorage:', parsedRate);
      } else {
        console.log('Usando tasa de envío por defecto del estado inicial');
      }
      
      // Cargar datos en orden para que estén disponibles para pre-selección
      await loadMedicines();
      await loadSuppliers();
      await Promise.all([
        loadExchangeRate(),
        loadShippingRate()
      ]);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const { data } = await api.get('/exchange-rates/current');
      setExchangeRate(data);
      console.log('Tasa de cambio cargada:', data);
    } catch (error) {
      console.error('Error cargando tasa de cambio:', error);
      // Tasa de respaldo si falla la API
      setExchangeRate({
        rate: 62.83,
        buyRate: 62.51,
        sellRate: 63.16,
        source: 'fallback'
      });
    }
  };

  const loadShippingRate = async () => {
    try {
      const { data } = await api.get('/shipping-rates/current');
      setShippingRate(data);
      // Guardar en localStorage para persistencia
      localStorage.setItem('shippingRate', JSON.stringify(data));
      console.log('Tasa de envío cargada y guardada:', data);
    } catch (error) {
      console.error('Error cargando tasa de envío:', error);
      // Intentar cargar desde localStorage primero
      const savedRate = localStorage.getItem('shippingRate');
      if (savedRate) {
        const parsedRate = JSON.parse(savedRate);
        setShippingRate(parsedRate);
        console.log('Tasa de envío cargada desde localStorage:', parsedRate);
      } else {
        // Tasa de respaldo si no hay nada guardado
        const defaultRate = {
          domesticRate: 2,
          internationalRate: 10,
          weight: 1,
          source: 'default'
        };
        setShippingRate(defaultRate);
        // Guardar en localStorage para futuras sesiones
        localStorage.setItem('shippingRate', JSON.stringify(defaultRate));
      }
    }
  };

  const loadMedicines = async () => {
    try {
      const { data } = await api.get('/medicines?limit=1000');  // Cargar todos para el formulario
      setMedicines(data.data || data);  // ✅ Soporta ambos formatos (con y sin paginación)
    } catch (error) {
      console.error('Error cargando medicamentos:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const loadMedicinePrices = async (medicineId, supplierId) => {
    try {
      const { data } = await api.get(`/medicines/${medicineId}/prices?supplierId=${supplierId}`);
      setMedicinePrices(data);
    } catch (error) {
      console.error('Error cargando precios:', error);
    }
  };

  const handleMedicineSelect = async (medicine) => {
    setSelectedMedicine(medicine);
    // No prellenar desde datos del medicamento; la caducidad se ingresa al dar entrada
    setCurrentItem({ ...currentItem, medicineId: medicine.id });
    
    // Cargar precios del medicamento
    try {
      if (medicine.precios && medicine.precios.length > 0) {
        // Regla: no permitir precios genéricos (siempre debe existir proveedor real).
        // Si hay un proveedor preseleccionado (por URL), filtrar a ese proveedor.
        let filteredPrices = medicine.precios.filter(p => p?.supplierId && p?.supplier);
        if (selectedSupplier) {
          filteredPrices = filteredPrices.filter(p => p.supplierId === selectedSupplier.id);
        }

        setMedicinePrices(filteredPrices);
        console.log('Precios del medicamento cargados (sin genéricos):', filteredPrices);
      } else {
        setMedicinePrices([]);
        console.log('Medicamento sin precios configurados');
      }
    } catch (error) {
      console.error('Error al procesar precios del medicamento:', error);
      setMedicinePrices([]);
    }
  };

  const handleSupplierSelect = async (supplier) => {
    setSelectedSupplier(supplier);
    setCurrentItem({ ...currentItem, supplierId: supplier.id });
    
    // Si hay un medicamento seleccionado, filtrar precios por proveedor
    if (selectedMedicine && selectedMedicine.precios) {
      // Regla: no permitir genéricos. Solo precios con supplier real.
      const finalPrices = selectedMedicine.precios
        .filter(p => p?.supplierId && p?.supplier)
        .filter(p => p.supplierId === supplier.id);
      setMedicinePrices(finalPrices);
      
      // Si había un precio seleccionado que no coincide con el nuevo proveedor, limpiarlo
      if (selectedPrice && selectedPrice.supplierId && selectedPrice.supplierId !== supplier.id) {
        setSelectedPrice(null);
        setCurrentItem({ ...currentItem, priceId: null, unitCost: 0 });
      }
      
      console.log('Precios filtrados por proveedor:', finalPrices);
    }
  };

  const handlePriceSelect = (price) => {
    setSelectedPrice(price);
    // Derivar proveedor desde el precio seleccionado (obligatorio).
    const supplierFromPrice = price?.supplier || null;
    setSelectedSupplier(supplierFromPrice);
    setCurrentItem({ 
      ...currentItem, 
      priceId: price.id,
      supplierId: supplierFromPrice?.id || '',
      unitCost: price.precioCompraUnitario,
      weightKg: selectedMedicine?.pesoKg || 0
    });
  };

  const addItemToReceipt = () => {
    try {
      // Validar que todos los campos estén completos
      if (!selectedMedicine) {
        alert('Por favor seleccione un medicamento');
        return;
      }
      
      if (!selectedPrice) {
        alert('Por favor seleccione un precio de compra');
        return;
      }

      if (!selectedPrice?.supplierId || !selectedPrice?.supplier) {
        alert('El precio seleccionado no tiene proveedor. Seleccione un precio con proveedor.');
        return;
      }
      
      if (currentItem.quantity <= 0) {
        alert('Por favor ingrese una cantidad mayor a 0');
        return;
      }

      // Validar vencimiento obligatorio para que aparezca en reportes
      if (!currentItem.expirationDate) {
        alert('Por favor ingrese la fecha de vencimiento');
        return;
      }
      
      // Validar que los IDs existan
      if (!selectedMedicine.id || !selectedPrice.id || !selectedPrice.supplierId) {
        alert('Error: Faltan datos del medicamento, proveedor o precio. Por favor, selecciónelos nuevamente.');
        console.error('IDs faltantes:', {
          medicineId: selectedMedicine?.id,
          supplierId: selectedPrice?.supplierId,
          priceId: selectedPrice?.id
        });
        return;
      }
      
      console.log('Agregando item con:', {
        medicineId: selectedMedicine.id,
        supplierId: selectedPrice.supplierId,
        priceId: selectedPrice.id,
        quantity: currentItem.quantity
      });

      // Verificar si ya existe el mismo medicamento en la tabla
      const existingItemIndex = receiptItems.findIndex(item => 
        item.medicineId === selectedMedicine.id && 
        item.supplierId === selectedPrice.supplierId &&
        item.priceId === selectedPrice.id
      );

      if (existingItemIndex !== -1) {
        // Si ya existe, sumar la cantidad
        const updatedItems = [...receiptItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // Calcular nueva cantidad total
        const newTotalQuantity = existingItem.quantity + currentItem.quantity;
        
        // Recalcular subtotales
        const newSubtotalUSD = existingItem.precioVentaUSD * newTotalQuantity;
        const newSubtotalDOP = existingItem.precioCompra * newTotalQuantity;
        
        // Calcular nueva existencia (existencia anterior + cantidad total)
        const newExistencia = existingItem.existenciaAnterior + newTotalQuantity;
        
        // Actualizar el item existente
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newTotalQuantity,
          subtotalUSD: newSubtotalUSD,
          subtotalDOP: newSubtotalDOP,
          existenciaNueva: newExistencia
        };
        
        setReceiptItems(updatedItems);
      } else {
        // Si no existe, crear nuevo item
        // Calcular precios y totales
        const margin = selectedPrice.margenUtilidad || 0;
        const unitCostDOP = parseFloat(selectedPrice.precioCompraUnitario) || 0;
        const unitPriceDOP = parseFloat(selectedPrice.precioVentaUnitario) || 0;
        const weightKg = currentItem.weightKg || 0;
        
        console.log('Precios del item:', { margin, unitCostDOP, unitPriceDOP, weightKg });
        
        // Calcular precio en USD: (Precio de Compra DOP ÷ Tasa de cambio) + (Peso KG × Tasa de envío)
        const unitPriceUSD = (unitCostDOP / exchangeRate.rate) + (weightKg * (shippingRate?.internationalRate || 0));
        
        // Calcular subtotales
        const subtotalUSD = unitPriceUSD * currentItem.quantity;
        const subtotalDOP = unitCostDOP * currentItem.quantity;
        
        // Calcular existencia actual
        const existingStock = selectedMedicine.stock || 0;
        const newStock = existingStock + currentItem.quantity;

        const newItem = {
          id: Date.now(),
          medicineId: selectedMedicine.id,
          supplierId: selectedPrice.supplierId,
          priceId: selectedPrice.id,
          quantity: currentItem.quantity,
          lot: currentItem.lot || '',
          expirationDate: currentItem.expirationDate || '',
          unitCost: unitCostDOP,
          weightKg: currentItem.weightKg || 0,
          
          // Datos del medicamento
          codigo: selectedMedicine.codigo || '',
          nombreComercial: selectedMedicine.nombreComercial || '',
          formaFarmaceutica: selectedMedicine.formaFarmaceutica || '',
          presentacion: selectedMedicine.presentacion || '',
          concentracion: selectedMedicine.concentracion || '',
          laboratorio: selectedMedicine.laboratorio || 'N/A',
          
          // Datos del proveedor
          proveedor: selectedPrice?.supplier?.name || '',
          
          // Precios y cálculos
          precioCompra: unitCostDOP,
          margenUtilidad: margin,
          precioVentaDOP: unitPriceDOP,
          precioVentaUSD: unitPriceUSD,
          subtotalUSD: subtotalUSD,
          subtotalDOP: subtotalDOP,
          
          // Stock
          existenciaAnterior: existingStock,
          existenciaNueva: newStock
        };

        console.log('Nuevo item creado:', newItem);
        setReceiptItems([...receiptItems, newItem]);
      }
      
      // Limpiar formulario
      setCurrentItem({
        medicineId: '',
        supplierId: '',
        priceId: '',
        quantity: 0,
        lot: '',
        expirationDate: '',
        unitCost: 0,
        weightKg: 0
      });
      setSelectedMedicine(null);
      setSelectedSupplier(null);
      setSelectedPrice(null);
      setMedicineFilter('');
      setSupplierFilter('');
    } catch (error) {
      console.error('Error en addItemToReceipt:', error);
      alert(`Error al agregar el medicamento: ${error.message}`);
    }
  };

  const removeItem = (itemId) => {
    setReceiptItems(receiptItems.filter(item => item.id !== itemId));
  };

  const updateShippingRate = (newRate) => {
    setShippingRate(newRate);
    // Guardar en localStorage para persistencia
    localStorage.setItem('shippingRate', JSON.stringify(newRate));
    console.log('Tasa de envío actualizada y guardada:', newRate);
  };

  const calculateTotal = () => {
    return receiptItems.reduce((total, item) => total + item.subtotalDOP, 0);
  };

  const handleSaveReceipt = async () => {
    if (receiptItems.length === 0) {
      alert('Debe agregar al menos un medicamento');
      return;
    }

    // Validar que todos los items tengan los datos necesarios
    const invalidItems = receiptItems.filter(item => !item.medicineId || !item.supplierId);
    if (invalidItems.length > 0) {
      alert('Hay medicamentos sin proveedor asignado. Por favor, elimínelos y agréguelos nuevamente.');
      return;
    }

    try {
      const receiptData = {
        supplierId: receiptItems[0].supplierId,
        date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        notes: `Entrada con tasa DOP-USD: ${exchangeRate.rate}, Tasa envío internacional: ${shippingRate?.internationalRate || 0}`,
        items: receiptItems.map(item => ({
          medicineId: item.medicineId,
          qty: item.quantity,
          unitCost: item.unitCost,
          weightKg: item.weightKg,
          lot: item.lot,
          expirationDate: item.expirationDate
        }))
      };

      console.log('Enviando datos de entrada:', receiptData);
      
      // Preparar items para el backend
      const itemsToSend = receiptData.items.map(item => {
        const medicineIdNum = Number(item.medicineId);
        const qtyNum = Number(item.quantity || item.qty || 0);
        
        if (isNaN(medicineIdNum) || !medicineIdNum) {
          console.error('MedicineId inválido:', item.medicineId);
          throw new Error(`MedicineId inválido para: ${item.nombreComercial || 'medicamento desconocido'}`);
        }
        
        if (isNaN(qtyNum) || qtyNum <= 0) {
          console.error('Cantidad inválida:', item.quantity);
          throw new Error(`Cantidad inválida para: ${item.nombreComercial || 'medicamento desconocido'}`);
        }
        
        // Validación extra: fecha en formato YYYY-MM-DD
        const exp = item.expirationDate && String(item.expirationDate).match(/^\d{4}-\d{2}-\d{2}$/)
          ? item.expirationDate
          : null;

        return {
          medicineId: medicineIdNum,
          qty: qtyNum,
          unit_cost: Number(item.unitCost || 0),
          weight_kg: Number(item.weightKg || 0),
          lot: item.lot || null,
          expirationDate: exp
        };
      });
      
      console.log('Items a enviar:', itemsToSend);
      console.log('Receipt items originales:', receiptItems);
      
      // Debug: Ver qué datos tiene receiptItems
      receiptItems.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          medicineId: item.medicineId,
          supplierId: item.supplierId,
          quantity: item.quantity,
          unitCost: item.unitCost
        });
      });
      
      // Verificar que el supplierId sea un número
      const supplierIdNum = Number(receiptData.supplierId);
      if (isNaN(supplierIdNum) || !supplierIdNum) {
        alert('Error: El proveedor no es válido. Por favor, elimine los items y agréguelos nuevamente.\n\nSupplierId recibido: ' + receiptData.supplierId);
        console.error('SupplierId inválido:', receiptData.supplierId, 'de receiptItems[0]:', receiptItems[0]);
        return;
      }
      
      const payloadToSend = {
        supplierId: supplierIdNum,
        date: receiptData.date,
        notes: receiptData.notes || null,
        items: itemsToSend
      };
      
      console.log('Datos completos a enviar:', JSON.stringify(payloadToSend, null, 2));
      
      // Enviar datos reales al backend
      const response = await api.post('/receipts', payloadToSend);
      
      console.log('Respuesta del servidor:', response.data);
      
      alert('Entrada guardada exitosamente');
      
      // Recargar medicamentos para actualizar el stock
      await loadMedicines();
      
      // Disparar evento para que las otras páginas recarguen medicamentos
      localStorage.setItem('medicinesUpdated', JSON.stringify({ timestamp: Date.now() }));
      
      // Limpiar todo
      setReceiptItems([]);
      setSelectedMedicine(null);
      setSelectedSupplier(null);
      setSelectedPrice(null);
    } catch (error) {
      console.error('Error guardando entrada:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      console.error('Error response:', error?.response);
      
      let errorMsg = 'Error desconocido';
      if (error?.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error?.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      console.error('Mensaje de error:', errorMsg);
      alert(`Error guardando la entrada:\n${errorMsg}`);
    }
  };

  // Nota: medicineFilter ya no se usa como UI separada; se mantiene por compatibilidad
  // con lógica existente (limpieza, etc.) pero el combobox maneja su propio texto.
  const filteredMedicines = medicines;

  // Nota: la UI de proveedor fue removida (se deriva desde el precio seleccionado).
  // Se mantiene suppliers/supplierFilter para compatibilidad con preselección por URL.
  const filteredSuppliers = suppliers;

  // Debug log para verificar el estado
  console.log('Estado actual - exchangeRate:', exchangeRate);
  console.log('Estado actual - shippingRate:', shippingRate);

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header con tasas */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span>T.C.: {exchangeRate?.rate || 'Cargando...'}</span>
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
                  updateShippingRate(updatedRate);
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
        </div>
      </div>

      {/* Sección superior - Formulario de entrada */}
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
          Entrada de Medicamentos
        </h2>

        {/* Selección de medicamento */}
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '250px 200px 160px 160px', gap: '12px', marginBottom: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
                Medicamento
              </label>
              <ComboBox
                items={filteredMedicines}
                value={selectedMedicine}
                onChange={(medicine) => {
                  if (medicine) {
                    handleMedicineSelect(medicine);
                  } else {
                    setSelectedMedicine(null);
                    setMedicinePrices([]);
                    setSelectedPrice(null);
                    setSelectedSupplier(null);
                    setCurrentItem((prev) => ({
                      ...prev,
                      medicineId: '',
                      supplierId: '',
                      priceId: '',
                      unitCost: 0,
                      weightKg: 0
                    }));
                  }
                }}
                getItemKey={(m) => m.id}
                getItemLabel={(m) => `${m.codigo} - ${m.nombreComercial}`}
                inputPlaceholder="Escribe nombre o código..."
                maxResults={30}
                styles={{
                  root: { marginBottom: '0px' }
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
                Precio de Compra
              </label>
              <select
                value={selectedPrice?.id || ''}
                onChange={(e) => {
                  const price = medicinePrices.find(p => p.id === parseInt(e.target.value));
                  if (price) handlePriceSelect(price);
                }}
                disabled={!selectedMedicine || medicinePrices.length === 0}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '6px',
                  backgroundColor: !selectedMedicine || medicinePrices.length === 0 ? '#f8f9fa' : 'white'
                }}
                title={medicinePrices.length === 0 ? 'No hay precios configurados para este medicamento' : ''}
              >
                <option value="">
                  {medicinePrices.length === 0 
                    ? 'Sin precios disponibles' 
                    : `${medicinePrices.length} precio${medicinePrices.length > 1 ? 's' : ''} disponible${medicinePrices.length > 1 ? 's' : ''}`
                  }
                </option>
                {medicinePrices.map(price => (
                  <option key={price.id} value={price.id}>
                    {`${parseFloat(price.precioCompraUnitario).toFixed(2)} DOP - ${price.supplier?.name || ''}`}
                  </option>
                ))}
              </select>
              {selectedPrice && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  {`Proveedor: ${selectedPrice.supplier?.name || ''}`}
                </div>
              )}
              
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', marginTop: '6px', fontWeight: '500' }}>
                Cantidad
              </label>
              <input
                type="number"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
                Lote
              </label>
              <input
                type="text"
                value={currentItem.lot}
                onChange={(e) => setCurrentItem({ ...currentItem, lot: e.target.value })}
                placeholder="Lote"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '6px'
                }}
              />
              
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', marginTop: '6px', fontWeight: '500' }}>
                Vencimiento
              </label>
              <input
                type="date"
                value={currentItem.expirationDate}
                onChange={(e) => setCurrentItem({ ...currentItem, expirationDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '6px' }}>
            <button
              onClick={addItemToReceipt}
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
              onClick={handleSaveReceipt}
              disabled={receiptItems.length === 0}
              style={{
                padding: '6px 12px',
                backgroundColor: receiptItems.length === 0 ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '11px',
                cursor: receiptItems.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              💾 Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Sección inferior - Tabla de medicamentos */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        margin: '0 8px 8px 8px',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '4px 8px',
          borderBottom: '1px solid #dee2e6',
          fontSize: '12px',
          fontWeight: '600',
          color: '#495057'
        }}>
          Medicamentos a Entrar
        </div>
        
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '12px',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', width: '100px' }}>Nombre Comercial</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', width: '50px' }}>Presentación</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '30px' }}>Peso (kg)</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '30px' }}>Cantidad</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '60px' }}>Precio Compra DOP</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '60px' }}>Subtotal DOP</th>
                <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #dee2e6', fontSize: '12px', whiteSpace: 'nowrap', width: '30px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {receiptItems.length === 0 ? (
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
                receiptItems.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }} title={item.nombreComercial}>
                      <span style={{ marginRight: '4px' }}>▶</span>
                      {item.nombreComercial}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50px' }} title={item.presentacion}>{item.presentacion}</td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', textAlign: 'center' }}>{item.weightKg}</td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontSize: '12px', textAlign: 'right' }}>${item.precioCompra.toFixed(2)} DOP</td>
                    <td style={{ padding: '6px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#007bff', fontSize: '12px', textAlign: 'right' }}>
                      ${item.subtotalDOP.toFixed(2)} DOP
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
        {receiptItems.length > 0 && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <span>Total: ${calculateTotal().toFixed(2)} DOP</span>
            <span>Items: {receiptItems.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptFormAdvanced;