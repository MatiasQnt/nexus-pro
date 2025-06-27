import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ContextoAuth } from '../context/AuthContext';
import { Button } from '../components/ui/ComponentesUI';

export const useServerSidePagination = ({
    endpoint,
    initialFilters = {},
    itemsPorPagina = 10,
    ComponenteFiltros,
}) => {
    const { tokensAuth } = useContext(ContextoAuth);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [filtros, setFiltros] = useState(initialFilters);

    // --- CAMBIO CLAVE AQUÍ ---
    // Hacemos que la dependencia sea el string del token, no el objeto entero.
    const accessToken = tokensAuth?.access;

    const fetchData = useCallback(async (page, currentFilters) => {
        // Usamos la variable estable 'accessToken'
        if (!accessToken) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
            page: page,
            page_size: itemsPorPagina,
        });

        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                params.append(key, value);
            }
        });

        const url = `http://127.0.0.1:8000/api/${endpoint}/?${params.toString()}`;

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + String(accessToken) },
            });
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudieron obtener los datos.`);
            }
            const result = await response.json();
            
            setData(result.results);
            setTotalItems(result.count);
            setTotalPaginas(Math.ceil(result.count / itemsPorPagina));

        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    // La dependencia ahora es 'accessToken', que es un string y es estable.
    }, [endpoint, itemsPorPagina, accessToken]);

    const refetch = useCallback(() => {
        fetchData(paginaActual, filtros);
    }, [fetchData, paginaActual, filtros]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const irAPagina = (page) => {
        const nuevaPagina = Math.max(1, Math.min(page, totalPaginas || 1));
        setPaginaActual(nuevaPagina);
    };

    const handleSetFiltros = (nuevosFiltros) => {
        setPaginaActual(1);
        setFiltros(nuevosFiltros);
    };

    const resetFiltros = () => {
        setPaginaActual(1);
        setFiltros(initialFilters);
    };

    const FiltrosUI = ComponenteFiltros ? (
        <ComponenteFiltros setFiltros={handleSetFiltros} filtros={filtros} resetFiltros={resetFiltros} />
    ) : null;

    const PaginacionUI = (
        <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-700">
                Mostrando {data.length > 0 ? ((paginaActual - 1) * itemsPorPagina) + 1 : 0}
                - {Math.min(paginaActual * itemsPorPagina, totalItems)} de {totalItems} resultados
            </span>
            <div className="flex gap-2">
                <Button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1 || loading}>
                    Anterior
                </Button>
                <span className="self-center px-4 py-2 text-sm">
                    Página {paginaActual} de {totalPaginas > 0 ? totalPaginas : 1}
                </span>
                <Button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas || loading}>
                    Siguiente
                </Button>
            </div>
        </div>
    );
    
    return { 
        datosPaginados: data, 
        loading, 
        error, 
        FiltrosUI, 
        PaginacionUI, 
        refetch,
        totalItems 
    };
};