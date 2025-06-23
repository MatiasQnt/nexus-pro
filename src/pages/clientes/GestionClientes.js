import React, { useState, useContext } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO ---
const FiltroBusquedaCliente = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => { setFiltros({ ...filtros, busqueda: e.target.value }); };
    return (
        <div className="mb-4">
            <input type="text" value={filtros.busqueda} onChange={handleBusquedaChange} placeholder="Buscar por Nombre, Teléfono o Email..." className="p-2 border rounded-lg w-full md:w-1/3" />
        </div>
    );
};

const logicaFiltroClientes = (clientes, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) return clientes;
    const termino = busqueda.toLowerCase();
    return clientes.filter(c => c.name.toLowerCase().includes(termino) || (c.phone_number && c.phone_number.toLowerCase().includes(termino)) || (c.email && c.email.toLowerCase().includes(termino)) );
};

// --- Formulario para Clientes ---
const FormularioCliente = ({ cliente, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState({ ...cliente, is_active: cliente.is_active !== undefined ? cliente.is_active : true });
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellido</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Ana Pérez" className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                <input id="phone_number" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} placeholder="Ej: 2284 123456" className="p-2 border rounded-lg w-full" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="Ej: ana.perez@email.com" className="p-2 border rounded-lg w-full" />
            </div>
            <div>
                <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento (opcional)</label>
                <input id="birthday" name="birthday" type="date" value={formData.birthday || ''} onChange={handleChange} className="p-2 border rounded-lg w-full" />
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

// --- COMPONENTE PRINCIPAL ---
const GestionClientes = ({ clientes, obtenerDatos }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [clienteEditando, setClienteEditando] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: clientes,
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroClientes,
        ComponenteFiltros: FiltroBusquedaCliente,
        filtrosIniciales: { busqueda: '' }
    });

    const abrirModalNuevo = () => {
        setClienteEditando({ name: '', phone_number: '', email: '', birthday: null, is_active: true });
        setModalAbierto(true);
    };

    const abrirModalEditar = (cliente) => {
        setClienteEditando(cliente);
        setModalAbierto(true);
    };

    const guardarCliente = async (datosCliente) => {
        const esEditando = !!datosCliente.id;
        const url = esEditando ? `${API_URL}/clients/${datosCliente.id}/` : `${API_URL}/clients/`;
        const method = esEditando ? 'PUT' : 'POST';
        
        const payload = { ...datosCliente };
        if (payload.email === '') payload.email = null;
        if (payload.phone_number === '') payload.phone_number = null;
        if (payload.birthday === '') payload.birthday = null;

        toast.promise(
            fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(payload) })
                .then(res => {
                    if (!res.ok) return res.json().then(err => Promise.reject(err));
                    return res;
                }),
            {
                loading: 'Guardando cliente...',
                success: () => {
                    setModalAbierto(false);
                    obtenerDatos();
                    return `Cliente ${esEditando ? 'actualizado' : 'creado'} con éxito.`;
                },
                error: (err) => `Error al guardar: ${JSON.stringify(err)}`
            }
        );
    };

    const borrarCliente = async (idCliente) => {
        const promesaDeBorrado = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${API_URL}/clients/${idCliente}/`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } });
                if (response.status === 204) {
                    resolve("Cliente eliminado con éxito.");
                } else if (response.ok) {
                    const data = await response.json();
                    resolve(data.detail);
                } else {
                    const errorData = await response.json();
                    reject(new Error(errorData.detail || "No se pudo eliminar."));
                }
            } catch (err) {
                reject(err);
            }
        });

        toast.promise(promesaDeBorrado, {
            loading: 'Eliminando...',
            success: (mensaje) => {
                obtenerDatos();
                return mensaje;
            },
            error: (err) => `Error: ${err.message}`
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Cliente</Button>
            </div>
            
            {FiltrosUI}
            
            {datosPaginados.length > 0 ? (
                <>
                    <Table
                        headers={[
                            { title: 'Nombre' },
                            { title: 'Teléfono' },
                            { title: 'Email' },
                            { title: 'Cumpleaños' },
                            { title: 'Estado' },
                            { title: 'Acciones' }
                        ]}
                        data={datosPaginados}
                        renderRow={(cliente) => (
                            <tr key={cliente.id} className={`border-b hover:bg-gray-50 ${!cliente.is_active ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}>
                                <td className="px-6 py-4">{cliente.name}</td>
                                <td className="px-6 py-4">{cliente.phone_number || '-'}</td>
                                <td className="px-6 py-4">{cliente.email || '-'}</td>
                                <td className="px-6 py-4">{cliente.birthday ? new Date(cliente.birthday + 'T00:00:00').toLocaleDateString('es-AR') : '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cliente.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {cliente.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <Button onClick={() => abrirModalEditar(cliente)} variant="secondary" size="sm" icon={Edit} />
                                    <Button onClick={() => borrarCliente(cliente.id)} variant="danger" size="sm" icon={Trash2} />
                                </td>
                            </tr>
                        )}
                    />
                    {PaginacionUI}
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">No se encontraron clientes</h3>
                    <p className="text-gray-500 mt-1">Intenta ajustar los términos de tu búsqueda o crea un nuevo cliente.</p>
                </div>
            )}
            
            <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={clienteEditando?.id ? 'Editar Cliente' : 'Nuevo Cliente'}>
                {clienteEditando && <FormularioCliente cliente={clienteEditando} onGuardar={guardarCliente} onCancelar={() => setModalAbierto(false)} />}
            </Modal>
        </div>
    );
};

export default GestionClientes;