import React, { useState, useContext } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useServerSidePagination } from '../../hooks/useServerSidePagination';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

const FiltroBusquedaMetodoPago = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => { 
        setFiltros({ ...filtros, search: e.target.value }); 
    };
    return ( 
        <div className="mb-4">
            <input 
                type="text" 
                value={filtros.search || ''} 
                onChange={handleBusquedaChange} 
                placeholder="Buscar por nombre..." 
                className="p-2 border rounded-lg w-full md:w-1/3" 
            />
        </div>
    );
};

const FormularioMetodoPago = ({ metodo, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState(metodo);
    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target; 
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); 
    };
    const handleFocus = (event) => event.target.select();
    
    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Método</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Efectivo, Tarjeta Naranja" className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="adjustment_percentage" className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de Ajuste</label>
                <input id="adjustment_percentage" name="adjustment_percentage" type="number" step="0.01" value={formData.adjustment_percentage} onChange={handleChange} placeholder="Ej: -10 o 8.5" className="p-2 border rounded-lg w-full" onFocus={handleFocus} required />
                <p className="text-xs text-gray-500 mt-1">Usa números negativos para descuentos y positivos para recargos.</p>
            </div>
            <div className="pt-2">
                <label className="flex items-center gap-2">
                    <input id="is_active" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">Activo</span>
                </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Guardar</Button>
            </div>
        </form>
    );
};

const GestionMetodosDePago = () => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [metodoEditando, setMetodoEditando] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);

    const { 
        datosPaginados, 
        loading, 
        error, 
        FiltrosUI, 
        PaginacionUI,
        refetch
    } = useServerSidePagination({
        endpoint: 'admin/payment-methods',
        tokensAuth: tokensAuth,
        ComponenteFiltros: FiltroBusquedaMetodoPago,
        initialFilters: { search: '' }
    });

    const abrirModalNuevo = () => { 
        setMetodoEditando({ name: '', adjustment_percentage: '0.00', is_active: true }); 
        setModalAbierto(true); 
    };
    const abrirModalEditar = (metodo) => { 
        setMetodoEditando(metodo); 
        setModalAbierto(true); 
    };

    const guardarMetodo = async (datosMetodo) => {
        const esEditando = !!datosMetodo.id;
        const url = esEditando ? `${API_URL}/admin/payment-methods/${datosMetodo.id}/` : `${API_URL}/admin/payment-methods/`;
        const method = esEditando ? 'PUT' : 'POST';
        const payload = { ...datosMetodo, adjustment_percentage: datosMetodo.adjustment_percentage === '' ? '0.00' : datosMetodo.adjustment_percentage };

        const promesaDeGuardado = fetch(url, { 
            method, 
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, 
            body: JSON.stringify(payload) 
        }).then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res;
        });

        toast.promise(promesaDeGuardado, {
            loading: 'Guardando método de pago...',
            success: () => {
                setModalAbierto(false);
                refetch();
                return `Método de pago ${esEditando ? 'actualizado' : 'creado'} con éxito.`;
            },
            error: (err) => `Error: ${JSON.stringify(err)}`
        });
    };
    
    const borrarMetodo = (metodo) => {
        const ejecutarBorrado = () => {
            const promesa = fetch(`${API_URL}/admin/payment-methods/${metodo.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) },
            }).then(async (res) => {
                if (res.status === 204) {
                    return { message: "Método de pago eliminado con éxito." };
                }
                if (res.ok) {
                    const data = await res.json();
                    return { message: data.detail || "La operación se completó." };
                }
                const errorData = await res.json();
                return Promise.reject(errorData);
            });

            toast.promise(promesa, {
                loading: 'Procesando...',
                success: (data) => {
                    refetch();
                    return data.message;
                },
                error: (err) => `Error: ${err.detail || JSON.stringify(err)}`,
            });
        };

        toast("Confirmar Eliminación", {
            description: `¿Estás seguro de que quieres eliminar el método de pago "${metodo.name}"?`,
            action: { label: "Sí, eliminar", onClick: ejecutarBorrado },
            cancel: { label: "No" },
        });
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Métodos de Pago</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Método</Button>
            </div>

            {FiltrosUI}

            {loading && <p>Cargando métodos de pago...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}

            {!loading && !error && (
                datosPaginados.length > 0 ? (
                    <>
                        <Table
                            headers={[
                                { title: 'Nombre' },
                                { title: 'Ajuste (%)' },
                                { title: 'Estado' },
                                { title: 'Acciones' }
                            ]}
                            data={datosPaginados}
                            renderRow={(pm) => (
                                <tr key={pm.id} className={`border-b hover:bg-gray-50 ${!pm.is_active ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}>
                                    <td className="px-6 py-4 font-medium">{pm.name}</td>
                                    <td className={`px-6 py-4 font-semibold ${pm.adjustment_percentage < 0 ? 'text-green-600' : pm.adjustment_percentage > 0 ? 'text-red-600' : ''}`}>
                                        {pm.adjustment_percentage}%
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pm.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {pm.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <Button onClick={() => abrirModalEditar(pm)} variant="secondary" className="p-2 h-9 w-9"><Edit size={16} /></Button>
                                        <Button onClick={() => borrarMetodo(pm)} variant="danger" className="p-2 h-9 w-9"><Trash2 size={16} /></Button>
                                    </td>
                                </tr>
                            )}
                        />
                        {PaginacionUI}
                    </>
                ) : (
                    <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">No se encontraron métodos de pago</h3>
                        <p className="text-gray-500 mt-1">Intenta ajustar los términos de tu búsqueda o crea uno nuevo.</p>
                    </div>
                )
            )}

            <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={metodoEditando?.id ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}>
                {metodoEditando && <FormularioMetodoPago metodo={metodoEditando} onGuardar={guardarMetodo} onCancelar={() => setModalAbierto(false)} />}
            </Modal>
        </div>
    );
};

export default GestionMetodosDePago;
