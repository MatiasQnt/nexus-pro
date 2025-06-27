import React from 'react';
import { Button } from '../../components/ui/ComponentesUI';

const FiltrosVentas = ({ setFiltros, filtros, resetFiltros }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Si el valor de estado es "Todos", se envía un string vacío para no filtrar
        const finalValue = name === 'status' && value === 'Todos' ? '' : value;
        setFiltros(prev => ({ ...prev, [name]: finalValue }));
    };
    
    // Opciones para el filtro de estado
    const opcionesEstado = [
        { label: 'Todos los estados', value: 'Todos' },
        { label: 'Completadas', value: 'Completada' },
        { label: 'Canceladas', value: 'Cancelada' },
    ];

    return (
        <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
                <label htmlFor="date_time__date__gte" className="block text-sm font-medium text-gray-700">Desde</label>
                <input id="date_time__date__gte" type="date" name="date_time__date__gte" value={filtros.date_time__date__gte || ''} onChange={handleInputChange} className="mt-1 p-2 border rounded-lg w-full"/>
            </div>
            <div>
                <label htmlFor="date_time__date__lte" className="block text-sm font-medium text-gray-700">Hasta</label>
                <input id="date_time__date__lte" type="date" name="date_time__date__lte" value={filtros.date_time__date__lte || ''} onChange={handleInputChange} className="mt-1 p-2 border rounded-lg w-full"/>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado</label>
                <select id="status" name="status" value={filtros.status || 'Todos'} onChange={handleInputChange} className="mt-1 p-2 border rounded-lg w-full">
                    {opcionesEstado.map(opcion => (
                        <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                    ))}
                </select>
            </div>
            <Button onClick={resetFiltros} variant="secondary">Limpiar Filtros</Button>
        </div>
    );
};

export default FiltrosVentas;