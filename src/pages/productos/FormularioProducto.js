import React, { useState, useEffect, useContext } from 'react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/ComponentesUI';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

const FormularioProducto = ({ productoInicial, onSave, onCancel }) => {
    const { tokensAuth } = useContext(ContextoAuth);

    const getInitialState = () => ({
        name: '',
        sku: '',
        description: '',
        cost_price: '',
        sale_price: '',
        stock: '1', 
        category: '',
        provider: '',
        estado: true,
    });

    const [formData, setFormData] = useState(getInitialState());
    const [listas, setListas] = useState({ categories: [], providers: [] });
    const [loadingListas, setLoadingListas] = useState(true);

    useEffect(() => {
        const fetchListas = async () => {
            if (!tokensAuth) return;
            setLoadingListas(true);
            try {
                const [catRes, provRes] = await Promise.all([
                    fetch(`${API_URL}/categories/`, { headers: { 'Authorization': `Bearer ${tokensAuth.access}` } }),
                    fetch(`${API_URL}/providers/`, { headers: { 'Authorization': `Bearer ${tokensAuth.access}` } })
                ]);
                const categories = await catRes.json();
                const providers = await provRes.json();
                setListas({ 
                    categories: categories.results || [], 
                    providers: providers.results || [] 
                });
            } catch (error) {
                toast.error('No se pudieron cargar las categorías y proveedores.');
                console.error(error);
            } finally {
                setLoadingListas(false);
            }
        };
        fetchListas();
    }, [tokensAuth]);

    useEffect(() => {
        if (productoInicial) {
            setFormData({
                name: productoInicial.name || '',
                sku: productoInicial.sku || '',
                description: productoInicial.description || '',
                cost_price: productoInicial.cost_price || '',
                sale_price: productoInicial.sale_price || '',
                stock: productoInicial.stock || '1',
                category: productoInicial.category?.id || '',
                provider: productoInicial.provider?.id || '',
                estado: productoInicial.estado === 'activo',
            });
        } else {
            setFormData(getInitialState());
        }
    }, [productoInicial]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.sale_price || !formData.cost_price || !formData.stock) {
            toast.error('Nombre, Precios y Stock son obligatorios.');
            return;
        }
        if (parseFloat(formData.stock) <= 0) {
            toast.error('El stock debe ser como mínimo 1.');
            return;
        }
        onSave(formData);
    };

    if (loadingListas) {
        return <p>Cargando datos del formulario...</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto </label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU (Opcional)</label>
                    <input type="text" name="sku" id="sku" value={formData.sku} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div>
                    <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700">Precio de Venta </label>
                    <input type="number" step="0.01" name="sale_price" id="sale_price" value={formData.sale_price} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">Precio de Costo </label>
                    <input type="number" step="0.01" name="cost_price" id="cost_price" value={formData.cost_price} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Actual </label>
                    <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría (Opcional)</label>
                    <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Sin categoría --</option>
                        {listas.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Proveedor (Opcional)</label>
                    <select name="provider" id="provider" value={formData.provider} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Sin proveedor --</option>
                        {listas.providers.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center">
                    {/* CORRECCIÓN: Campo 'estado' como checkbox */}
                    <input id="estado" name="estado" type="checkbox" checked={formData.estado} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="estado" className="ml-2 block text-sm text-gray-900">Producto Activo</label>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
            </div>

            <div className="pt-5">
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" variant="primary">Guardar Producto</Button>
                </div>
            </div>
        </form>
    );
};

export default FormularioProducto;