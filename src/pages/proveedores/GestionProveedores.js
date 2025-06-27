import React, { useState, useContext } from 'react';
import { toast } from 'sonner';
import { useServerSidePagination } from '../../hooks/useServerSidePagination';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal } from '../../components/ui/ComponentesUI';
import { PlusCircle } from 'lucide-react';

// Importa los nuevos componentes específicos de Proveedores
import FiltrosProveedores from './FiltrosProveedores';
import TablaProveedores from './TablaProveedores';
import FormularioProveedor from './FormularioProveedor';

const API_URL = 'http://127.0.0.1:8000/api';

const GestionProveedores = () => {
    const { tokensAuth } = useContext(ContextoAuth);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Cambiamos el nombre del estado para reflejar que editamos un proveedor
    const [editingProvider, setEditingProvider] = useState(null);

    // Usamos el hook de paginación con el endpoint y los filtros de proveedores
    const {
        datosPaginados: proveedores,
        loading,
        error,
        FiltrosUI,
        PaginacionUI,
        refetch,
        totalItems
    } = useServerSidePagination({
        endpoint: 'providers', // <-- Cambiamos el endpoint a 'providers'
        ComponenteFiltros: FiltrosProveedores,
        initialFilters: { search: '' }, // Filtro inicial
    });

    const handleCreate = () => {
        setEditingProvider(null); // Limpiamos cualquier proveedor en edición
        setIsModalOpen(true);
    };

    const handleEdit = (proveedor) => {
        setEditingProvider(proveedor); // Guardamos el proveedor a editar
        setIsModalOpen(true);
    };

    const handleDelete = (idProveedor, nombreProveedor) => {
        const executeDelete = () => {
            const promesa = fetch(`${API_URL}/providers/${idProveedor}/`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) },
            }).then(res => {
                // El backend devuelve 200 si lo desactiva, y 204 si lo borra. Ambos son OK.
                if (res.ok) return res;
                return res.json().then(err => Promise.reject(err));
            });

            toast.promise(promesa, {
                loading: 'Eliminando proveedor...',
                success: () => {
                    refetch(); // Recargamos los datos
                    return 'Operación completada con éxito.';
                },
                error: (err) => `Error: ${err.detail || JSON.stringify(err)}`,
            });
        };

        toast.warning(
            `¿Seguro que quieres eliminar a "${nombreProveedor}"?`,
            {
                description: 'Si el proveedor está en uso, solo se desactivará.',
                action: { label: 'Confirmar', onClick: () => executeDelete() },
                cancel: { label: 'Cancelar' },
                duration: 5000,
            }
        );
    };
    
    const handleSave = async (datosFormulario) => {
        const esEdicion = editingProvider !== null;
        const url = esEdicion ? `${API_URL}/providers/${editingProvider.id}/` : `${API_URL}/providers/`;
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
            loading: esEdicion ? 'Actualizando proveedor...' : 'Creando proveedor...',
            success: () => {
                refetch();
                setIsModalOpen(false);
                return `Proveedor ${esEdicion ? 'actualizado' : 'creado'} con éxito.`;
            },
            error: (err) => `Error: ${JSON.stringify(err)}`,
        });
    };

    // Componente de Título, adaptado para proveedores
    const Titulo = () => (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h1>
                <p className="text-gray-500 mt-1">{totalItems} proveedores en total</p>
            </div>
            <Button onClick={handleCreate} variant="primary" icon={PlusCircle}>
                Nuevo Proveedor
            </Button>
        </div>
    );

    return (
        <div className="p-1 md:p-4">
            <Titulo />
            
            {FiltrosUI}
            
            {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg mt-4">Error: {error}</div>}

            {loading ? (
                <div className="text-center py-10">Cargando proveedores...</div>
            ) : (
                <TablaProveedores
                    proveedores={proveedores}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
            
            {!loading && proveedores.length > 0 && PaginacionUI}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProvider ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
            >
                <FormularioProveedor 
                    proveedorInicial={editingProvider}
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default GestionProveedores;
