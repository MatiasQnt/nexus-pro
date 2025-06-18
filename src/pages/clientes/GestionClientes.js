import React, { useState, useContext } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO ---

const FiltroBusquedaCliente = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => {
        setFiltros({ ...filtros, busqueda: e.target.value });
    };

    return (
        <div className="mb-4">
            <input
                type="text"
                value={filtros.busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por Nombre, Teléfono o Email..."
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
        </div>
    );
};

const logicaFiltroClientes = (clientes, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) {
        return clientes;
    }
    const termino = busqueda.toLowerCase();
    return clientes.filter(c =>
        c.name.toLowerCase().includes(termino) ||
        (c.phone_number && c.phone_number.toLowerCase().includes(termino)) ||
        (c.email && c.email.toLowerCase().includes(termino))
    );
};


// --- Formulario para Clientes (con Labels) ---
const FormularioCliente = ({ cliente, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState(cliente);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        setClienteEditando({ name: '', phone_number: '', email: '', birthday: null });
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
        
        if (datosCliente.email === '') datosCliente.email = null;
        if (datosCliente.phone_number === '') datosCliente.phone_number = null;
        if (datosCliente.birthday === '') datosCliente.birthday = null;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
                body: JSON.stringify(datosCliente)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }
            alert(`Cliente ${esEditando ? 'actualizado' : 'creado'} con éxito.`);
            setModalAbierto(false);
            obtenerDatos();
        } catch (err) {
            alert(`Error al guardar el cliente: ${err.message}`);
        }
    };

    const borrarCliente = async (idCliente) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
            try {
                await fetch(`${API_URL}/clients/${idCliente}/`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }
                });
                alert('Cliente eliminado con éxito.');
                obtenerDatos();
            } catch (err) {
                alert(`Error al eliminar: ${err.message}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Cliente</Button>
            </div>
            
            {FiltrosUI}
            
            <Table
                headers={['Nombre', 'Teléfono', 'Email', 'Cumpleaños', 'Acciones']}
                data={datosPaginados}
                renderRow={(cliente) => (
                    <tr key={cliente.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{cliente.name}</td>
                        <td className="px-6 py-4">{cliente.phone_number || '-'}</td>
                        <td className="px-6 py-4">{cliente.email || '-'}</td>
                        <td className="px-6 py-4">{cliente.birthday ? new Date(cliente.birthday + 'T00:00:00').toLocaleDateString('es-AR') : '-'}</td>
                        <td className="px-6 py-4 flex gap-2">
                            <Button onClick={() => abrirModalEditar(cliente)} variant="secondary" icon={Edit} />
                            <Button onClick={() => borrarCliente(cliente.id)} variant="danger" icon={Trash2} />
                        </td>
                    </tr>
                )}
            />
            
            {PaginacionUI}
            
            <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={clienteEditando?.id ? 'Editar Cliente' : 'Nuevo Cliente'}>
                {clienteEditando && <FormularioCliente cliente={clienteEditando} onGuardar={guardarCliente} onCancelar={() => setModalAbierto(false)} />}
            </Modal>
        </div>
    );
};

export default GestionClientes;
