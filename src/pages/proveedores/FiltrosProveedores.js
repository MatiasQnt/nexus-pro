import React, { useState, useEffect, useRef } from 'react';
import { Input, Button } from '../../components/ui/ComponentesUI';

const FiltrosProveedores = ({ setFiltros, filtros, resetFiltros }) => {
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

        return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    placeholder="Buscar por nombre, contacto, email..."
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

export default FiltrosProveedores;