import React, { useState, useMemo } from 'react';
// Se importa el icono 'Eraser' para el nuevo botón de limpiar venta.
import { Search, ShoppingCart, Trash2, CheckCircle, XCircle, Eraser } from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui/ComponentesUI';

const PuntoDeVenta = ({ productos, metodosDePago, onVentaCompleta }) => {
    const [carrito, setCarrito] = useState([]);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
    const [efectivoRecibido, setEfectivoRecibido] = useState(0);
    const [idMetodoPago, setIdMetodoPago] = useState(metodosDePago[0]?.id || '');

    // --- LÓGICA DE PRODUCTOS A MOSTRAR ---
    // Si no hay búsqueda, muestra los primeros 5 productos como "Top Ventas" (simulado).
    // Cuando el backend pueda proveer un ranking real, esta lógica se puede reemplazar fácilmente.
    const productosEnPantalla = useMemo(() => {
        if (terminoBusqueda) {
            return productos.filter(p => 
                p.name.toLowerCase().includes(terminoBusqueda.toLowerCase()) || 
                p.sku.toLowerCase().includes(terminoBusqueda.toLowerCase())
            );
        }
        return productos.slice(0, 5); // Simulación de "Top 5 Más Vendidos"
    }, [productos, terminoBusqueda]);

    const agregarACarrito = (producto) => {
        if (producto.stock <= 0) { 
            alert(`El producto "${producto.name}" no tiene stock.`); 
            return; 
        }
        setCarrito(carritoActual => {
            const itemExistente = carritoActual.find(item => item.id === producto.id);
            if (itemExistente) {
                // Si ya existe, simplemente enfoca al usuario en modificar la cantidad.
                // Opcional: podríamos aumentar en 1, pero la nueva lógica favorece la edición manual.
                if (itemExistente.quantity >= producto.stock) {
                    alert('No puedes agregar más unidades.');
                    return carritoActual;
                }
                return carritoActual.map(item => item.id === producto.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...carritoActual, { ...producto, quantity: 1, price: parseFloat(producto.sale_price) }];
        });
    };

    // --- FUNCIÓN NUEVA: Permite modificar la cantidad tipeando en un input ---
    const actualizarCantidadManualmente = (productoId, cantidad) => {
        const nuevaCantidad = parseInt(cantidad, 10);

        setCarrito(carritoActual => {
            // Si el input está vacío o no es un número, no hacemos nada aún
            if (isNaN(nuevaCantidad)) {
                return carritoActual.map(item => item.id === productoId ? { ...item, quantity: '' } : item);
            }

            const itemAjustar = carritoActual.find(item => item.id === productoId);
            
            if (nuevaCantidad <= 0) {
                // Si la cantidad es 0 o menos, se elimina
                return carritoActual.filter(item => item.id !== productoId);
            }

            if (nuevaCantidad > itemAjustar.stock) {
                alert(`Stock máximo (${itemAjustar.stock}) alcanzado para "${itemAjustar.name}".`);
                // Se establece la cantidad al máximo stock disponible
                return carritoActual.map(item => item.id === productoId ? { ...item, quantity: itemAjustar.stock } : item);
            }
            
            return carritoActual.map(item => item.id === productoId ? { ...item, quantity: nuevaCantidad } : item);
        });
    };

    const limpiarVenta = () => {
        if (carrito.length > 0 && window.confirm("¿Estás seguro de que quieres limpiar la venta actual? Se vaciará el carrito.")) {
            setCarrito([]);
            setTerminoBusqueda('');
        }
    };
    
    // ... (resto de funciones sin cambios significativos) ...
    const procesarPago = () => {
        if (carrito.length === 0) { alert("El carrito está vacío."); return; }
        if (!idMetodoPago) { alert("Por favor, selecciona un método de pago."); return; }
        onVentaCompleta(carrito, subtotal, idMetodoPago);
        setCarrito([]); 
        setTerminoBusqueda(''); 
        setModalPagoAbierto(false); 
        setEfectivoRecibido(0);
    };
    const subtotal = carrito.reduce((sum, item) => sum + item.price * (item.quantity || 0), 0);
    const metodoSeleccionado = metodosDePago.find(pm => pm.id === parseInt(idMetodoPago));
    const porcentajeAjuste = metodoSeleccionado ? parseFloat(metodoSeleccionado.adjustment_percentage) : 0;
    const totalFinal = subtotal * (1 + porcentajeAjuste / 100);
    const vuelto = efectivoRecibido > totalFinal ? efectivoRecibido - totalFinal : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            <div className="lg:col-span-2 bg-gray-50 p-4 rounded-xl flex flex-col">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="Buscar producto por nombre o SKU..." className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg" value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} />
                </div>
                {/* --- CAMBIO: La vista de productos ahora es una LISTA --- */}
                <h3 className="font-semibold text-gray-600 px-2 mb-2">{terminoBusqueda ? 'Resultados de Búsqueda' : 'Productos Frecuentes'}</h3>
                <div className="flex-grow overflow-y-auto pr-2">
                    {productosEnPantalla.map(producto => (
                        <div key={producto.id} onClick={() => agregarACarrito(producto)} className={`flex justify-between items-center p-3 mb-2 rounded-lg border-b text-left ${producto.stock > 0 ? 'cursor-pointer hover:bg-indigo-100 bg-white' : 'bg-gray-200 opacity-60'}`}>
                            <div>
                                <p className="font-bold text-gray-800">{producto.name}</p>
                                <p className={`text-xs ${producto.stock <= 5 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>Stock: {producto.stock}</p>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">${parseFloat(producto.sale_price).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <Card className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={24}/> Venta Actual</h2>
                    <Button onClick={limpiarVenta} variant="ghost" size="icon" className="text-gray-500 hover:text-red-600"><XCircle size={22} /></Button>
                </div>
                <div className="flex-grow overflow-y-auto border-t border-b py-2 space-y-2">
                    {carrito.length === 0 ? 
                        <p className="text-gray-500 text-center py-10">El carrito está vacío</p> : 
                        carrito.map(item => 
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100">
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* --- CAMBIO: Input para editar la cantidad manualmente --- */}
                                    <input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => actualizarCantidadManualmente(item.id, e.target.value)} 
                                        className="w-16 text-center font-bold border rounded-md p-1"
                                        onFocus={(e) => e.target.select()}
                                    />
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
                    <Button onClick={() => setModalPagoAbierto(true)} className="w-full text-lg" variant="success" icon={CheckCircle}>Cobrar</Button>
                </div>
            </Card>
            <Modal isOpen={modalPagoAbierto} onClose={() => setModalPagoAbierto(false)} title="Procesar Pago">
                {/* ... (Contenido del modal de pago sin cambios) ... */}
            </Modal>
        </div>
    );
};

export default PuntoDeVenta;

