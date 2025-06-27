import React, { useState, useEffect, useContext } from 'react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Card, Table } from '../../components/ui/ComponentesUI';
import { useServerSidePagination } from '../../hooks/useServerSidePagination';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

// --- Componente de Filtros ---
// Creamos un componente específico para los filtros de esta página.
const FiltrosActualizacion = ({ setFiltros, filtros, proveedores }) => {
    const handleProviderChange = (e) => {
        // Al cambiar el proveedor, reseteamos la búsqueda y otros filtros si los hubiera.
        setFiltros({ provider: e.target.value });
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">Filtrar por Proveedor</label>
            <select 
                value={filtros.provider || ''} 
                onChange={handleProviderChange} 
                className="p-2 border rounded-lg w-full mt-1"
            >
                <option value="">Seleccionar Proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
    );
};


const ActualizacionMasivaPrecios = () => {
    const { tokensAuth } = useContext(ContextoAuth);
    
    // Estados para la lógica de la página
    const [productosSeleccionados, setProductosSeleccionados] = useState(new Set());
    const [porcentaje, setPorcentaje] = useState('');
    const [objetivo, setObjetivo] = useState('both');
    const [proveedores, setProveedores] = useState([]);
    const { 
        datosPaginados, 
        loading, 
        error, 
        FiltrosUI, 
        PaginacionUI,
        refetch,
        setFiltros,
        filtros
    } = useServerSidePagination({
        endpoint: 'products',
        tokensAuth: tokensAuth,
        ComponenteFiltros: (props) => <FiltrosActualizacion {...props} proveedores={proveedores} />,
        initialFilters: { provider: '' }
    });

    useEffect(() => {
        const fetchProviders = async () => {
            if (!tokensAuth) return;
            try {
                // Hacemos la petición para obtener TODOS los proveedores, no solo una página.
                const response = await fetch(`${API_URL}/providers/?page_size=1000`, { 
                    headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } 
                });
                const data = await response.json();
                setProveedores(data.results || data);
            } catch (error) {
                console.error("Error al cargar proveedores:", error);
                toast.error("No se pudieron cargar los proveedores.");
            }
        };
        fetchProviders();
    }, [tokensAuth]);

    // Lógica para seleccionar/deseleccionar productos en la página actual
    const seleccionarTodosPagina = () => {
        const idsPaginaActual = new Set(datosPaginados.map(p => p.id));
        const seleccionadosEnPagina = new Set([...productosSeleccionados].filter(id => idsPaginaActual.has(id)));

        if (seleccionadosEnPagina.size === datosPaginados.length) {
            // Si todos en la página están seleccionados, los deseleccionamos
            const nuevaSeleccion = new Set(productosSeleccionados);
            idsPaginaActual.forEach(id => nuevaSeleccion.delete(id));
            setProductosSeleccionados(nuevaSeleccion);
        } else {
            // Si no, seleccionamos todos los de la página actual
            setProductosSeleccionados(new Set([...productosSeleccionados, ...idsPaginaActual]));
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

    // La lógica de la actualización de precios permanece casi igual
    const actualizarPrecios = async () => {
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
                    refetch();
                    setProductosSeleccionados(new Set());
                    setPorcentaje('');
                    return data.message || 'Precios actualizados con éxito.';
                },
                error: (err) => `Error al actualizar: ${JSON.stringify(err)}`
            });
        };

        toast("Confirmar Actualización", {
            description: `¿Estás seguro de que quieres actualizar ${productosSeleccionados.size} productos con un ${porcentaje}% de ajuste? Esta acción no se puede deshacer.`,
            action: { label: "Sí, actualizar", onClick: ejecutarActualizacion },
            cancel: { label: "Cancelar" },
            duration: 10000,
        });
    };

    const proveedorSeleccionado = filtros.provider;
    const isCheckedSelectAll = datosPaginados.length > 0 && datosPaginados.every(p => productosSeleccionados.has(p.id));

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Actualización Masiva de Precios</h1>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {FiltrosUI}
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

            {loading && <Card className="text-center text-gray-500 py-16"><p>Cargando productos...</p></Card>}
            {error && <Card className="text-center text-red-500 py-16"><p>Error: {error}</p></Card>}
            
            {!loading && !error && (
                !proveedorSeleccionado ? (
                    <Card className="text-center text-gray-500 py-16">
                        <p>Por favor, seleccione un proveedor para ver sus productos.</p>
                    </Card>
                ) : datosPaginados.length > 0 ? (
                    <>
                        <Table 
                            headers={[
                                { title: <input type="checkbox" onChange={seleccionarTodosPagina} checked={isCheckedSelectAll}/>, width: 'w-12' },
                                { title: 'SKU' }, { title: 'Nombre' }, { title: 'Costo Actual' }, { title: 'Venta Actual' }
                            ]} 
                            data={datosPaginados} 
                            renderRow={(p) => (
                                <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4"><input type="checkbox" checked={productosSeleccionados.has(p.id)} onChange={() => seleccionarProducto(p.id)}/></td>
                                    <td className="px-6 py-4">{p.sku || 'N/A'}</td>
                                    <td className="px-6 py-4 font-medium">{p.name}</td>
                                    <td className="px-6 py-4">${parseFloat(p.cost_price).toFixed(2)}</td>
                                    <td className="px-6 py-4">${parseFloat(p.sale_price).toFixed(2)}</td>
                                </tr>
                            )}
                        />
                        {PaginacionUI}
                    </>
                ) : (
                    <Card className="text-center text-gray-500 py-16">
                        <p>Este proveedor no tiene productos asociados.</p>
                    </Card>
                )
            )}
        </div>
    );
};

export default ActualizacionMasivaPrecios;
