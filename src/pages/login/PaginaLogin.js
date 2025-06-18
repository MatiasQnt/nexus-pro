import React, { useState, useContext } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/ui/ComponentesUI';

const PaginaLogin = () => {
    const { iniciarSesion } = useContext(ContextoAuth);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        iniciarSesion(e.target.username.value, e.target.password.value);
    };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center">
            <Card className="text-center w-full max-w-sm">
                <h1 className="text-3xl font-bold mb-2 text-indigo-600">MiNegocio<span className="font-light">PRO</span></h1>
                <p className="text-gray-500 mb-6">Inicia sesión para continuar</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        name="username" 
                        required 
                        className="w-full p-3 border rounded-lg" 
                        placeholder="Nombre de usuario" 
                    />
                    <div className="relative">
                        <input 
                            type={passwordVisible ? "text" : "password"} 
                            name="password" 
                            required 
                            className="w-full p-3 border rounded-lg pr-10" 
                            placeholder="Contraseña" 
                        />
                        <span 
                            onClick={() => setPasswordVisible(!passwordVisible)} 
                            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                        >
                            {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                    <Button type="submit" className="w-full text-lg" variant="primary">
                        Ingresar
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default PaginaLogin;
