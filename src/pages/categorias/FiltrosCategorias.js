import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../../components/ui/ComponentesUI';
import { Button } from '../../components/ui/ComponentesUI';

const FiltrosCategorias = ({ setFiltros, filtros, resetFiltros }) => {
    const [searchTerm, setSearchTerm] = useState(filtros.search || '');

    // Usamos una 'ref' para saber si es la primera vez que el componente se renderiza.
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Si es la primera vez que se renderiza, no hacemos nada.
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Efecto con debounce para la búsqueda
        const handler = setTimeout(() => {
            setFiltros(prevFiltros => ({ ...prevFiltros, search: searchTerm }));
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const handleReset = () => {
        setSearchTerm('');
        resetFiltros();
    };

    // Sincroniza el estado local si el filtro global cambia desde afuera
    useEffect(() => {
        setSearchTerm(filtros.search || '');
    }, [filtros.search]);

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex-grow min-w-[250px]">
                <Input
                    type="text"
                    placeholder="Buscar por nombre de categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </div>
            
            <div className="flex-shrink-0">
                <Button onClick={handleReset} variant="outline">Limpiar</Button>
            </div>
        </div>
    );
};

export default FiltrosCategorias;