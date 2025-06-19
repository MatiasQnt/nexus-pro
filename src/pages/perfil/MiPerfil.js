import React, { useState, useContext } from 'react';
import { ContextoAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/ui/ComponentesUI';

const API_URL = 'http://127.0.0.1:8000/api';

const MiPerfil = () => {
    const { usuario, tokensAuth } = useContext(ContextoAuth);
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ tipo: '', texto: '' });

        if (formData.new_password !== formData.confirm_password) {
            setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + String(tokensAuth.access)
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ocurrió un error al cambiar la contraseña.');
            }

            setMensaje({ tipo: 'exito', texto: 'Contraseña cambiada con éxito.' });
            setFormData({ old_password: '', new_password: '', confirm_password: '' });

        } catch (err) {
            setMensaje({ tipo: 'error', texto: err.message });
        }
    };

    if (!usuario) {
        return <div>Cargando perfil...</div>;
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
            
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Información de Usuario</h2>
                <div className="space-y-2 text-gray-700">
                    <p><strong>Username:</strong> {usuario.username}</p>
                    <p><strong>Rol:</strong> {usuario.groups.join(', ')}</p>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Cambiar Contraseña</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Contraseña Actual</label>
                        <input type="password" name="old_password" value={formData.old_password} onChange={handleChange} className="p-2 border rounded-lg w-full mt-1" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Nueva Contraseña</label>
                        <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} className="p-2 border rounded-lg w-full mt-1" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Confirmar Nueva Contraseña</label>
                        <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="p-2 border rounded-lg w-full mt-1" required />
                    </div>

                    {mensaje.texto && (
                        <p className={`text-sm ${mensaje.tipo === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                            {mensaje.texto}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit">Guardar Cambios</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default MiPerfil;
