import React, { useState, useContext } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO ---

const FiltroBusquedaUsuario = ({ setFiltros, filtros }) => {
    const handleBusquedaChange = (e) => {
        setFiltros({ ...filtros, busqueda: e.target.value });
    };

    return (
        <div className="mb-4">
            <input
                type="text"
                value={filtros.busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por nombre de usuario..."
                className="p-2 border rounded-lg w-full md:w-1/3"
            />
        </div>
    );
};

const logicaFiltroUsuarios = (usuarios, filtros) => {
    const { busqueda } = filtros;
    if (!busqueda) {
        return usuarios;
    }
    const termino = busqueda.toLowerCase();
    return usuarios.filter(u => u.username.toLowerCase().includes(termino));
};


// --- Formulario para Usuarios (con Labels) ---
const FormularioUsuario = ({ onGuardar, onCancelar, grupos }) => {
    const [formData, setFormData] = useState({ username: '', password: '', groups: [] });
    
    const handleChange = (e) => { 
        const { name, value } = e.target; 
        setFormData(prev => ({ ...prev, [name]: value })); 
    };

    const handleGroupChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({...prev, groups: selectedOptions}));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(formData); }} className="space-y-4">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                <input id="username" name="username" value={formData.username} onChange={handleChange} placeholder="Ej: mperez" className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label htmlFor="groups" className="block text-sm font-medium text-gray-700 mb-1">Grupo(s)</label>
                <select id="groups" multiple value={formData.groups} onChange={handleGroupChange} className="p-2 border rounded-lg w-full" required>
                    {grupos.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl (o Cmd en Mac) para seleccionar más de uno.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Crear Usuario</Button>
            </div>
        </form>
    );
};

// --- Página Principal de Gestión de Usuarios ---
const GestionUsuarios = ({ usuarios, grupos, obtenerDatos }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const { tokensAuth, usuario: usuarioActual } = useContext(ContextoAuth);

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: usuarios,
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroUsuarios,
        ComponenteFiltros: FiltroBusquedaUsuario,
        filtrosIniciales: { busqueda: '' }
    });

    const guardarUsuario = async (datosUsuario) => {
        try {
            const response = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
                body: JSON.stringify(datosUsuario),
            });
            if (!response.ok) { 
                const errorData = await response.json(); 
                throw new Error(JSON.stringify(errorData)); 
            }
            alert('Usuario creado con éxito.'); 
            setModalAbierto(false); 
            obtenerDatos();
        } catch (err) { 
            alert(`Error al crear usuario: ${err.message}`); 
        }
    };
    
    const borrarUsuario = async (idUsuario) => {
        if (idUsuario === usuarioActual.user_id) { 
            alert("No puedes eliminar tu propia cuenta."); 
            return; 
        }
        if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
            try {
                await fetch(`${API_URL}/users/${idUsuario}/`, { 
                    method: 'DELETE', 
                    headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }
                });
                alert('Usuario eliminado con éxito.'); 
                obtenerDatos();
            } catch (err) { 
                alert(`Error al eliminar: ${err.message}`); 
            }
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <Button onClick={() => setModalAbierto(true)} icon={PlusCircle}>Nuevo Usuario</Button>
            </div>
            
            {FiltrosUI}
            
            <Table 
                headers={['ID', 'Username', 'Grupos', 'Acciones']} 
                data={datosPaginados} 
                renderRow={(user) => (
                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{user.id}</td>
                        <td className="px-6 py-4">{user.username}</td>
                        <td className="px-6 py-4">{user.groups.join(', ')}</td>
                        <td className="px-6 py-4">
                            <Button onClick={() => borrarUsuario(user.id)} variant="danger" disabled={user.id === usuarioActual.user_id} icon={Trash2}/>
                        </td>
                    </tr>
                )}
            />
            
            {PaginacionUI}
            
            <Modal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} title="Crear Nuevo Usuario">
                <FormularioUsuario onGuardar={guardarUsuario} onCancelar={() => setModalAbierto(false)} grupos={grupos} />
            </Modal>
        </div>
    );
};

export default GestionUsuarios;
