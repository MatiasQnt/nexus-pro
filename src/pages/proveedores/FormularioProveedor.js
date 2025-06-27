import React, { useState, useEffect } from 'react';
import { Button, Input } from '../../components/ui/ComponentesUI';
import { toast } from 'sonner';

const FormularioProveedor = ({ proveedorInicial, onSave, onCancel }) => {
    const initialState = {
        name: '',
        contact_person: '',
        phone_number: '',
        email: '',
        is_active: true,
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (proveedorInicial) {
            setFormData({
                name: proveedorInicial.name || '',
                contact_person: proveedorInicial.contact_person || '',
                phone_number: proveedorInicial.phone_number || '',
                email: proveedorInicial.email || '',
                is_active: proveedorInicial.is_active ?? true,
            });
        } else {
            setFormData(initialState);
        }
    }, [proveedorInicial]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('El nombre del proveedor es obligatorio.');
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Proveedor</label>
                    <Input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                    <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">Persona de Contacto</label>
                    <Input type="text" name="contact_person" id="contact_person" value={formData.contact_person} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <Input type="text" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleChange} required className="mt-1" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Opcional)</label>
                    <Input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1" />
                </div>
            </div>
            
            <div className="flex items-center pt-2">
                <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Proveedor Activo
                </label>
            </div>

            <div className="pt-5">
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary">
                        Guardar Proveedor
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default FormularioProveedor;