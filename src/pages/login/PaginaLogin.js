import React, { useState, useContext } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/ui/ComponentesUI';

const PaginaLogin = () => {
    const { iniciarSesion } = useContext(ContextoAuth);
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setError(null); 
        setCargando(true);

        const resultado = await iniciarSesion(username, password);

        setCargando(false); 

        if (!resultado.success) {
            setError(resultado.message);
        }
    };

    const handleUsernameChange = (e) => {
        setError(null);
        setUsername(e.target.value);
    }
    const handlePasswordChange = (e) => {
        setError(null);
        setPassword(e.target.value);
    }


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
                        value={username}
                        onChange={handleUsernameChange}
                        disabled={cargando}
                    />
                    <div className="relative">
                        <input 
                            type={passwordVisible ? "text" : "password"} 
                            name="password" 
                            required 
                            className="w-full p-3 border rounded-lg pr-10" 
                            placeholder="Contraseña"
                            value={password}
                            onChange={handlePasswordChange}
                            disabled={cargando}
                        />
                        <span 
                            onClick={() => setPasswordVisible(!passwordVisible)} 
                            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                        >
                            {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    <Button type="submit" className="w-full text-lg flex items-center justify-center" variant="primary" disabled={cargando}>
                        {cargando ? <LoaderCircle className="animate-spin" /> : 'Ingresar'}
                    </Button>
                    
                    {error && (
                        <p className="text-red-500 text-sm font-medium pt-2">
                            {error}
                        </p>
                    )}

                </form>
            </Card>
        </div>
    );
};

export default PaginaLogin;