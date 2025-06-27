import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../../components/ui/ComponentesUI';
import { Button } from '../../components/ui/ComponentesUI';

const FiltrosProductos = ({ setFiltros, filtros, resetFiltros }) => {
    const [searchTerm, setSearchTerm] = useState(filtros.search || '');

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const handler = setTimeout(() => {
            setFiltros(prevFiltros => ({ ...prevFiltros, search: searchTerm }));
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const handleReset = () => {
        setSearchTerm('');
        resetFiltros();
    };

    useEffect(() => {
        setSearchTerm(filtros.search || '');
    }, [filtros.search]);

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex-grow min-w-[250px]">
                <Input
                    type="text"
                    placeholder="Buscar por Nombre, SKU o Descripción..."
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

export default FiltrosProductos;