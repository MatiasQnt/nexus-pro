import React, { useState, useContext } from 'react';
import { Eye, XCircle } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Modal, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';
import { toast } from 'sonner'; 

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO ---
const FiltrosVentas = ({ setFiltros, filtros, resetFiltros }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };
    return (
        <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div>
                <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700">Desde</label>
                <input id="fechaDesde" type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleInputChange} className="mt-1 p-2 border rounded-lg w-full"/>
            </div>
            <div>
                <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700">Hasta</label>
                <input id="fechaHasta" type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleInputChange} className="mt-1 p-2 border rounded-lg w-full"/>
            </div>
            <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                <select id="estado" name="estado" value={filtros.estado} onChange={handleInputChange} className="mt-1 p-2 border rounded-lg w-full">
                    <option value="Todos">Todos</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                </select>
            </div>
            <Button onClick={resetFiltros} variant="secondary">Limpiar Filtros</Button>
        </div>
    );
};
const logicaFiltroVentas = (ventas, filtros) => {
    const { fechaDesde, fechaHasta, estado } = filtros;
    return ventas.filter(venta => {
        const fechaVenta = new Date(venta.date_time.split('T')[0]);
        const desde = fechaDesde ? new Date(fechaDesde) : null;
        const hasta = fechaHasta ? new Date(fechaHasta) : null;
        if (desde && fechaVenta < desde) return false;
        if (hasta && fechaVenta > hasta) return false;
        if (estado !== 'Todos' && venta.status !== estado) return false;
        return true;
    });
};

// --- COMPONENTE PRINCIPAL ---
const GestionVentas = ({ ventas, obtenerDatos }) => {
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const { tokensAuth } = useContext(ContextoAuth);

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: ventas,
        itemsPorPagina: 15,
        logicaDeFiltro: logicaFiltroVentas,
        ComponenteFiltros: FiltrosVentas,
        filtrosIniciales: { fechaDesde: '', fechaHasta: '', estado: 'Todos' }
    });

    const cancelarVenta = async (idVenta) => {
        const ejecutarCancelacion = () => {
            const promesa = fetch(`${API_URL}/sales/${idVenta}/cancel/`, {
                method: 'PATCH', 
                headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) }
            }).then(res => {
                if (!res.ok) return res.json().then(err => Promise.reject(err));
                return res.json();
            });

            toast.promise(promesa, {
                loading: 'Cancelando venta...',
                success: (data) => {
                    obtenerDatos();
                    return data.detail || 'Venta cancelada con éxito.';
                },
                error: (err) => `Error: ${err.detail || 'No se pudo cancelar la venta.'}`
            });
        };

        toast("Confirmar Cancelación", {
            description: `¿Seguro que quieres cancelar la venta #${idVenta}? El stock de los productos será restaurado.`,
            action: {
                label: "Sí, cancelar",
                onClick: () => ejecutarCancelacion()
            },
            cancel: {
                label: "No"
            },
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Historial de Ventas</h1>
            
            {FiltrosUI}

            {datosPaginados.length > 0 ? (
                <>
                    <Table
                        headers={['ID', 'Fecha', 'Usuario', 'Items', 'Total', 'Estado', 'Acciones']}
                        data={datosPaginados}
                        renderRow={(venta) => (
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
                                    <Button onClick={() => setVentaSeleccionada(venta)} variant="secondary" size="sm" icon={Eye} />
                                    {venta.status === 'Completada' && (
                                        <Button onClick={() => cancelarVenta(venta.id)} variant="danger" size="sm" icon={XCircle} title="Cancelar Venta"/>
                                    )}
                                </td>
                            </tr>
                        )}
                    />
                    {PaginacionUI}
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">No se encontraron ventas</h3>
                    <p className="text-gray-500 mt-1">Intenta cambiar los filtros de fecha o estado para encontrar resultados.</p>
                </div>
            )}

            {ventaSeleccionada && (
                <Modal isOpen={!!ventaSeleccionada} onClose={() => setVentaSeleccionada(null)} title={`Detalle de Venta #${ventaSeleccionada.id}`}>
                    <div>
                        <ul className="space-y-2">
                            {ventaSeleccionada.details.map(detalle => (
                                <li key={detalle.product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                    <span>{detalle.quantity} x {detalle.product.name}</span>
                                    <span>${(detalle.quantity * parseFloat(detalle.unit_price)).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 pt-2 border-t text-right">
                            <p>Subtotal: ${parseFloat(ventaSeleccionada.total_amount).toFixed(2)}</p>
                            <p>Método de Pago: {ventaSeleccionada.payment_method}</p>
                            <p className="font-bold text-lg">Total Final: ${parseFloat(ventaSeleccionada.final_amount).toFixed(2)}</p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GestionVentas;