import React, { useState, useContext } from 'react';
import { PlusCircle, Edit, Trash2, PackagePlus } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES INTERNOS ---

// Formulario completo para crear/editar (solo para Admin y SuperAdmin)
const FormularioProducto = ({ producto, onGuardar, onCancelar, categorias, proveedores }) => {
    const [formData, setFormData] = useState({ ...producto, category: producto.category || '', provider: producto.provider || null });
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            {/* ... (el resto del formulario no cambia) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Coca-Cola 1.5L" className="p-2 border rounded-lg w-full" required/>
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU / Código de Barras</label>
                    <input id="sku" name="sku" value={formData.sku} onChange={handleChange} placeholder="Ej: 7790895000991" className="p-2 border rounded-lg w-full" required/>
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} placeholder="Cualquier detalle adicional..." className="p-2 border rounded-lg w-full min-h-[80px]"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-1">Precio de Costo</label>
                    <input id="cost_price" name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} placeholder="0.00" className="p-2 border rounded-lg w-full" required/>
                </div>
                <div>
                    <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                    <input id="sale_price" name="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={handleChange} placeholder="0.00" className="p-2 border rounded-lg w-full" required/>
                </div>
                <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                    <input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="0" className="p-2 border rounded-lg w-full" required/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} className="p-2 border rounded-lg w-full" required>
                        <option value="">Seleccionar Categoría</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">Proveedor (opcional)</label>
                    <select id="provider" name="provider" value={formData.provider || ''} onChange={handleChange} className="p-2 border rounded-lg w-full">
                        <option value="">Seleccionar Proveedor</option>
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                 <Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button>
                 <Button type="submit" variant="primary">Guardar</Button>
             </div>
       </form>
    );
};

// **NUEVO** Formulario simple solo para añadir stock
const FormularioStock = ({ onGuardar, onCancelar }) => {
    const [stockToAdd, setStockToAdd] = useState(1);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ stock: stockToAdd });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Añadir</label>
                <input 
                    id="stock" 
                    name="stock" 
                    type="number" 
                    value={stockToAdd} 
                    onChange={(e) => setStockToAdd(e.target.value)} 
                    placeholder="0" 
                    className="p-2 border rounded-lg w-full" 
                    required 
                    min="1"
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Añadir Stock</Button>
            </div>
        </form>
    );
};


const FiltroBusquedaProducto = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => setFiltros({ ...filtros, busqueda: e.target.value });

    return (
        <div className="mb-4">
            <input
                type="text"
                value={filtros.busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por Nombre, SKU o Categoría..."
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
        </div>
    );
};

const logicaFiltroProductos = (productos, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) return productos;
    const terminoBusquedaLower = busqueda.toLowerCase();
    return productos.filter(p => 
        p.name.toLowerCase().includes(terminoBusquedaLower) ||
        p.sku.toLowerCase().includes(terminoBusquedaLower) ||
        (p.category_name && p.category_name.toLowerCase().includes(terminoBusquedaLower))
    );
};


// --- COMPONENTE PRINCIPAL ---

const GestionProductos = ({ productos, proveedores, categorias, obtenerDatos, roles }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [stockModalAbierto, setStockModalAbierto] = useState(false); // Estado para el nuevo modal
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    
    const { tokensAuth } = useContext(ContextoAuth);

    // Derivamos los permisos desde la prop 'roles'
    const puedeGestionar = roles?.esAdmin || roles?.esSuperAdmin;

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: productos,
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroProductos,
        ComponenteFiltros: FiltroBusquedaProducto,
        filtrosIniciales: { busqueda: '' }
    });

    const abrirModalNuevo = () => { 
        setProductoSeleccionado({ name: '', sku: '', description: '', cost_price: '', sale_price: '', stock: '', category: '', provider: null }); 
        setModalAbierto(true); 
    };
    
    const abrirModalEditar = (producto) => { 
        setProductoSeleccionado({ ...producto, provider: producto.provider || null }); 
        setModalAbierto(true); 
    };

    const abrirModalStock = (producto) => {
        setProductoSeleccionado(producto);
        setStockModalAbierto(true);
    };

    const guardarProducto = async (datosProducto) => {
        const esEditando = !!datosProducto.id;
        const url = esEditando ? `${API_URL}/products/${datosProducto.id}/` : `${API_URL}/products/`;
        const method = esEditando ? 'PUT' : 'POST';
        
        const payload = { ...datosProducto };
        delete payload.provider_name;
        delete payload.category_name;
        if (payload.provider === '') payload.provider = null;
        
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(payload) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(JSON.stringify(errorData)); }
            alert(`Producto ${esEditando ? 'actualizado' : 'creado'}.`); 
            setModalAbierto(false); 
            obtenerDatos();
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const guardarStock = async (datosStock) => {
        if (!productoSeleccionado) return;
        const url = `${API_URL}/products/${productoSeleccionado.id}/update-stock/`;
        try {
            const response = await fetch(url, { 
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, 
                body: JSON.stringify({ stock: datosStock.stock }) 
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(JSON.stringify(errorData)); }
            alert(`Stock añadido.`);
            setStockModalAbierto(false);
            obtenerDatos();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const borrarProducto = async (idProducto) => {
        // Considera usar un modal de confirmación en lugar de window.confirm
        if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
            try {
                await fetch(`${API_URL}/products/${idProducto}/`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }});
                alert('Producto eliminado.'); 
                obtenerDatos();
            } catch (err) { alert(`Error: ${err.message}`); }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
                {/* El botón de "Nuevo Producto" solo es visible para Admin/SuperAdmin */}
                {puedeGestionar && (
                    <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Producto</Button>
                )}
            </div>
            
            {FiltrosUI}

            <Table 
                headers={['SKU', 'Nombre', 'Precio Costo', 'Precio Venta', 'Stock', 'Categoría', 'Acciones']} 
                data={datosPaginados} 
                renderRow={(p) => (
                    <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{p.sku}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                        <td className="px-6 py-4">${parseFloat(p.cost_price).toFixed(2)}</td>
                        <td className="px-6 py-4">${parseFloat(p.sale_price).toFixed(2)}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {p.stock}
                            </span>
                        </td>
                        <td className="px-6 py-4">{p.category_name}</td>
                        <td className="px-6 py-4 flex gap-2">
                            {/* Botón para añadir stock, visible para todos */}
                            <Button onClick={() => abrirModalStock(p)} variant="outline" size="sm" icon={PackagePlus}>Stock</Button>
                            
                            {/* Botones de gestión, solo para Admin/SuperAdmin */}
                            {puedeGestionar && (
                                <>
                                    <Button onClick={() => abrirModalEditar(p)} variant="secondary" size="sm" icon={Edit} />
                                    <Button onClick={() => borrarProducto(p.id)} variant="danger" size="sm" icon={Trash2} />
                                </>
                            )}
                        </td>
                    </tr>
                )}
            />

            {PaginacionUI}

            {/* Modal para Crear/Editar Producto */}
            {puedeGestionar && (
                <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={productoSeleccionado?.id ? 'Editar Producto' : 'Nuevo Producto'}>
                    {productoSeleccionado && <FormularioProducto producto={productoSeleccionado} onGuardar={guardarProducto} onCancelar={() => setModalAbierto(false)} categorias={categorias} proveedores={proveedores}/>}
                </Modal>
            )}

            {/* Modal para Añadir Stock */}
            <Modal isOpen={stockModalAbierto} onClose={() => setStockModalAbierto(false)} title={`Añadir Stock a: ${productoSeleccionado?.name}`}>
                {productoSeleccionado && <FormularioStock onGuardar={guardarStock} onCancelar={() => setStockModalAbierto(false)} />}
            </Modal>

        </div>
    );
};

export default GestionProductos;
