import React, { useState, useContext } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO ---

const FiltroBusquedaProveedor = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => {
        setFiltros({ ...filtros, busqueda: e.target.value });
    };

    return (
        <div className="mb-4">
            <input
                type="text"
                value={filtros.busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por Nombre, Contacto o Email..."
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
        </div>
    );
};

const logicaFiltroProveedores = (proveedores, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) {
        return proveedores;
    }
    const termino = busqueda.toLowerCase();
    return proveedores.filter(p =>
        p.name.toLowerCase().includes(termino) ||
        (p.contact_person && p.contact_person.toLowerCase().includes(termino)) ||
        (p.email && p.email.toLowerCase().includes(termino))
    );
};

const FormularioProveedor = ({ proveedor, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState(proveedor);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proveedor</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Distribuidora S.A." className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto (opcional)</label>
                <input id="contact_person" name="contact_person" value={formData.contact_person || ''} onChange={handleChange} placeholder="Ej: Juan Pérez" className="p-2 border rounded-lg w-full" />
            </div>
            <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                <input id="phone_number" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} placeholder="Ej: 2284 123456" className="p-2 border rounded-lg w-full" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="Ej: contacto@empresa.com" className="p-2 border rounded-lg w-full" />
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
        setProveedorEditando({ name: '', contact_person: '', phone_number: '', email: '' });
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

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(datosProveedor) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(JSON.stringify(errorData)); }
            alert(`Proveedor ${esEditando ? 'actualizado' : 'creado'}.`);
            setModalAbierto(false);
            obtenerDatos();
        } catch (err) {
            alert(`Error al guardar el proveedor: ${err.message}`);
        }
    };

    const borrarProveedor = async (idProveedor) => {
        if (window.confirm("¿Seguro que quieres eliminar este proveedor?")) {
            try {
                await fetch(`${API_URL}/providers/${idProveedor}/`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } });
                alert('Proveedor eliminado.');
                obtenerDatos();
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Proveedor</Button>
            </div>
            
            {FiltrosUI}
            
            <Table
                headers={['Nombre', 'Contacto', 'Teléfono', 'Email', 'Acciones']}
                data={datosPaginados}
                renderRow={(proveedor) => (
                    <tr key={proveedor.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{proveedor.name}</td>
                        <td className="px-6 py-4">{proveedor.contact_person || '-'}</td>
                        <td className="px-6 py-4">{proveedor.phone_number || '-'}</td>
                        <td className="px-6 py-4">{proveedor.email || '-'}</td>
                        <td className="px-6 py-4 flex gap-2">
                            <Button onClick={() => abrirModalEditar(proveedor)} variant="secondary" icon={Edit} />
                            <Button onClick={() => borrarProveedor(proveedor.id)} variant="danger" icon={Trash2} />
                        </td>
                    </tr>
                )}
            />
            
            {PaginacionUI}
            
            <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={proveedorEditando?.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
                {proveedorEditando && <FormularioProveedor proveedor={proveedorEditando} onGuardar={guardarProveedor} onCancelar={() => setModalAbierto(false)} />}
            </Modal>
        </div>
    );
};

export default GestionProveedores;
