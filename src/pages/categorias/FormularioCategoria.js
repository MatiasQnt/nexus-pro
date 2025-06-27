import React, { useState, useEffect } from 'react';
import { Button, Input } from '../../components/ui/ComponentesUI';
import { toast } from 'sonner';

const FormularioCategoria = ({ categoriaInicial, onSave, onCancel }) => {
    const initialState = {
        name: '',
        description: '', // <-- Campo añadido
        is_active: true,
    };
    
    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (categoriaInicial) {
            setFormData({
                name: categoriaInicial.name || '',
                description: categoriaInicial.description || '', // <-- Campo añadido
                is_active: categoriaInicial.is_active ?? true,
            });
        } else {
            setFormData(initialState);
        }
    }, [categoriaInicial]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('El nombre de la categoría es obligatorio.');
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la Categoría </label>
                <Input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1" />
            </div>
            
            {/* --- CAMPO AÑADIDO --- */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                <textarea
                    name="description"
                    id="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
            </div>

            <div className="flex items-center">
                <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Categoría Activa</label>
            </div>

            <div className="pt-5">
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" variant="primary">Guardar Categoría</Button>
                </div>
            </div>
        </form>
    );
};

export default FormularioCategoria;