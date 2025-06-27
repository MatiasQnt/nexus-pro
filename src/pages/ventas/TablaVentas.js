import React from 'react';
import { Eye, XCircle } from 'lucide-react';
import { Button, Table} from '../../components/ui/ComponentesUI';

const TablaVentas = ({ sales, onSelectSale, onCancelSale }) => {
    const headers = [
        { title: 'ID' },
        { title: 'Fecha' },
        { title: 'Usuario' },
        { title: 'Items' },
        { title: 'Total' },
        { title: 'Estado' },
        { title: 'Acciones' },
    ];

    const renderRow = (venta) => (
        <tr key={venta.id} className="bg-white border-b hover:bg-gray-50">
            <td className="px-6 py-4">#{venta.id}</td>
            <td className="px-6 py-4">{new Date(venta.date_time).toLocaleString('es-AR')}</td>
            <td className="px-6 py-4">{venta.user}</td>
            <td className="px-6 py-4">{venta.details.length}</td>
            <td className="px-6 py-4 font-bold">${parseFloat(venta.final_amount).toFixed(2)}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    venta.status === 'Completada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {venta.status}
                </span>
            </td>
            <td className="px-6 py-4 flex gap-2">
                <Button onClick={() => onSelectSale(venta)} variant="secondary" size="icon" icon={Eye} title="Ver Detalle" />
                {venta.status === 'Completada' && (
                    <Button onClick={() => onCancelSale(venta.id)} variant="danger" size="icon" icon={XCircle} title="Cancelar Venta" />
                )}
            </td>
        </tr>
    );

    return (
        <Table
            headers={headers}
            data={sales}
            renderRow={renderRow}
        />
    );
};

export default TablaVentas;