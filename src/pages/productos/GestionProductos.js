import React, { useState, useContext } from 'react';
import { toast } from 'sonner';
import { useServerSidePagination } from '../../hooks/useServerSidePagination';
import { ContextoAuth } from '../../context/AuthContext';

import { Button, Modal } from '../../components/ui/ComponentesUI';
import FiltrosProductos from './FiltrosProductos';
import TablaProductos from './TablaProductos';
import FormularioProducto from './FormularioProducto';
import { PlusCircle } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const GestionProductos = () => {
    const { tokensAuth } = useContext(ContextoAuth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const {
        datosPaginados: productos,
        loading,
        error,
        FiltrosUI,
        PaginacionUI,
        refetch,
        totalItems
    } = useServerSidePagination({
        endpoint: 'products',
        ComponenteFiltros: FiltrosProductos,
    });

    const handleCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (producto) => {
        setEditingProduct(producto);
        setIsModalOpen(true);
    };

    const handleDelete = (idProducto, nombreProducto) => {
        const executeDelete = () => {
            const promesa = fetch(`${API_URL}/products/${idProducto}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + String(tokensAuth.access),
                },
            }).then(res => {
                if (res.status === 200 || res.status === 204) return res;
                return res.json().then(err => Promise.reject(err));
            });

            toast.promise(promesa, {
                loading: 'Eliminando producto...',
                success: () => {
                    refetch();
                    return 'Operación completada con éxito.';
                },
                error: (err) => `Error: ${JSON.stringify(err)}`
            });
        };

        // Mostramos la notificación de confirmación de Sonner
        toast.warning(
            `¿Seguro que quieres eliminar "${nombreProducto}"?`,
            {
                description: 'Esta acción podría ser irreversible.',
                action: {
                    label: 'Confirmar',
                    onClick: () => executeDelete(),
                },
                cancel: {
                    label: 'Cancelar',
                },
                duration: 5000,
            }
        );
    };
    
    const handleSave = async (datosFormulario) => {
        const esEdicion = editingProduct !== null;
        const url = esEdicion ? `${API_URL}/products/${editingProduct.id}/` : `${API_URL}/products/`;
        const method = esEdicion ? 'PATCH' : 'POST';

        const datosParaAPI = {
            ...datosFormulario,
            estado: datosFormulario.estado ? 'activo' : 'inactivo',
            cost_price: parseFloat(datosFormulario.cost_price) || 0,
            sale_price: parseFloat(datosFormulario.sale_price) || 0,
            stock: parseInt(datosFormulario.stock, 10) || 0,
            sku: datosFormulario.sku === '' ? null : datosFormulario.sku,
            category: datosFormulario.category === '' ? null : datosFormulario.category,
            provider: datosFormulario.provider === '' ? null : datosFormulario.provider,

        };

        const promesa = fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + String(tokensAuth.access),
            },
            body: JSON.stringify(datosParaAPI), // <-- Enviamos los datos convertidos
        }).then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
        });

        toast.promise(promesa, {
            loading: esEdicion ? 'Actualizando producto...' : 'Creando producto...',
            success: () => {
                refetch();
                setIsModalOpen(false);
                return `Producto ${esEdicion ? 'actualizado' : 'creado'} con éxito.`;
            },
            error: (err) => {
                if (err && err.name && err.name.length > 0) {
                    return `Error de validación: ${err.name[0]}`;
                }
                return `Error: ${JSON.stringify(err)}`;
            }
        });
    };

    const Titulo = () => (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
                <p className="text-gray-500 mt-1">{totalItems} productos en total</p>
            </div>
            <Button onClick={handleCreate} variant="primary" icon={PlusCircle}>
                Nuevo Producto
            </Button>
        </div>
    );

    return (
        <div className="p-1 md:p-4">
            <Titulo />
            
            {FiltrosUI}
            
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg mt-4">Error: {error}</div>}

            {loading ? (
                <div className="text-center py-10">Cargando productos...</div>
            ) : (
                <TablaProductos
                    productos={productos}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            
            {!loading && productos.length > 0 && PaginacionUI}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
            >
                <FormularioProducto 
                    productoInicial={editingProduct}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default GestionProductos;