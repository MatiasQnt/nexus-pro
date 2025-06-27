import React, { useState, useContext } from 'react';
import { toast } from 'sonner';
import { useServerSidePagination } from '../../hooks/useServerSidePagination';
import { ContextoAuth } from '../../context/AuthContext';

import { Button, Modal } from '../../components/ui/ComponentesUI';
import FiltrosCategorias from './FiltrosCategorias';
import TablaCategorias from './TablaCategorias';
import FormularioCategoria from './FormularioCategoria';
import { PlusCircle } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const GestionCategorias = () => {
    const { tokensAuth } = useContext(ContextoAuth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const {
        datosPaginados: categorias,
        loading,
        error,
        FiltrosUI,
        PaginacionUI,
        refetch,
        totalItems
    } = useServerSidePagination({
        endpoint: 'categories',
        ComponenteFiltros: FiltrosCategorias,
    });

    const handleCreate = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = (categoria) => {
        setEditingCategory(categoria);
        setIsModalOpen(true);
    };

    const handleDelete = (idCategoria, nombreCategoria) => {
        const executeDelete = () => {
            const promesa = fetch(`${API_URL}/categories/${idCategoria}/`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) },
            }).then(res => {
                if (res.status === 200 || res.status === 204) return res;
                return res.json().then(err => Promise.reject(err));
            });

            toast.promise(promesa, {
                loading: 'Eliminando categoría...',
                success: () => {
                    refetch();
                    return 'Operación completada con éxito.';
                },
                error: (err) => `Error: ${JSON.stringify(err)}`,
            });
        };

        toast.warning(
            `¿Seguro que quieres eliminar "${nombreCategoria}"?`,
            {
                description: 'Si la categoría está en uso, solo se desactivará.',
                action: { label: 'Confirmar', onClick: () => executeDelete() },
                cancel: { label: 'Cancelar' },
                duration: 5000,
            }
        );
    };
    
    const handleSave = async (datosFormulario) => {
        const esEdicion = editingCategory !== null;
        const url = esEdicion ? `${API_URL}/categories/${editingCategory.id}/` : `${API_URL}/categories/`;
        const method = esEdicion ? 'PATCH' : 'POST';

        const promesa = fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + String(tokensAuth.access),
            },
            body: JSON.stringify(datosFormulario),
        }).then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
        });

        toast.promise(promesa, {
            loading: esEdicion ? 'Actualizando categoría...' : 'Creando categoría...',
            success: () => {
                refetch(); // <-- La línea clave para refrescar la tabla
                setIsModalOpen(false);
                return `Categoría ${esEdicion ? 'actualizada' : 'creada'} con éxito.`;
            },
            error: (err) => `Error: ${JSON.stringify(err)}`,
        });
    };

    const Titulo = () => (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Categorías</h1>
                <p className="text-gray-500 mt-1">{totalItems} categorías en total</p>
            </div>
            <Button onClick={handleCreate} variant="primary" icon={PlusCircle}>
                Nueva Categoría
            </Button>
        </div>
    );

    return (
        <div className="p-1 md:p-4">
            <Titulo />
            
            {FiltrosUI}
            
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg mt-4">Error: {error}</div>}

            {loading ? (
                <div className="text-center py-10">Cargando categorías...</div>
            ) : (
                <TablaCategorias
                    categorias={categorias}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            
            {!loading && categorias.length > 0 && PaginacionUI}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
            >
                <FormularioCategoria 
                    categoriaInicial={editingCategory}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default GestionCategorias;