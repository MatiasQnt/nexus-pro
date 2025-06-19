import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';

const API_URL = 'http://127.0.0.1:8000/api';

const decodificarToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Error al decodificar el token", e);
        return null;
    }
}

export const ContextoAuth = createContext();

export const ProveedorAuth = ({ children }) => {
    const [tokensAuth, setTokensAuth] = useState(() => localStorage.getItem('tokensAuth') ? JSON.parse(localStorage.getItem('tokensAuth')) : null);
    const [usuario, setUsuario] = useState(null);
    const [cargandoContexto, setCargandoContexto] = useState(true);

    const iniciarSesion = async (nombreUsuario, contrasena) => {
        try {
            const response = await fetch(`${API_URL}/token/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ username: nombreUsuario, password: contrasena }) 
            });
            const data = await response.json();
            if (response.ok) { 
                setTokensAuth(data); 
                setUsuario(decodificarToken(data.access)); 
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
        if (!tokensAuth) {
            setCargandoContexto(false);
            return;
        }

        const tokenInfo = decodificarToken(tokensAuth.access);
        
        if (!tokenInfo) {
            cerrarSesion();
            setCargandoContexto(false);
            return;
        }
        
        setUsuario(tokenInfo);

        const ahora = Date.now() / 1000;
        const tiempoRestante = (tokenInfo.exp - ahora - 60) * 1000;
        
        const timeout = setTimeout(() => {
            actualizarToken();
        }, tiempoRestante > 0 ? tiempoRestante : 0);
        
        setCargandoContexto(false);
        
        return () => clearTimeout(timeout);

    }, [tokensAuth, actualizarToken, cerrarSesion]);

    const datosContexto = useMemo(() => ({ 
        usuario, 
        tokensAuth, 
        iniciarSesion, 
        cerrarSesion 
    }), [usuario, tokensAuth, cerrarSesion, iniciarSesion]);

    return (
        <ContextoAuth.Provider value={datosContexto}>
            {cargandoContexto ? <div className="min-h-screen flex items-center justify-center">Cargando...</div> : children}
        </ContextoAuth.Provider>
    );
};
