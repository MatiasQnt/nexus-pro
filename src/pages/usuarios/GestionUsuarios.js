import React, { useState, useContext, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, KeyRound } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

const FormularioUsuario = ({ usuario, onGuardar, onCancelar, grupos }) => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', groups: []
    });

    useEffect(() => {
        if (usuario) {
            setFormData({
                username: usuario.username || '',
                email: usuario.email || '',
                password: '',
                groups: (usuario.groups || []).map(id => String(id)) 
            });
        }
    }, [usuario]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="p-2 border rounded-lg w-full" />
            </div>
            {!usuario.id && (
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

const FormularioReseteoClave = ({ onGuardar, onCancelar }) => {
    const [nuevaClave, setNuevaClave] = useState('');
    const [confirmarClave, setConfirmarClave] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (nuevaClave !== confirmarClave) { toast.error("Las contraseñas no coinciden."); return; }
        if (nuevaClave.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres."); return; }
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
    const { tokensAuth, usuario: usuarioActual } = useContext(ContextoAuth);

    const abrirModalNuevo = () => { setUsuarioSeleccionado({}); setModalAbierto(true); };
    const abrirModalEditar = (usuario) => { setUsuarioSeleccionado(usuario); setModalAbierto(true); };
    const abrirModalReseteo = (usuario) => { setUsuarioSeleccionado(usuario); setResetModalAbierto(true); };
    const cerrarModales = () => { setModalAbierto(false); setResetModalAbierto(false); setUsuarioSeleccionado(null); };

    const guardarUsuario = async (datosUsuario) => {
        const esEditando = !!usuarioSeleccionado.id;
        const url = esEditando ? `${API_URL}/users/${usuarioSeleccionado.id}/` : `${API_URL}/users/`;
        const method = esEditando ? 'PUT' : 'POST';
        
        const payload = { ...datosUsuario };
        if (esEditando && !payload.password) {
            delete payload.password;
        }
        payload.groups = datosUsuario.groups.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

        toast.promise(
            fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(payload) })
                .then(res => {
                    if (!res.ok) return res.json().then(err => Promise.reject(err));
                    if (res.status === 204) return;
                    return res.json();
                }),
            {
                loading: 'Guardando usuario...',
                success: () => {
                    cerrarModales();
                    obtenerDatos();
                    return `Usuario ${esEditando ? 'actualizado' : 'creado'}.`;
                },
                error: (err) => `Error: ${JSON.stringify(err)}`
            }
        );
    };

    const borrarUsuario = (idUsuario, username) => {
        if (usuarioActual?.username === username) {
            toast.error("No puedes eliminarte a ti mismo.");
            return;
        }

        toast("¿Seguro que quieres eliminar este usuario?", {
            description: `Estás a punto de eliminar a ${username}. Esta acción no se puede deshacer.`,
            action: {
                label: "Sí, eliminar",
                onClick: () => {
                    const promesa = fetch(`${API_URL}/users/${idUsuario}/`, { 
                        method: 'DELETE', 
                        headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }
                    }).then(res => {
                        if (res.status !== 204) {
                           return res.json().then(err => Promise.reject(err));
                        }
                        return res;
                    });

                    toast.promise(promesa, {
                        loading: 'Eliminando...',
                        success: () => {
                            obtenerDatos();
                            return 'Usuario eliminado con éxito.';
                        },
                        error: (err) => `Error al eliminar: ${JSON.stringify(err)}`
                    });
                }
            },
            cancel: { label: "No" }
        });
    };

    const handleReseteoClave = async (nuevaClave) => {
        if (!usuarioSeleccionado) return;
        
        const promesa = fetch(`${API_URL}/users/${usuarioSeleccionado.id}/set-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
            body: JSON.stringify({ password: nuevaClave })
        }).then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
        });

        toast.promise(promesa, {
            loading: 'Actualizando contraseña...',
            success: (data) => {
                cerrarModales();
                return data.status || 'Contraseña actualizada.';
            },
            error: (err) => `Error: ${err.error || 'No se pudo resetear la contraseña.'}`
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <Button onClick={abrirModalNuevo} icon={PlusCircle}>Nuevo Usuario</Button>
            </div>
            
            {usuarios.length > 0 ? (
                <Table 
                    headers={[
                        { title: 'Username' },
                        { title: 'Email' },
                        { title: 'Rol' },
                        { title: 'Acciones' }
                    ]} 
                    data={usuarios}
                    renderRow={(u) => (
                        <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{u.username}</td>
                            <td className="px-6 py-4">{u.email || '-'}</td>
                            <td className="px-6 py-4">{u.groups.map(id => grupos.find(g => g.id === id)?.name).join(', ')}</td>
                            <td className="px-6 py-4 flex gap-2">
                                <Button onClick={() => abrirModalReseteo(u)} variant="secondary" size="sm" icon={KeyRound} title="Resetear Contraseña" />
                                <Button onClick={() => abrirModalEditar(u)} variant="secondary" size="sm" icon={Edit} />
                                {/* Se añade una comprobación para no mostrar el botón de borrar para el usuario actual */}
                                {usuarioActual?.username !== u.username && (
                                    <Button onClick={() => borrarUsuario(u.id, u.username)} variant="danger" size="sm" icon={Trash2} />
                                )}
                            </td>
                        </tr>
                    )}
                />
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">No se encontraron usuarios</h3>
                    <p className="text-gray-500 mt-1">Puedes crear un nuevo usuario para empezar.</p>
                </div>
            )}
            
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