import React, { useState, useContext, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Formulario para crear o editar una categoría.
 */
const FormularioCategoria = ({ categoria, onGuardar, onCancelar }) => {
    const [formData, setFormData] = useState({ name: '', is_active: true });
    useEffect(() => {
        if (categoria) {
            setFormData({
                name: categoria.name || '',
                is_active: categoria.is_active !== undefined ? categoria.is_active : true,
            });
        }
    }, [categoria]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleSubmit = (e) => { e.preventDefault(); onGuardar(formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="p-2 border rounded-lg w-full" placeholder="Ej: Bebidas" required />
            </div>
            <div className="flex items-center gap-2 mt-4">
                <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Activa</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Guardar</Button>
            </div>
        </form>
    );
};

/**
 * Componente de UI para el filtro y la búsqueda.
 */
const FiltroBusquedaCategoria = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => { setFiltros(prev => ({ ...prev, busqueda: e.target.value })); };
    return (
        <div className="mb-4">
            <input type="text" value={filtros.busqueda} onChange={handleBusquedaChange} placeholder="Buscar por nombre..." className="p-2 border rounded-lg w-full md:w-1/3" />
        </div>
    );
};

/**
 * Lógica para filtrar las categorías según el término de búsqueda.
 */
const logicaFiltroCategorias = (categorias, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) return categorias;
    const terminoBusquedaLower = busqueda.toLowerCase();
    return categorias.filter(c => c.name.toLowerCase().includes(terminoBusquedaLower));
};


const GestionCategorias = ({ categorias, obtenerDatos }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: categorias,
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroCategorias,
        ComponenteFiltros: FiltroBusquedaCategoria,
        filtrosIniciales: { busqueda: '' }
    });

    const cerrarModal = () => { setModalAbierto(false); setCategoriaSeleccionada(null); };
    const abrirModalNuevo = () => { setCategoriaSeleccionada({ name: '', is_active: true }); setModalAbierto(true); };
    const abrirModalEditar = (categoria) => { setCategoriaSeleccionada(categoria); setModalAbierto(true); };

    const guardarCategoria = async (datosCategoria) => {
        const esEditando = !!categoriaSeleccionada?.id;
        const url = esEditando ? `${API_URL}/categories/${categoriaSeleccionada.id}/` : `${API_URL}/categories/`;
        const method = esEditando ? 'PUT' : 'POST';
        
        const promesaDeGuardado = fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(datosCategoria) })
            .then(res => {
                if (!res.ok) return res.json().then(err => Promise.reject(err));
                return res;
            });

        toast.promise(promesaDeGuardado, {
            loading: 'Guardando categoría...',
            success: () => {
                cerrarModal();
                obtenerDatos();
                return `Categoría ${esEditando ? 'actualizada' : 'creada'} con éxito.`;
            },
            error: (err) => `Error al guardar: ${JSON.stringify(err)}`
        });
    };
    
    const borrarCategoria = async (idCategoria) => {
        const promesaDeBorrado = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`${API_URL}/categories/${idCategoria}/`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } });
                if (response.status === 204) {
                    resolve("Categoría eliminada con éxito.");
                } else if (response.ok) {
                    const data = await response.json();
                    resolve(data.detail);
                } else {
                    const errorData = await response.json();
                    reject(new Error(errorData.detail || 'Error al eliminar.'));
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
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Categorías</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nueva Categoría</Button>
            </div>
            
            {FiltrosUI}

            {datosPaginados.length > 0 ? (
                <>
                    <Table 
                        headers={['Nombre', 'Estado', 'Acciones']} 
                        data={datosPaginados}
                        renderRow={(cat) => (
                            <tr key={cat.id} className={`border-b hover:bg-gray-50 ${!cat.is_active ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}>
                                <td className="px-6 py-4 font-medium">{cat.name}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {cat.is_active ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <Button onClick={() => abrirModalEditar(cat)} variant="secondary" size="sm" icon={Edit} />
                                    <Button onClick={() => borrarCategoria(cat.id)} variant="danger" size="sm" icon={Trash2} />
                                </td>
                            </tr>
                        )}
                    />
                    {PaginacionUI}
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">No se encontraron categorías</h3>
                    <p className="text-gray-500 mt-1">Intenta ajustar los términos de tu búsqueda o crea una nueva categoría.</p>
                </div>
            )}
            
            <Modal isOpen={modalAbierto} onClose={cerrarModal} title={categoriaSeleccionada?.id ? 'Editar Categoría' : 'Nueva Categoría'}>
                {categoriaSeleccionada && <FormularioCategoria categoria={categoriaSeleccionada} onGuardar={guardarCategoria} onCancelar={cerrarModal} />}
            </Modal>
        </div>
    );
};

export default GestionCategorias;