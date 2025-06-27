import React from 'react';
import { Button, Badge } from '../../components/ui/ComponentesUI';
import { Edit, Trash2 } from 'lucide-react';

const TablaCategorias = ({ categorias, onEdit, onDelete }) => {
  if (!categorias || categorias.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-gray-50 rounded-lg mt-4">
        <h3 className="text-lg font-medium text-gray-700">No se encontraron categorías</h3>
        <p className="text-sm text-gray-500">
          Intenta ajustar tu búsqueda o crea una nueva categoría.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-1/4">Nombre</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/2">Descripción</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{categoria.name}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <p className="truncate" title={categoria.description}>
                      {categoria.description || '-'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <Badge variant={categoria.is_active ? 'default' : 'destructive'}>
                      {categoria.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="icon" onClick={() => onEdit(categoria)} icon={Edit} />
                      <Button variant="destructive" size="icon" onClick={() => onDelete(categoria.id, categoria.name)} icon={Trash2} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TablaCategorias;