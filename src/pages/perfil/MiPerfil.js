import React, { useState, useContext } from 'react';
import { LoaderCircle } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/ui/ComponentesUI';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

const MiPerfil = () => {
    const { usuario, tokensAuth } = useContext(ContextoAuth);
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [cargando, setCargando] = useState(false); // Estado para el indicador de carga

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- INICIO DE CAMBIOS: Notificaciones con Sonner ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación inicial con un toast
        if (formData.new_password !== formData.confirm_password) {
            toast.error('Las contraseñas nuevas no coinciden.');
            return;
        }

        setCargando(true);

        const promesa = fetch(`${API_URL}/users/change-password/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + String(tokensAuth.access)
            },
            body: JSON.stringify(formData)
        }).then(res => {
            if (!res.ok) {
                // Si la respuesta no es OK, leemos el JSON del error y lo rechazamos
                return res.json().then(err => Promise.reject(err));
            }
            return res.json();
        });

        toast.promise(promesa, {
            loading: 'Guardando cambios...',
            success: (data) => {
                // Limpiamos el formulario en caso de éxito
                setFormData({ old_password: '', new_password: '', confirm_password: '' });
                return data.status || 'Contraseña cambiada con éxito.';
            },
            error: (err) => {
                // Mostramos el mensaje de error que viene del backend
                return err.error || 'Ocurrió un error inesperado.';
            },
            finally: () => {
                setCargando(false);
            }
        });
    };
    // --- FIN DE CAMBIOS ---

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
                        <input type="password" name="old_password" value={formData.old_password} onChange={handleChange} className="p-2 border rounded-lg w-full mt-1" required disabled={cargando} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Nueva Contraseña</label>
                        <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} className="p-2 border rounded-lg w-full mt-1" required disabled={cargando} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Confirmar Nueva Contraseña</label>
                        <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="p-2 border rounded-lg w-full mt-1" required disabled={cargando} />
                    </div>

                    {/* El mensaje de texto se elimina de aquí y se maneja con toast */}

                    <div className="flex justify-end">
                        {/* Se añade el spinner de carga al botón */}
                        <Button type="submit" disabled={cargando}>
                            {cargando ? <LoaderCircle className="animate-spin" /> : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default MiPerfil;