import React, { useState, useContext } from 'react';
import { PlusCircle, Edit, Trash2, PackagePlus } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

// --- Componente de Formulario de Producto ---
// Se ha modificado el campo SKU y Categoría para que sean opcionales.
const FormularioProducto = ({ producto, onGuardar, onCancelar, categorias, proveedores }) => {
    const [formData, setFormData] = useState({ ...producto, category: producto.category || '', provider: producto.provider || null, estado: producto.estado || 'activo' });
    const handleChange = (e) => { const { name, value, checked } = e.target; setFormData(prev => ({ ...prev, [name]: name === 'estado' ? (checked ? 'activo' : 'inactivo') : value })); };
    
    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input id="name" name="name" value={formData.name} onChange={handleChange} className="p-2 border rounded-lg w-full" required/></div>
                <div><label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU (Opcional)</label><input id="sku" name="sku" value={formData.sku || ''} onChange={handleChange} className="p-2 border rounded-lg w-full" /></div>
            </div>
            <div><label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} className="p-2 border rounded-lg w-full min-h-[80px]"/></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-1">Costo</label><input id="cost_price" name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} className="p-2 border rounded-lg w-full" required/></div>
                <div><label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-1">Venta</label><input id="sale_price" name="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={handleChange} className="p-2 border rounded-lg w-full" required/></div>
                <div><label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label><input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} className="p-2 border rounded-lg w-full" required/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* El campo Categoría ya no tiene 'required'. */}
                <div><label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría (Opcional)</label><select id="category" name="category" value={formData.category || ''} onChange={handleChange} className="p-2 border rounded-lg w-full"><option value="">Seleccionar</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">Proveedor (Opcional)</label><select id="provider" name="provider" value={formData.provider || ''} onChange={handleChange} className="p-2 border rounded-lg w-full"><option value="">Seleccionar</option>{proveedores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>
            <div className="flex items-center gap-2 mt-4"><input id="estado" name="estado" type="checkbox" checked={formData.estado === 'activo'} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><label htmlFor="estado" className="text-sm font-medium text-gray-700">Activo para la venta</label></div>
            <div className="flex justify-end gap-3 pt-4"><Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button><Button type="submit" variant="primary">Guardar</Button></div>
        </form>
    );
};

// --- Componente de Formulario para añadir Stock (sin cambios) ---
const FormularioStock = ({ onGuardar, onCancelar }) => {
    const [stockToAdd, setStockToAdd] = useState(1);
    const handleSubmit = (e) => { e.preventDefault(); onGuardar({ stock: stockToAdd }); };
    return (<form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Añadir</label><input id="stock" name="stock" type="number" value={stockToAdd} onChange={(e) => setStockToAdd(e.target.value)} placeholder="0" className="p-2 border rounded-lg w-full" required min="1"/></div><div className="flex justify-end gap-3 pt-4"><Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button><Button type="submit" variant="primary">Añadir Stock</Button></div></form>);
};

// --- Componente para la barra de búsqueda (sin cambios) ---
const FiltroBusquedaProducto = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => setFiltros({ ...filtros, busqueda: e.target.value });
    return (<div className="w-full"><input type="text" value={filtros.busqueda} onChange={handleBusquedaChange} placeholder="Buscar por Nombre, SKU o Categoría..." className="p-2 border rounded-lg w-full md:w-1/2 lg:w-1/3"/></div>);
};

// --- Lógica de Filtro para productos ---
// Modificada para evitar errores si un producto no tiene SKU o Categoría.
const logicaFiltroProductos = (productos, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) return productos;
    const terminoBusquedaLower = busqueda.toLowerCase();
    
    return productos.filter(p => 
        p.name.toLowerCase().includes(terminoBusquedaLower) ||
        (p.sku && p.sku.toLowerCase().includes(terminoBusquedaLower)) ||
        (p.category_name && p.category_name.toLowerCase().includes(terminoBusquedaLower))
    );
};

// --- Componente Principal de Gestión de Productos ---
const GestionProductos = ({ productos, proveedores, categorias, obtenerDatos, roles }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [stockModalAbierto, setStockModalAbierto] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);
    const puedeGestionar = roles?.esAdmin || roles?.esSuperAdmin;

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: productos,
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroProductos,
        ComponenteFiltros: FiltroBusquedaProducto,
        filtrosIniciales: { busqueda: '' }
    });

    const abrirModalNuevo = () => { setProductoSeleccionado({ name: '', sku: '', description: '', cost_price: '', sale_price: '', stock: 1, category: null, provider: null, estado: 'activo' }); setModalAbierto(true); };
    const abrirModalEditar = (producto) => { setProductoSeleccionado({ ...producto, provider: producto.provider || null, category: producto.category || null }); setModalAbierto(true); };
    const abrirModalStock = (producto) => { setProductoSeleccionado(producto); setStockModalAbierto(true); };
    
    // Función para guardar (Crear/Editar) un producto
    const guardarProducto = async (datosProducto) => {
        const esEditando = !!datosProducto.id;
        const url = esEditando ? `${API_URL}/products/${datosProducto.id}/` : `${API_URL}/products/`;
        const method = esEditando ? 'PUT' : 'POST';
        
        const payload = { ...datosProducto };
        delete payload.provider_name;
        delete payload.category_name;
        
        if (payload.provider === '') payload.provider = null;
        if (payload.sku === '') payload.sku = null;
        // Si la categoría está vacía, se envía como null para que lo acepte la API/BD.
        if (payload.category === '') payload.category = null;

        const promesaDeGuardado = fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(payload) }).then(res => { if (!res.ok) return res.json().then(err => Promise.reject(err)); return res.json(); });
        toast.promise(promesaDeGuardado, { loading: 'Guardando producto...', success: () => { setModalAbierto(false); obtenerDatos(); return `Producto ${esEditando ? 'actualizado' : 'creado'} con éxito.`; }, error: (err) => `Error al guardar: ${JSON.stringify(err)}` });
    };

    // Función para guardar el stock de un producto
    const guardarStock = async (datosStock) => { if (!productoSeleccionado) return; const url = `${API_URL}/products/${productoSeleccionado.id}/update-stock/`; const promesaDeStock = fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify({ stock: datosStock.stock }) }).then(res => { if (!res.ok) return res.json().then(err => Promise.reject(err)); return res.json(); }); toast.promise(promesaDeStock, { loading: 'Añadiendo stock...', success: () => { setStockModalAbierto(false); obtenerDatos(); return 'Stock añadido con éxito.'; }, error: (err) => `Error: ${JSON.stringify(err)}` }); };
    
    // Función para borrar un producto
    const borrarProducto = (producto) => {
        const ejecutarBorrado = () => {
            const promesa = fetch(`${API_URL}/products/${producto.id}/`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) },
            }).then(async (res) => {
                if (res.status === 204) { return { message: "Producto eliminado con éxito." }; }
                if (res.ok) { const data = await res.json(); return { message: data.detail || "La operación se completó." }; }
                const errorData = await res.json(); return Promise.reject(errorData);
            });
            toast.promise(promesa, { loading: 'Procesando...', success: (data) => { obtenerDatos(); return data.message; }, error: (err) => `Error: ${err.detail || JSON.stringify(err)}`, });
        };
        toast("Confirmar Eliminación", { description: `¿Estás seguro de que quieres eliminar el producto "${producto.name}"?`, action: { label: "Sí, eliminar", onClick: ejecutarBorrado, }, cancel: { label: "No" }, });
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>{puedeGestionar && (<Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Producto</Button>)}</div>
            <div className="flex justify-between items-center">{FiltrosUI}</div>
            {datosPaginados.length > 0 ? (
                <div>
                    {/* Vista de Tabla para Escritorio */}
                    <div className="hidden md:block">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="min-w-[1200px]">
                                <Table 
                                    headers={[ { title: 'SKU', width: 'w-36' }, { title: 'Nombre', width: 'w-1/3' }, { title: 'P. Costo', width: 'w-32' }, { title: 'P. Venta', width: 'w-32' }, { title: 'Stock', width: 'w-24' }, { title: 'Categoría', width: 'w-48' }, { title: 'Proveedor', width: 'w-48' }, { title: 'Estado', width: 'w-28' }, { title: 'Acciones', width: 'w-32' }]} 
                                    data={datosPaginados} 
                                    renderRow={(p) => (
                                        <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.estado === 'inactivo' ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}>
                                            <td className="px-4 py-3 whitespace-nowrap">{p.sku || 'N/A'}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900 truncate" title={p.name}>{p.name}</td>
                                            <td className="px-4 py-3 text-orange-600 font-semibold whitespace-nowrap">${parseFloat(p.cost_price).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-green-600 font-bold whitespace-nowrap">${parseFloat(p.sale_price).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{p.stock}</span></td>
                                            <td className="px-4 py-3 truncate" title={p.category_name}>{p.category_name || 'N/A'}</td>
                                            <td className="px-4 py-3 truncate" title={p.provider_name}>{p.provider_name || 'N/A'}</td>
                                            <td className="px-4 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                                            <td className="px-4 py-3">
                                                <div className='flex gap-2'>
                                                    <Button onClick={() => abrirModalStock(p)} variant="secondary" icon={PackagePlus} title="Añadir Stock" />
                                                    {puedeGestionar && (
                                                        <>
                                                            <Button onClick={() => abrirModalEditar(p)} variant="secondary" icon={Edit} title="Editar Producto"/>
                                                            <Button onClick={() => borrarProducto(p)} variant="danger" icon={Trash2} title="Borrar Producto"/>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Vista de Tarjetas para Móviles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:hidden">
                        {datosPaginados.map(p => (
                            <div key={p.id} className={`bg-white rounded-lg shadow-md p-4 flex flex-col ${p.estado === 'inactivo' ? 'opacity-60' : ''}`}>
                                <div className="flex-grow mb-4">
                                    <div className="flex justify-between items-start"><h3 className="font-bold text-base text-gray-800 pr-2">{p.name}</h3><span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${p.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>Stock: {p.stock}</span></div>
                                    <p className="text-sm text-gray-500">{p.category_name || 'Sin Categoría'}</p>
                                    <p className="text-sm text-gray-400 mt-1">SKU: {p.sku || 'N/A'}</p>
                                    <p className="text-xl font-bold text-green-600 mt-2 text-right">${parseFloat(p.sale_price).toFixed(2)}</p>
                                </div>
                               <div className="pt-3 border-t flex gap-2">
                                    <Button onClick={() => abrirModalStock(p)} variant="secondary" className="flex-1">Stock</Button>
                                    {puedeGestionar && (
                                        <>
                                            <Button onClick={() => abrirModalEditar(p)} variant="secondary" icon={Edit} />
                                            <Button onClick={() => borrarProducto(p)} variant="danger" icon={Trash2} />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6">{PaginacionUI}</div>
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md"><h3 className="text-lg font-semibold text-gray-700">No se encontraron productos</h3><p className="text-gray-500 mt-1">Intenta ajustar los términos de tu búsqueda o crea un producto nuevo.</p></div>
            )}
            
            {/* Modales para crear/editar productos y añadir stock */}
            {puedeGestionar && (<Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={productoSeleccionado?.id ? 'Editar Producto' : 'Nuevo Producto'}>{productoSeleccionado && <FormularioProducto producto={productoSeleccionado} onGuardar={guardarProducto} onCancelar={() => setModalAbierto(false)} categorias={categorias} proveedores={proveedores}/>}</Modal>)}
            <Modal isOpen={stockModalAbierto} onClose={() => setStockModalAbierto(false)} title={`Añadir Stock a: ${productoSeleccionado?.name}`}>{productoSeleccionado && <FormularioStock onGuardar={guardarStock} onCancelar={() => setStockModalAbierto(false)} />}</Modal>
        </div>
    );
};

export default GestionProductos;
