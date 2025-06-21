import React, { useState, useContext, useMemo } from 'react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Card, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

const ActualizacionMasivaPrecios = ({ productos, proveedores, obtenerDatos }) => {
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
    const [productosSeleccionados, setProductosSeleccionados] = useState(new Set());
    const [porcentaje, setPorcentaje] = useState('');
    const [objetivo, setObjetivo] = useState('both');
    const { tokensAuth } = useContext(ContextoAuth);

    const productosFiltrados = useMemo(() => {
        if (!proveedorSeleccionado) return [];
        return productos.filter(p => p.provider === parseInt(proveedorSeleccionado));
    }, [productos, proveedorSeleccionado]);

    const { datosPaginados, PaginacionUI } = useFiltrosYBusqueda({
        items: productosFiltrados,
        itemsPorPagina: 10,
        logicaDeFiltro: (items) => items, 
        ComponenteFiltros: () => null, 
        filtrosIniciales: {}
    });

    const seleccionarTodos = () => {
        if (productosSeleccionados.size === productosFiltrados.length) {
            setProductosSeleccionados(new Set());
        } else {
            setProductosSeleccionados(new Set(productosFiltrados.map(p => p.id)));
        }
    };
    
    const seleccionarProducto = (idProducto) => {
        const nuevaSeleccion = new Set(productosSeleccionados);
        if (nuevaSeleccion.has(idProducto)) {
            nuevaSeleccion.delete(idProducto);
        } else {
            nuevaSeleccion.add(idProducto);
        }
        setProductosSeleccionados(nuevaSeleccion);
    };

    const actualizarPrecios = async () => {
        // 1. Validación inicial con un toast de error
        if(productosSeleccionados.size === 0 || !porcentaje || !objetivo) {
            toast.error("Por favor, selecciona productos, un porcentaje y un objetivo de actualización.");
            return;
        }

        const payload = {
            product_ids: Array.from(productosSeleccionados),
            percentage: porcentaje,
            update_target: objetivo
        };

        const ejecutarActualizacion = () => {
            const promesa = fetch(`${API_URL}/bulk-price-update/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
                body: JSON.stringify(payload)
            }).then(res => {
                if (!res.ok) return res.json().then(err => Promise.reject(err));
                return res.json();
            });

            toast.promise(promesa, {
                loading: 'Actualizando precios...',
                success: (data) => {
                    obtenerDatos();
                    setProductosSeleccionados(new Set());
                    setPorcentaje('');
                    return data.message || 'Precios actualizados con éxito.';
                },
                error: (err) => `Error al actualizar: ${JSON.stringify(err)}`
            });
        };

        // 2. Notificación de confirmación con botones de acción
        toast("Confirmar Actualización", {
            description: `¿Estás seguro de que quieres actualizar ${productosSeleccionados.size} productos con un ${porcentaje}% de ajuste? Esta acción no se puede deshacer.`,
            action: {
                label: "Sí, actualizar",
                onClick: () => ejecutarActualizacion()
            },
            cancel: {
                label: "Cancelar"
            },
            duration: 10000, // Duración más larga para que el usuario pueda decidir
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Actualización Masiva de Precios</h1>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Filtrar por Proveedor</label>
                        <select value={proveedorSeleccionado} onChange={(e) => setProveedorSeleccionado(e.target.value)} className="p-2 border rounded-lg w-full mt-1">
                            <option value="">Seleccionar Proveedor</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Porcentaje de Ajuste (%)</label>
                         <input type="number" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} placeholder="Ej: 15 o -10" className="p-2 border rounded-lg w-full mt-1"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Actualizar Precio de:</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2"><input type="radio" name="target" value="cost" checked={objetivo === 'cost'} onChange={e => setObjetivo(e.target.value)}/> Costo</label>
                            <label className="flex items-center gap-2"><input type="radio" name="target" value="sale" checked={objetivo === 'sale'} onChange={e => setObjetivo(e.target.value)}/> Venta</label>
                            <label className="flex items-center gap-2"><input type="radio" name="target" value="both" checked={objetivo === 'both'} onChange={e => setObjetivo(e.target.value)}/> Ambos</label>
                        </div>
                    </div>
                    <Button onClick={actualizarPrecios} disabled={productosSeleccionados.size === 0 || !porcentaje}>Actualizar {productosSeleccionados.size} Productos</Button>
                </div>
            </Card>

            {proveedorSeleccionado ? (
                // Si hay un proveedor seleccionado, verificamos si tiene productos
                productosFiltrados.length > 0 ? (
                    <>
                        <Table 
                            headers={[
                                <input type="checkbox" onChange={seleccionarTodos} checked={productosSeleccionados.size > 0 && productosFiltrados.length > 0 && productosSeleccionados.size === productosFiltrados.length}/>, 
                                'SKU', 'Nombre', 'Costo Actual', 'Venta Actual'
                            ]} 
                            data={datosPaginados} 
                            renderRow={(p) => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4"><input type="checkbox" checked={productosSeleccionados.has(p.id)} onChange={() => seleccionarProducto(p.id)}/></td>
                                    <td className="px-6 py-4">{p.sku}</td>
                                    <td className="px-6 py-4">{p.name}</td>
                                    <td className="px-6 py-4">${parseFloat(p.cost_price).toFixed(2)}</td>
                                    <td className="px-6 py-4">${parseFloat(p.sale_price).toFixed(2)}</td>
                                </tr>
                            )}
                        />
                        {PaginacionUI}
                    </>
                ) : (
                    // Mensaje si el proveedor no tiene productos
                    <Card className="text-center text-gray-500 py-16">
                        <p>Este proveedor no tiene productos asociados.</p>
                    </Card>
                )
            ) : (
                // Mensaje inicial si no se ha seleccionado ningún proveedor
                <Card className="text-center text-gray-500 py-16">
                    <p>Por favor, seleccione un proveedor para ver sus productos.</p>
                </Card>
            )}
        </div>
    );
};

export default ActualizacionMasivaPrecios;