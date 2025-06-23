import React, { useState, useContext, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO (Sin cambios) ---
const FiltroBusquedaProveedor = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => setFiltros({ ...filtros, busqueda: e.target.value });
    return (
        <div className="mb-4">
            <input type="text" value={filtros.busqueda} onChange={handleBusquedaChange} placeholder="Buscar por Nombre, Contacto o Email..." className="p-2 border rounded-lg w-full md:w-1/3" />
        </div>
    );
};
const logicaFiltroProveedores = (proveedores, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) return proveedores;
    const termino = busqueda.toLowerCase();
    return proveedores.filter(p => p.name.toLowerCase().includes(termino) || (p.contact_person && p.contact_person.toLowerCase().includes(termino)) || (p.email && p.email.toLowerCase().includes(termino)) );
};

const FormularioProveedor = ({ proveedor, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState({ ...proveedor, is_active: proveedor.is_active !== undefined ? proveedor.is_active : true });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proveedor</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Distribuidora S.A." className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                <input id="contact_person" name="contact_person" value={formData.contact_person || ''} onChange={handleChange} placeholder="Ej: Juan Pérez" className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input id="phone_number" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} placeholder="Ej: 2284123456" className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="Ej: contacto@empresa.com" className="p-2 border rounded-lg w-full" />
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

// --- Página Principal de Gestión de Proveedores ---
const GestionProveedores = ({ proveedores, obtenerDatos }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [proveedorEditando, setProveedorEditando] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: proveedores,
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroProveedores,
        ComponenteFiltros: FiltroBusquedaProveedor,
        filtrosIniciales: { busqueda: '' }
    });

    const abrirModalNuevo = () => {
        setProveedorEditando({ name: '', contact_person: '', phone_number: '', email: '', is_active: true });
        setModalAbierto(true);
    };

    const abrirModalEditar = (proveedor) => {
        setProveedorEditando(proveedor);
        setModalAbierto(true);
    };

    const guardarProveedor = async (datosProveedor) => {
        const esEditando = !!datosProveedor.id;
        const url = esEditando ? `${API_URL}/providers/${datosProveedor.id}/` : `${API_URL}/providers/`;
        const method = esEditando ? 'PUT' : 'POST';

        toast.promise(
            fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(datosProveedor) })
                .then(res => {
                    if (!res.ok) return res.json().then(err => Promise.reject(err));
                    return res;
                }),
            {
                loading: 'Guardando proveedor...',
                success: () => {
                    setModalAbierto(false);
                    obtenerDatos();
                    return `Proveedor ${esEditando ? 'actualizado' : 'creado'} con éxito.`;
                },
                error: (err) => `Error al guardar: ${JSON.stringify(err)}`
            }
        );
    };

    // --- INICIO DE CAMBIOS ---
    const borrarProveedor = (proveedor) => {
        const ejecutarBorrado = () => {
            const promesa = fetch(`${API_URL}/providers/${proveedor.id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) },
            }).then(async (res) => {
                if (res.status === 204) {
                    return { message: "Proveedor eliminado con éxito." };
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
                    obtenerDatos();
                    return data.message;
                },
                error: (err) => `Error: ${err.detail || JSON.stringify(err)}`,
            });
        };

        toast("Confirmar Eliminación", {
            description: `¿Estás seguro de que quieres eliminar al proveedor "${proveedor.name}"?`,
            action: {
                label: "Sí, eliminar",
                onClick: ejecutarBorrado,
            },
            cancel: { label: "No" },
        });
    };
    // --- FIN DE CAMBIOS ---

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Proveedor</Button>
            </div>
            
            {FiltrosUI}
            
            {datosPaginados.length > 0 ? (
                <>
                    <Table
                        headers={[
                            { title: 'Nombre' },
                            { title: 'Contacto' },
                            { title: 'Teléfono' },
                            { title: 'Email' },
                            { title: 'Estado' },
                            { title: 'Acciones' }
                        ]}
                        data={datosPaginados}
                        renderRow={(proveedor) => (
                            <tr key={proveedor.id} className={`border-b hover:bg-gray-50 ${!proveedor.is_active ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}>
                                <td className="px-6 py-4">{proveedor.name}</td>
                                <td className="px-6 py-4">{proveedor.contact_person || '-'}</td>
                                <td className="px-6 py-4">{proveedor.phone_number || '-'}</td>
                                <td className="px-6 py-4">{proveedor.email || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proveedor.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {proveedor.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <Button onClick={() => abrirModalEditar(proveedor)} variant="secondary" size="sm" icon={Edit} />
                                    {/* --- INICIO DE CAMBIOS --- */}
                                    <Button onClick={() => borrarProveedor(proveedor)} variant="danger" size="sm" icon={Trash2} />
                                    {/* --- FIN DE CAMBIOS --- */}
                                </td>
                            </tr>
                        )}
                    />
                    {PaginacionUI}
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">No se encontraron proveedores</h3>
                    <p className="text-gray-500 mt-1">Intenta ajustar los términos de tu búsqueda o crea un nuevo proveedor.</p>
                </div>
            )}
            
            <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={proveedorEditando?.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
                {proveedorEditando && <FormularioProveedor proveedor={proveedorEditando} onGuardar={guardarProveedor} onCancelar={() => setModalAbierto(false)} />}
            </Modal>
        </div>
    );
};

export default GestionProveedores;