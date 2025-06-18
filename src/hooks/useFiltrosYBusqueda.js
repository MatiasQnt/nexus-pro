import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/ComponentesUI';

export const useFiltrosYBusqueda = ({
    items,
    itemsPorPagina = 10,
    logicaDeFiltro,
    ComponenteFiltros,
    filtrosIniciales,
}) => {
    const [paginaActual, setPaginaActual] = useState(1);
    const [filtros, setFiltros] = useState(filtrosIniciales);

    const itemsFiltrados = useMemo(() => {
        if (typeof logicaDeFiltro !== 'function') {
            console.error("Hook useFiltrosYBusqueda: 'logicaDeFiltro' no es una función.");
            return items;
        }
        return logicaDeFiltro(items, filtros);
    }, [items, filtros, logicaDeFiltro]);

    const totalPaginas = Math.ceil(itemsFiltrados.length / itemsPorPagina);

    const datosPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return itemsFiltrados.slice(inicio, fin);
    }, [paginaActual, itemsFiltrados, itemsPorPagina]);

    const irAPagina = (pagina) => {
        // CORRECCIÓN: Se cambió 'nuevasPagina' por 'nuevaPagina' para que coincida con el nombre de la variable.
        const nuevaPagina = Math.max(1, Math.min(pagina, totalPaginas || 1));
        setPaginaActual(nuevaPagina);
    };

    const handleSetFiltros = (nuevosFiltros) => {
        setFiltros(nuevosFiltros);
        irAPagina(1);
    };

    const resetFiltros = () => {
        setFiltros(filtrosIniciales);
        irAPagina(1);
    };

    const FiltrosUI = (
        <ComponenteFiltros setFiltros={handleSetFiltros} filtros={filtros} resetFiltros={resetFiltros} />
    );

    const PaginacionUI = (
        <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-700">
                Mostrando {itemsFiltrados.length > 0 ? ((paginaActual - 1) * itemsPorPagina) + 1 : 0}
                - {Math.min(paginaActual * itemsPorPagina, itemsFiltrados.length)} de {itemsFiltrados.length} resultados
            </span>
            <div className="flex gap-2">
                <Button onClick={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1}>
                    Anterior
                </Button>
                <span className="self-center px-4 py-2 text-sm">
                    Página {paginaActual} de {totalPaginas > 0 ? totalPaginas : 1}
                </span>
                <Button onClick={() => irAPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas}>
                    Siguiente
                </Button>
            </div>
        </div>
    );

    return { datosPaginados, FiltrosUI, PaginacionUI };
};
