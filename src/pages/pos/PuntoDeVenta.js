import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CheckCircle, XCircle, Plus, Minus, Star } from 'lucide-react';
import { Button, Modal } from '../../components/ui/ComponentesUI'; // Asumo que tu Modal puede ser estilizado
import { toast } from 'sonner';

// --- Componente para cada item del carrito ---
const ItemCarrito = ({ item, onUpdate, onRemove }) => {
    const handleQuantityChange = (e) => {
        const newQuantity = parseInt(e.target.value, 10);
        if (!isNaN(newQuantity)) {
            onUpdate(item.id, newQuantity);
        } else if (e.target.value === '') {
            onUpdate(item.id, 0); 
        }
    };

    const handleBlur = (e) => {
        const finalQuantity = parseInt(e.target.value, 10);
        if (isNaN(finalQuantity) || finalQuantity < 1) {
            onUpdate(item.id, 1);
        }
    };
    
    return (
        <div className="flex items-center gap-3 py-3">
            <div className="flex-grow">
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onUpdate(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><Minus size={14} /></button>
                <input
                    type="number"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleBlur}
                    min="1"
                    className="w-12 text-center font-bold bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button onClick={() => onUpdate(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><Plus size={14} /></button>
            </div>
            <p className="font-bold w-20 text-right text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
        </div>
    );
};

// --- Componente para la tarjeta de producto ---
const TarjetaProducto = ({ producto, onAgregar }) => (
    <div 
        onClick={onAgregar}
        className={`p-4 rounded-lg flex flex-col text-center transition-all duration-200 transform hover:-translate-y-1 ${producto.stock > 0 ? 'cursor-pointer bg-white shadow hover:shadow-lg' : 'bg-gray-200 opacity-60 cursor-not-allowed'}`}
    >
        <div className="flex-grow flex items-center justify-center min-h-[60px]">
            <p className="font-bold text-gray-800 leading-tight">{producto.name}</p>
        </div>
        <div className="mt-2">
            <p className={`text-xs ${producto.stock <= 5 && producto.stock > 0 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                {producto.stock > 0 ? `${producto.stock} en stock` : 'Sin stock'}
            </p>
            <p className="text-lg font-semibold text-blue-600">${parseFloat(producto.sale_price).toFixed(2)}</p>
        </div>
    </div>
);


// --- Componente principal del Punto de Venta ---
const PuntoDeVenta = ({ productosActivos, metodosDePago, onVentaCompleta, productosPopulares }) => {
    // --- ESTADOS ---
    const [carrito, setCarrito] = useState([]);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
    const [efectivoRecibido, setEfectivoRecibido] = useState(0);
    const [idMetodoPagoSeleccionado, setIdMetodoPagoSeleccionado] = useState('');

    // --- EFECTOS ---
    useEffect(() => {
        if (metodosDePago && metodosDePago.length > 0) {
            const metodoEfectivo = metodosDePago.find(m => m.name.toLowerCase() === 'efectivo') || metodosDePago[0];
            setIdMetodoPagoSeleccionado(metodoEfectivo.id);
        } else {
            setIdMetodoPagoSeleccionado('');
        }
    }, [metodosDePago]);
    
    // --- LÓGICA DE NEGOCIO ---
    const agregarACarrito = (producto, cantidad = 1) => {
        if (producto.stock <= 0) { toast.error(`El producto "${producto.name}" no tiene stock.`); return; }
        setCarrito(carritoActual => {
            const itemExistente = carritoActual.find(item => item.id === producto.id);
            if (itemExistente) {
                const nuevaCantidad = itemExistente.quantity + cantidad;
                if (nuevaCantidad > producto.stock) { toast.warning('No puedes agregar más unidades de este producto.'); return carritoActual; }
                if (nuevaCantidad <= 0) { return carritoActual.filter(item => item.id !== producto.id); }
                return carritoActual.map(item => item.id === producto.id ? { ...item, quantity: nuevaCantidad } : item);
            }
            if (cantidad > 0) {
                return [...carritoActual, { ...producto, quantity: 1, price: parseFloat(producto.sale_price) }];
            }
            return carritoActual;
        });
    };

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        const producto = productosActivos.find(p => p.id === productoId);
        if (nuevaCantidad !== 0 && nuevaCantidad > producto.stock) {
            toast.warning(`Stock máximo (${producto.stock}) alcanzado para "${producto.name}".`);
            setCarrito(carritoActual => carritoActual.map(item => item.id === productoId ? { ...item, quantity: producto.stock } : item));
            return;
        }
        if (nuevaCantidad < 0) {
             setCarrito(carritoActual => carritoActual.filter(item => item.id !== productoId));
             return;
        }
        setCarrito(carritoActual => carritoActual.map(item => item.id === productoId ? { ...item, quantity: nuevaCantidad } : item));
    };
    
    const handleBusquedaEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (productosFiltrados.length === 1) {
                const producto = productosFiltrados[0];
                agregarACarrito(producto);
                toast.success(`${producto.name} agregado al carrito.`);
                setTerminoBusqueda('');
            } else if (productosFiltrados.length > 1) {
                toast.info("Múltiples resultados. Por favor, selecciona un producto.");
            } else {
                toast.error("Ningún producto encontrado con ese código.");
            }
        }
    };
    
    const limpiarVenta = () => { if (carrito.length === 0) return; toast("Limpiar Venta", { description: "¿Estás seguro de que quieres limpiar la venta actual? Se vaciará el carrito.", action: { label: "Sí, limpiar", onClick: () => { setCarrito([]); setTerminoBusqueda(''); toast.success("Venta limpiada."); } }, cancel: { label: "No" }, }); };
    const procesarPago = () => { if (carrito.length === 0) { toast.error("El carrito está vacío."); return; } if (!idMetodoPagoSeleccionado) { toast.error("Por favor, selecciona un método de pago."); return; } onVentaCompleta(carrito, totalFinal, idMetodoPagoSeleccionado); setCarrito([]); setTerminoBusqueda(''); setModalPagoAbierto(false); setEfectivoRecibido(0); };
    
    // --- CÁLCULOS MEMORIZADOS ---
    const subtotal = useMemo(() => carrito.reduce((sum, item) => sum + item.price * (item.quantity || 0), 0), [carrito]);
    const metodoSeleccionado = useMemo(() => metodosDePago.find(pm => pm.id === parseInt(idMetodoPagoSeleccionado)), [metodosDePago, idMetodoPagoSeleccionado]);
    const porcentajeAjuste = useMemo(() => metodoSeleccionado ? parseFloat(metodoSeleccionado.adjustment_percentage) : 0, [metodoSeleccionado]);
    const totalFinal = useMemo(() => subtotal * (1 + porcentajeAjuste / 100), [subtotal, porcentajeAjuste]);
    const vuelto = useMemo(() => efectivoRecibido > totalFinal ? efectivoRecibido - totalFinal : 0, [efectivoRecibido, totalFinal]);
    const productosFiltrados = useMemo(() => { if (!terminoBusqueda) return []; return productosActivos.filter(p => p.name.toLowerCase().includes(terminoBusqueda.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(terminoBusqueda.toLowerCase()))); }, [productosActivos, terminoBusqueda]);


    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        // CONTENEDOR PRINCIPAL - Usa un gris neutro para el fondo general del área de trabajo
        <div className="flex h-full bg-gray-100 gap-4 p-4">

            {/* COLUMNA IZQUIERDA (PRODUCTOS) */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22}/>
                    <input type="text" placeholder="Escanear o buscar producto por nombre/SKU..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-lg text-gray-700 focus:ring-blue-500 focus:border-blue-500" value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} onKeyDown={handleBusquedaEnter} />
                </div>
                
                {/* Panel que muestra productos populares o resultados */}
                <div className="flex-grow flex flex-col bg-gray-50 rounded-xl p-4 min-h-0 border">
                    {terminoBusqueda ? (
                        <>
                            <h3 className="font-semibold text-gray-500 px-2 mb-3">Resultados de Búsqueda</h3>
                            <div className="flex-grow overflow-y-auto pr-2">
                                {productosFiltrados.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {productosFiltrados.map(producto => <TarjetaProducto key={producto.id} producto={producto} onAgregar={() => agregarACarrito(producto)} />)}
                                    </div>
                                ) : (
                                    <div className="text-center py-16"><h3 className="text-lg font-semibold text-gray-700">No se encontraron productos</h3><p className="text-gray-500 mt-1">Intenta con otro término.</p></div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <Star className="text-yellow-400" />
                                <h3 className="font-semibold text-gray-700">Acceso Rápido (Populares)</h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {productosPopulares.slice(0, 10).map(p => (
                                    // Botones de acceso rápido
                                    <Button key={p.id} onClick={() => agregarACarrito(p)} variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                                        {p.name}
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* COLUMNA DERECHA (CARRITO) - Estilo blanco limpio que combina con el panel de admin */}
            <div className="w-96 flex-shrink-0 bg-white text-gray-800 rounded-xl shadow-md flex flex-col border">
                <div className="p-4 flex justify-between items-center border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900"><ShoppingCart size={22}/> Venta</h2>
                    <Button onClick={limpiarVenta} variant="ghost" size="icon" className="text-gray-500 hover:text-red-600"><XCircle size={22} /></Button>
                </div>
                
                <div className="flex-grow overflow-y-auto px-4 divide-y min-h-0">
                    {carrito.length === 0 ? 
                        <p className="text-gray-500 text-center py-20">El carrito está vacío</p> : 
                        carrito.map(item => <ItemCarrito key={item.id} item={item} onUpdate={actualizarCantidad} onRemove={() => setCarrito(carrito.filter(c => c.id !== item.id && c.quantity > 0))} />)
                    }
                </div>
                
                <div className="p-4 mt-auto bg-gray-50 rounded-b-xl border-t">
                    <div className="space-y-2 text-md mb-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
                        </div>
                        {porcentajeAjuste !== 0 && (
                            <div className={`flex justify-between ${porcentajeAjuste < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <span>Ajuste ({porcentajeAjuste > 0 ? '+' : ''}{porcentajeAjuste}%):</span>
                                <span className="font-semibold">${(totalFinal - subtotal).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-2xl font-bold border-t pt-2 mt-2">
                            <span className="text-gray-900">TOTAL:</span>
                            <span className="text-blue-600">${totalFinal.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button onClick={() => setModalPagoAbierto(true)} className="w-full text-lg py-3 bg-blue-600 hover:bg-blue-700 text-white" icon={CheckCircle} disabled={carrito.length === 0}>Cobrar</Button>
                </div>
            </div>

            {/* MODAL DE PAGO - Estilo claro y limpio */}
            <Modal isOpen={modalPagoAbierto} onClose={() => setModalPagoAbierto(false)} title="Procesar Pago">
                <div className="space-y-4 text-gray-700">
                    <p className="text-right text-lg">Subtotal: <span className="font-semibold">${subtotal.toFixed(2)}</span></p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                        <select value={idMetodoPagoSeleccionado} onChange={(e) => setIdMetodoPagoSeleccionado(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500">
                            {metodosDePago.length === 0 ? (<option value="">No hay métodos</option>) : (metodosDePago.map(pm => <option key={pm.id} value={pm.id}>{pm.name} ({pm.adjustment_percentage > 0 ? '+' : ''}{pm.adjustment_percentage}%)</option>))}
                        </select>
                    </div>
                    
                    <div className="text-center bg-blue-50 text-blue-800 p-4 rounded-lg my-4">
                        <p className="text-sm uppercase font-bold">Total a Pagar</p>
                        <p className="text-5xl font-bold">${totalFinal.toFixed(2)}</p>
                    </div>

                    {metodoSeleccionado?.name.toLowerCase().includes('efectivo') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo Recibido</label>
                            <input type="number" value={efectivoRecibido || ''} onChange={(e) => setEfectivoRecibido(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-gray-300 rounded-lg text-lg" placeholder="0.00" />
                            {efectivoRecibido >= totalFinal && <p className="text-xl font-semibold mt-3 text-green-600 text-center">Vuelto: ${vuelto.toFixed(2)}</p>}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button onClick={() => setModalPagoAbierto(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={procesarPago} variant="primary" className="bg-blue-600 hover:bg-blue-700">Finalizar Venta</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PuntoDeVenta;