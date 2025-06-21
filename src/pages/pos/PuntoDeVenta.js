import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui/ComponentesUI';
import { toast } from 'sonner';

const PuntoDeVenta = ({ productosActivos, metodosDePago, onVentaCompleta, productosPopulares }) => {
    const [carrito, setCarrito] = useState([]);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
    const [efectivoRecibido, setEfectivoRecibido] = useState(0);
    const [idMetodoPagoSeleccionado, setIdMetodoPagoSeleccionado] = useState('');

    useEffect(() => {
        if (metodosDePago && metodosDePago.length > 0) {
            const metodoEfectivo = metodosDePago.find(m => m.name.toLowerCase() === 'efectivo') || metodosDePago[0];
            setIdMetodoPagoSeleccionado(metodoEfectivo.id);
        } else {
            setIdMetodoPagoSeleccionado('');
        }
    }, [metodosDePago]);

    const productosEnPantalla = useMemo(() => {
        if (terminoBusqueda) {
            return productosActivos.filter(p => 
                p.name.toLowerCase().includes(terminoBusqueda.toLowerCase()) || 
                p.sku.toLowerCase().includes(terminoBusqueda.toLowerCase())
            );
        }
        return productosPopulares;
    }, [productosActivos, productosPopulares, terminoBusqueda]);

    const agregarACarrito = (producto) => {
        if (producto.stock <= 0) { 
            toast.error(`El producto "${producto.name}" no tiene stock.`); 
            return; 
        }
        setCarrito(carritoActual => {
            const itemExistente = carritoActual.find(item => item.id === producto.id);
            if (itemExistente) {
                if (itemExistente.quantity >= producto.stock) {
                    toast.warning('No puedes agregar más unidades de este producto.');
                    return carritoActual;
                }
                return carritoActual.map(item => item.id === producto.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...carritoActual, { ...producto, quantity: 1, price: parseFloat(producto.sale_price) }];
        });
    };

    const actualizarCantidadManualmente = (productoId, cantidad) => {
        const nuevaCantidad = parseInt(cantidad, 10);
        setCarrito(carritoActual => {
            if (isNaN(nuevaCantidad)) {
                return carritoActual.map(item => item.id === productoId ? { ...item, quantity: '' } : item);
            }
            const itemAjustar = carritoActual.find(item => item.id === productoId);
            if (nuevaCantidad <= 0) {
                return carritoActual.filter(item => item.id !== productoId);
            }
            if (nuevaCantidad > itemAjustar.stock) {
                toast.warning(`Stock máximo (${itemAjustar.stock}) alcanzado para "${itemAjustar.name}".`);
                return carritoActual.map(item => item.id === productoId ? { ...item, quantity: itemAjustar.stock } : item);
            }
            return carritoActual.map(item => item.id === productoId ? { ...item, quantity: nuevaCantidad } : item);
        });
    };

    const limpiarVenta = () => {
        if (carrito.length === 0) return;
        
        toast("Limpiar Venta", {
            description: "¿Estás seguro de que quieres limpiar la venta actual? Se vaciará el carrito.",
            action: {
                label: "Sí, limpiar",
                onClick: () => {
                    setCarrito([]);
                    setTerminoBusqueda('');
                    toast.success("Venta limpiada.");
                }
            },
            cancel: {
                label: "No"
            },
        });
    };
    
    const procesarPago = () => {
        if (carrito.length === 0) { 
            toast.error("El carrito está vacío."); 
            return; 
        }
        if (!idMetodoPagoSeleccionado) { 
            toast.error("Por favor, selecciona un método de pago."); 
            return; 
        }
        onVentaCompleta(carrito, subtotal, idMetodoPagoSeleccionado);
        setCarrito([]); 
        setTerminoBusqueda(''); 
        setModalPagoAbierto(false); 
        setEfectivoRecibido(0);
    };
    
    const subtotal = useMemo(() => carrito.reduce((sum, item) => sum + item.price * (item.quantity || 0), 0), [carrito]);
    const metodoSeleccionado = useMemo(() => metodosDePago.find(pm => pm.id === parseInt(idMetodoPagoSeleccionado)), [metodosDePago, idMetodoPagoSeleccionado]);
    const porcentajeAjuste = useMemo(() => metodoSeleccionado ? parseFloat(metodoSeleccionado.adjustment_percentage) : 0, [metodoSeleccionado]);
    const totalFinal = useMemo(() => subtotal * (1 + porcentajeAjuste / 100), [subtotal, porcentajeAjuste]);
    const vuelto = useMemo(() => efectivoRecibido > totalFinal ? efectivoRecibido - totalFinal : 0, [efectivoRecibido, totalFinal]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            <div className="lg:col-span-2 bg-gray-50 p-4 rounded-xl flex flex-col">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="Buscar producto por nombre o SKU..." className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg" value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} />
                </div>
                <h3 className="font-semibold text-gray-600 px-2 mb-2">{terminoBusqueda ? 'Resultados de Búsqueda' : 'Productos Populares'}</h3>

                <div className="flex-grow overflow-y-auto pr-2">
                    {productosEnPantalla.length > 0 ? (
                        productosEnPantalla.map(producto => (
                            <div key={producto.id} onClick={() => agregarACarrito(producto)} className={`flex justify-between items-center p-3 mb-2 rounded-lg border-b text-left ${producto.stock > 0 ? 'cursor-pointer hover:bg-indigo-100 bg-white' : 'bg-gray-200 opacity-60'}`}>
                                <div>
                                    <p className="font-bold text-gray-800">{producto.name}</p>
                                    <p className={`text-xs ${producto.stock <= 5 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>Stock: {producto.stock}</p>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">${parseFloat(producto.sale_price).toFixed(2)}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 px-6">
                            <h3 className="text-lg font-semibold text-gray-700">No se encontraron productos</h3>
                            {terminoBusqueda && <p className="text-gray-500 mt-1">Intenta con otro término de búsqueda.</p>}
                        </div>
                    )}
                </div>
            </div>

            <Card className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={24}/> Venta Actual</h2>
                    <Button onClick={limpiarVenta} variant="ghost" size="icon" className="text-gray-500 hover:text-red-600"><XCircle size={22} /></Button>
                </div>
                <div className="flex-grow overflow-y-auto border-t border-b py-2 space-y-2 min-h-0">
                    {carrito.length === 0 ? 
                        <p className="text-gray-500 text-center py-10">El carrito está vacío</p> : 
                        carrito.map(item => 
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" value={item.quantity} onChange={(e) => actualizarCantidadManualmente(item.id, e.target.value)} className="w-16 text-center font-bold border rounded-md p-1" onFocus={(e) => e.target.select()} />
                                    <p className="font-bold w-24 text-right">${(item.price * (item.quantity || 0)).toFixed(2)}</p>
                                    <button onClick={() => setCarrito(carrito.filter(c => c.id !== item.id))} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )
                    }
                </div>
                <div className="mt-auto pt-4">
                    <div className="flex justify-between text-2xl font-bold mb-4">
                        <span>SUBTOTAL:</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <Button onClick={() => setModalPagoAbierto(true)} className="w-full text-lg" variant="success" icon={CheckCircle} disabled={carrito.length === 0}>Cobrar</Button>
                </div>
            </Card>

            <Modal isOpen={modalPagoAbierto} onClose={() => setModalPagoAbierto(false)} title="Procesar Pago">
                <div className="space-y-4">
                    <div className="text-right text-lg">Subtotal: ${subtotal.toFixed(2)}</div>
                    <div>
                        <label className="font-semibold text-gray-700">Método de Pago</label>
                        <select value={idMetodoPagoSeleccionado} onChange={(e) => setIdMetodoPagoSeleccionado(e.target.value)} className="w-full mt-1 p-2 border rounded-lg">
                            {metodosDePago.length === 0 ? (<option value="">No hay métodos disponibles</option>) : (metodosDePago.map(pm => <option key={pm.id} value={pm.id}>{pm.name} ({pm.adjustment_percentage}%)</option>))}
                        </select>
                    </div>
                    {porcentajeAjuste !== 0 && (<div className={`text-right text-lg ${porcentajeAjuste < 0 ? 'text-green-600' : 'text-red-600'}`}>Ajuste: {porcentajeAjuste > 0 ? '+' : ''}{porcentajeAjuste.toFixed(2)}%</div>)}
                    <div className="text-center text-4xl font-bold text-indigo-600 mb-4">${totalFinal.toFixed(2)}</div>
                    {metodoSeleccionado?.name === 'Efectivo' && (
                        <div>
                            <label className="font-semibold text-gray-700">Efectivo Recibido</label>
                            <input type="number" value={efectivoRecibido || ''} onChange={(e) => setEfectivoRecibido(parseFloat(e.target.value) || 0)} className="w-full mt-1 p-2 border rounded-lg" placeholder="0.00" />
                            {efectivoRecibido > totalFinal && <p className="text-lg font-semibold mt-2 text-green-600">Vuelto: ${vuelto.toFixed(2)}</p>}
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setModalPagoAbierto(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={procesarPago} variant="success">Finalizar Venta</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PuntoDeVenta;