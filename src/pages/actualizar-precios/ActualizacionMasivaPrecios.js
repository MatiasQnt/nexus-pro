import React, { useState, useContext, useMemo } from 'react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Card, Table } from '../../components/ui/ComponentesUI';
// 1. Importamos el hook que maneja la lógica de paginación
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

const ActualizacionMasivaPrecios = ({ productos, proveedores, obtenerDatos }) => {
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
    const [productosSeleccionados, setProductosSeleccionados] = useState(new Set());
    const [porcentaje, setPorcentaje] = useState('');
    const [objetivo, setObjetivo] = useState('both');
    const { tokensAuth } = useContext(ContextoAuth);

    // Filtramos los productos según el proveedor seleccionado. Esta lista es la que paginaremos.
    const productosFiltrados = useMemo(() => {
        if (!proveedorSeleccionado) return [];
        return productos.filter(p => p.provider === parseInt(proveedorSeleccionado));
    }, [productos, proveedorSeleccionado]);


    // 2. Usamos el hook para paginar la lista de productos YA filtrada
    const { datosPaginados, PaginacionUI } = useFiltrosYBusqueda({
        items: productosFiltrados,
        itemsPorPagina: 10,
        // No necesitamos lógica de filtro adicional, así que simplemente devolvemos los items
        logicaDeFiltro: (items) => items, 
        // No necesitamos un componente de filtro, así que pasamos uno que no renderiza nada
        ComponenteFiltros: () => null, 
        filtrosIniciales: {}
    });


    const seleccionarTodos = () => {
        // La lógica de "seleccionar todo" debe operar sobre la lista completa de productos filtrados, no solo la página actual
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
        if(productosSeleccionados.size === 0 || !porcentaje || !objetivo) {
            alert("Por favor, selecciona productos, un porcentaje y un objetivo de actualización.");
            return;
        }

        const payload = {
            product_ids: Array.from(productosSeleccionados),
            percentage: porcentaje,
            update_target: objetivo
        };

        if(window.confirm(`¿Seguro que quieres actualizar ${productosSeleccionados.size} productos con un ${porcentaje}% de aumento?`)) {
            try {
                const response = await fetch(`${API_URL}/bulk-price-update/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(JSON.stringify(errorData));
                }
                alert('Precios actualizados con éxito.');
                obtenerDatos();
                setProductosSeleccionados(new Set());
                setPorcentaje('');
            } catch (err) {
                alert(`Error al actualizar precios: ${err.message}`);
            }
        }
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
                         <label className="block text-sm font-medium text-gray-700">Porcentaje de Aumento (%)</label>
                         <input type="number" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} placeholder="Ej: 15" className="p-2 border rounded-lg w-full mt-1"/>
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
                <>
                    <Table 
                        headers={[
                            <input type="checkbox" onChange={seleccionarTodos} checked={productosSeleccionados.size > 0 && productosFiltrados.length > 0 && productosSeleccionados.size === productosFiltrados.length}/>, 
                            'SKU', 'Nombre', 'Costo Actual', 'Venta Actual'
                        ]} 
                        // 3. Pasamos los datos paginados a la tabla
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
                    {/* 4. Renderizamos la UI de paginación */}
                    {PaginacionUI}
                </>
            ) : (
                <Card className="text-center text-gray-500">
                    <p>Por favor, seleccione un proveedor para ver sus productos.</p>
                </Card>
            )}
        </div>
    );
};

export default ActualizacionMasivaPrecios;
