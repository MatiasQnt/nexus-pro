import React, { useState, useContext, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, KeyRound } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Formulario para crear o editar la información básica de un usuario.
 */
const FormularioUsuario = ({ usuario, onGuardar, onCancelar, grupos }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        groups: []
    });

    useEffect(() => {
        if (usuario) {
            setFormData({
                username: usuario.username || '',
                email: usuario.email || '',
                password: '', // La contraseña siempre se deja en blanco al editar para no mostrarla.
                groups: usuario.groups || []
            });
        }
    }, [usuario]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({ ...prev, groups: selectedOptions }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="p-2 border rounded-lg w-full" required />
            </div>
            {!usuario.id && ( // Solo mostrar el campo de contraseña al crear un nuevo usuario.
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="p-2 border rounded-lg w-full" required />
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                <select multiple value={formData.groups} onChange={handleGroupChange} className="p-2 border rounded-lg w-full h-24">
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Guardar</Button>
            </div>
        </form>
    );
};

/**
 * Formulario específico para que el SuperAdmin establezca una nueva contraseña.
 */
const FormularioReseteoClave = ({ onGuardar, onCancelar }) => {
    const [nuevaClave, setNuevaClave] = useState('');
    const [confirmarClave, setConfirmarClave] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (nuevaClave !== confirmarClave) {
            alert("Las contraseñas no coinciden.");
            return;
        }
        if (nuevaClave.length < 8) {
            alert("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        onGuardar(nuevaClave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input type="password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} className="p-2 border rounded-lg w-full" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                <input type="password" value={confirmarClave} onChange={(e) => setConfirmarClave(e.target.value)} className="p-2 border rounded-lg w-full" required />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancelar} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Guardar Contraseña</Button>
            </div>
        </form>
    );
};


const GestionUsuarios = ({ usuarios, grupos, obtenerDatos }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [resetModalAbierto, setResetModalAbierto] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);

    const abrirModalNuevo = () => {
        setUsuarioSeleccionado({});
        setModalAbierto(true);
    };

    const abrirModalEditar = (usuario) => {
        setUsuarioSeleccionado(usuario);
        setModalAbierto(true);
    };

    const abrirModalReseteo = (usuario) => {
        setUsuarioSeleccionado(usuario);
        setResetModalAbierto(true);
    };
    
    const cerrarModales = () => {
        setModalAbierto(false);
        setResetModalAbierto(false);
        setUsuarioSeleccionado(null);
    };

    const guardarUsuario = async (datosUsuario) => {
        const esEditando = !!usuarioSeleccionado.id;
        const url = esEditando ? `${API_URL}/users/${usuarioSeleccionado.id}/` : `${API_URL}/users/`;
        const method = esEditando ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(datosUsuario) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(JSON.stringify(errorData)); }
            alert(`Usuario ${esEditando ? 'actualizado' : 'creado'}.`);
            cerrarModales();
            obtenerDatos();
        } catch (err) { alert(`Error: ${err.message}`); }
    };
    
    const borrarUsuario = async (idUsuario) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
            try {
                await fetch(`${API_URL}/users/${idUsuario}/`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }});
                alert('Usuario eliminado.');
                obtenerDatos();
            } catch (err) { alert(`Error: ${err.message}`); }
        }
    };

    const handleReseteoClave = async (nuevaClave) => {
        if (!usuarioSeleccionado) return;

        try {
            const response = await fetch(`${API_URL}/users/${usuarioSeleccionado.id}/set-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + String(tokensAuth.access)
                },
                body: JSON.stringify({ password: nuevaClave })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo resetear la contraseña.');
            }

            alert(`Contraseña para ${usuarioSeleccionado.username} actualizada.`);
            cerrarModales();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Usuario</Button>
            </div>
            
            <Table 
                headers={['Username', 'Email', 'Rol', 'Acciones']} 
                data={usuarios}
                renderRow={(u) => (
                    <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{u.username}</td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4">{u.groups.map(id => grupos.find(g => g.id === id)?.name).join(', ')}</td>
                        <td className="px-6 py-4 flex gap-2">
                            <Button onClick={() => abrirModalReseteo(u)} variant="secondary" size="sm" icon={KeyRound} title="Resetear Contraseña" />
                            <Button onClick={() => abrirModalEditar(u)} variant="secondary" size="sm" icon={Edit} />
                            <Button onClick={() => borrarUsuario(u.id)} variant="danger" size="sm" icon={Trash2} />
                        </td>
                    </tr>
                )}
            />
            
            <Modal isOpen={modalAbierto} onClose={cerrarModales} title={usuarioSeleccionado?.id ? 'Editar Usuario' : 'Nuevo Usuario'}>
                {usuarioSeleccionado && <FormularioUsuario usuario={usuarioSeleccionado} onGuardar={guardarUsuario} onCancelar={cerrarModales} grupos={grupos} />}
            </Modal>

            <Modal isOpen={resetModalAbierto} onClose={cerrarModales} title={`Resetear Contraseña de ${usuarioSeleccionado?.username}`}>
                <FormularioReseteoClave onGuardar={handleReseteoClave} onCancelar={cerrarModales} />
            </Modal>
        </div>
    );
};

export default GestionUsuarios;
