import React, { useState, useContext } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO (sin cambios) ---
const FiltroBusquedaMetodoPago = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => {
        setFiltros({ ...filtros, busqueda: e.target.value });
    };
    return (
        <div className="mb-4">
            <input type="text" value={filtros.busqueda} onChange={handleBusquedaChange} placeholder="Buscar por nombre..." className="p-2 border rounded-lg w-full md:w-1/3" />
        </div>
    );
};
const logicaFiltroMetodosDePago = (metodos, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) return metodos;
    const termino = busqueda.toLowerCase();
    return metodos.filter(m => m.name.toLowerCase().includes(termino));
};


// --- Formulario para Métodos de Pago (con Labels) ---
const FormularioMetodoPago = ({ metodo, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState(metodo);
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // --- INICIO DE CAMBIOS (1/2) ---
    // Esta función selecciona todo el texto del input al hacer foco.
    const handleFocus = (event) => event.target.select();
    // --- FIN DE CAMBIOS (1/2) ---

    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Método</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Efectivo, Tarjeta Naranja" className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="adjustment_percentage" className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de Ajuste</label>
                <input 
                    id="adjustment_percentage" 
                    name="adjustment_percentage" 
                    type="number" 
                    step="0.01" 
                    value={formData.adjustment_percentage} 
                    onChange={handleChange} 
                    placeholder="Ej: -10 o 8.5" 
                    className="p-2 border rounded-lg w-full" 
                    onFocus={handleFocus} // <-- Se añade el evento onFocus aquí
                    required 
                />
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


// --- Página Principal de Gestión de Métodos de Pago ---
const GestionMetodosDePago = ({ metodosDePago, obtenerDatos }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [metodoEditando, setMetodoEditando] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: metodosDePago,
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroMetodosDePago,
        ComponenteFiltros: FiltroBusquedaMetodoPago,
        filtrosIniciales: { busqueda: '' }
    });

    const abrirModalNuevo = () => {
        // --- INICIO DE CAMBIOS (2/2) ---
        // Se cambia '0.00' por un string vacío ''
        setMetodoEditando({ name: '', adjustment_percentage: '', is_active: true });
        // --- FIN DE CAMBIOS (2/2) ---
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

        // Asegurarse de que el porcentaje no se envíe vacío
        const payload = {
            ...datosMetodo,
            adjustment_percentage: datosMetodo.adjustment_percentage === '' ? '0.00' : datosMetodo.adjustment_percentage
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
                body: JSON.stringify(payload)
            });
            if (!response.ok) { 
                const errorData = await response.json(); 
                throw new Error(JSON.stringify(errorData)); 
            }
            alert(`Método de pago ${esEditando ? 'actualizado' : 'creado'} con éxito.`);
            setModalAbierto(false);
            obtenerDatos();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };
    
    const borrarMetodo = async (idMetodo) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este método de pago?")) {
            try {
                const response = await fetch(`${API_URL}/admin/payment-methods/${idMetodo}/`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }
                });

                if (response.status === 204) {
                    alert('Método de pago eliminado con éxito.');
                } else if (response.ok) {
                    const data = await response.json();
                    alert(data.detail);
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "No se pudo procesar la solicitud.");
                }

                obtenerDatos();
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Métodos de Pago</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Método</Button>
            </div>

            {FiltrosUI}

            <Table
                headers={['Nombre', 'Ajuste (%)', 'Estado', 'Acciones']}
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
                            <Button onClick={() => abrirModalEditar(pm)} variant="secondary" size="sm" icon={Edit} />
                            <Button onClick={() => borrarMetodo(pm.id)} variant="danger" size="sm" icon={Trash2} />
                        </td>
                    </tr>
                )}
            />

            {PaginacionUI}

            <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title={metodoEditando?.id ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}>
                {metodoEditando && <FormularioMetodoPago metodo={metodoEditando} onGuardar={guardarMetodo} onCancelar={() => setModalAbierto(false)} />}
            </Modal>
        </div>
    );
};

export default GestionMetodosDePago;