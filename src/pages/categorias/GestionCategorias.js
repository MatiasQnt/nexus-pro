import React, { useState, useContext, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Formulario para crear o editar una categoría.
 */
const FormularioCategoria = ({ categoria, onGuardar, onCancelar }) => {
    const [nombre, setNombre] = useState('');

    useEffect(() => {
        if (categoria) {
            setNombre(categoria.name || '');
        }
    }, [categoria]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar({ name: nombre });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría</label>
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="p-2 border rounded-lg w-full"
                    placeholder="Ej: Bebidas"
                    required
                />
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
    const handleBusquedaChange = (e) => {
        setFiltros(prev => ({ ...prev, busqueda: e.target.value }));
    };

    return (
        <div className="mb-4">
            <input
                type="text"
                value={filtros.busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por nombre..."
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
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

    const cerrarModal = () => {
        setModalAbierto(false);
        setCategoriaSeleccionada(null);
    };

    const abrirModalNuevo = () => {
        setCategoriaSeleccionada({});
        setModalAbierto(true);
    };

    const abrirModalEditar = (categoria) => {
        setCategoriaSeleccionada(categoria);
        setModalAbierto(true);
    };

    const guardarCategoria = async (datosCategoria) => {
        const esEditando = !!categoriaSeleccionada?.id;
        const url = esEditando ? `${API_URL}/categories/${categoriaSeleccionada.id}/` : `${API_URL}/categories/`;
        const method = esEditando ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
                body: JSON.stringify(datosCategoria)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }
            alert(`Categoría ${esEditando ? 'actualizada' : 'creada'}.`);
            cerrarModal();
            obtenerDatos();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };
    
    const borrarCategoria = async (idCategoria) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta categoría? Si tiene productos asociados, no podrás eliminarla.")) {
            try {
                const response = await fetch(`${API_URL}/categories/${idCategoria}/`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Error al eliminar la categoría.');
                }
                
                alert('Categoría eliminada.');
                obtenerDatos();
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Categorías</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nueva Categoría</Button>
            </div>
            
            {/* --- INICIO DE CORRECCIÓN --- */}
            {FiltrosUI}
            {/* --- FIN DE CORRECCIÓN --- */}

            <Table 
                headers={['ID', 'Nombre', 'Acciones']} 
                data={datosPaginados}
                renderRow={(cat) => (
                    <tr key={cat.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">{cat.id}</td>
                        <td className="px-6 py-4 font-medium">{cat.name}</td>
                        <td className="px-6 py-4 flex gap-2">
                            <Button onClick={() => abrirModalEditar(cat)} variant="secondary" size="sm" icon={Edit} />
                            <Button onClick={() => borrarCategoria(cat.id)} variant="danger" size="sm" icon={Trash2} />
                        </td>
                    </tr>
                )}
            />

            {/* --- INICIO DE CORRECCIÓN --- */}
            {PaginacionUI}
            {/* --- FIN DE CORRECCIÓN --- */}
            
            <Modal isOpen={modalAbierto} onClose={cerrarModal} title={categoriaSeleccionada?.id ? 'Editar Categoría' : 'Nueva Categoría'}>
                {categoriaSeleccionada && <FormularioCategoria categoria={categoriaSeleccionada} onGuardar={guardarCategoria} onCancelar={cerrarModal} />}
            </Modal>
        </div>
    );
};

export default GestionCategorias;
