import React, { useState, useEffect, createContext, useCallback } from 'react';

const API_URL = 'http://127.0.0.1:8000/api';

// --- Función para decodificar JWT de forma segura ---
const decodificarToken = (token) => {
    try {
        // Esta función decodifica la parte 'payload' de un token JWT.
        // atob() decodifica una cadena de texto que ha sido codificada en base-64.
        // El token se divide por los puntos, y tomamos la segunda parte (el payload).
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Error al decodificar el token", e);
        return null;
    }
}

export const ContextoAuth = createContext();

export const ProveedorAuth = ({ children }) => {
    const [tokensAuth, setTokensAuth] = useState(() => localStorage.getItem('tokensAuth') ? JSON.parse(localStorage.getItem('tokensAuth')) : null);
    const [usuario, setUsuario] = useState(() => {
        const tokens = localStorage.getItem('tokensAuth');
        if (!tokens) return null;
        try {
            return decodificarToken(JSON.parse(tokens).access);
        } catch (e) {
            return null;
        }
    });
    const [cargando, setCargando] = useState(true);

    const iniciarSesion = async (nombreUsuario, contrasena) => {
        try {
            const response = await fetch(`${API_URL}/token/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ username: nombreUsuario, password: contrasena }) 
            });
            const data = await response.json();
            if (response.ok) { 
                const usuarioDecodificado = decodificarToken(data.access);
                setTokensAuth(data); 
                setUsuario(usuarioDecodificado); 
                localStorage.setItem('tokensAuth', JSON.stringify(data)); 
            } else { 
                alert('Usuario o contraseña incorrectos.'); 
            }
        } catch (error) {
            alert('Error de conexión con el servidor.');
        }
    };

    const cerrarSesion = useCallback(() => { 
        setTokensAuth(null); 
        setUsuario(null); 
        localStorage.removeItem('tokensAuth'); 
    }, []);

    const actualizarToken = useCallback(async () => {
        const tokensActuales = JSON.parse(localStorage.getItem('tokensAuth'));
        if (!tokensActuales?.refresh) {
            cerrarSesion();
            return;
        }
        try {
            const response = await fetch(`${API_URL}/token/refresh/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 'refresh': tokensActuales.refresh }) 
            });
            const data = await response.json();
            if (response.ok) {
                const nuevosTokens = { ...tokensActuales, access: data.access };
                setTokensAuth(nuevosTokens); 
                setUsuario(decodificarToken(data.access));
                localStorage.setItem('tokensAuth', JSON.stringify(nuevosTokens));
            } else { 
                cerrarSesion(); 
            }
        } catch { 
            cerrarSesion(); 
        }
    }, [cerrarSesion]);

    useEffect(() => { 
        const cuatroMinutos = 1000 * 60 * 4;
        const interval = setInterval(() => { 
            if (tokensAuth) {
                actualizarToken();
            }
        }, cuatroMinutos);
        return () => clearInterval(interval);
    }, [tokensAuth, actualizarToken]);

    useEffect(() => { 
        setCargando(false); 
    }, []);

    const datosContexto = { usuario, tokensAuth, iniciarSesion, cerrarSesion };

    return (
        <ContextoAuth.Provider value={datosContexto}>
            {cargando ? <div className="min-h-screen flex items-center justify-center">Cargando...</div> : children}
        </ContextoAuth.Provider>
    );
};
