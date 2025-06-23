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
    
    const renderDetalleVenta = () => {
        if (!ventaSeleccionada) return null;

        const subtotal = parseFloat(ventaSeleccionada.total_amount);
        const totalFinal = parseFloat(ventaSeleccionada.final_amount);
        const ajuste = totalFinal - subtotal;
        const porcentajeAjuste = subtotal > 0 ? (Math.abs(ajuste) / subtotal) * 100 : 0;

        const FilaResumen = ({ label, value, className = '', valueClassName = '' }) => (
            <div className={`flex justify-between items-center py-2 ${className}`}>
                <span className="text-sm">{label}</span>
                <span className={`text-sm font-medium ${valueClassName}`}>{value}</span>
            </div>
        );

        return (
            <div className="text-gray-800">
                <div className="mb-4">
                    <h3 className="text-2xl font-bold">Detalle de Venta</h3>
                    <p className="text-sm text-gray-500">
                        ID: #{ventaSeleccionada.id} &bull; {new Date(ventaSeleccionada.date_time).toLocaleString('es-AR')}
                    </p>
                </div>

                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase pb-2 border-b">
                    <span className="w-8">Cant.</span>
                    <span className="flex-1 ml-4">Producto</span>
                    <span className="w-24 text-right">Subtotal</span>
                </div>

                <div className="space-y-2 py-2 max-h-48 overflow-y-auto">
                    {ventaSeleccionada.details.map(detalle => (
                        <div key={detalle.product.id} className="flex justify-between items-start py-1">
                             <span className="w-8 text-sm text-gray-600">{detalle.quantity}x</span>
                             <div className="flex-1 ml-4">
                                <p className="font-medium text-sm">{detalle.product.name}</p>
                                {detalle.product.description && <p className="text-xs text-gray-500">{detalle.product.description}</p>}
                             </div>
                             <span className="w-24 text-right text-sm font-semibold">${(detalle.quantity * parseFloat(detalle.unit_price)).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t space-y-1">
                    <FilaResumen label="Subtotal" value={`$${subtotal.toFixed(2)}`} valueClassName="text-gray-800" />
                    <FilaResumen label="Método de Pago" value={ventaSeleccionada.payment_method} valueClassName="text-gray-800" />
                    
                    {ajuste !== 0 && (
                        <FilaResumen 
                            label={ajuste < 0 ? `Descuento (${porcentajeAjuste.toFixed(2)}%)` : `Recargo (${porcentajeAjuste.toFixed(2)}%)`}
                            value={`${ajuste.toFixed(2)}`}
                            className={ajuste < 0 ? 'text-green-600' : 'text-red-600'}
                            valueClassName="font-bold"
                        />
                    )}
                    
                    <div className="flex justify-between items-center pt-3 mt-2 border-t">
                        <span className="text-lg font-bold">Total Final</span>
                        <span className="text-lg font-bold">${totalFinal.toFixed(2)}</span>
                    </div>
                </div>

                 <div className="mt-6 flex justify-end">
                    <Button onClick={() => setVentaSeleccionada(null)} variant="secondary">Cerrar</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Historial de Ventas</h1>
            
            {FiltrosUI}

            {datosPaginados.length > 0 ? (
                <>
                    <Table
                        headers={[
                            { title: 'ID' },
                            { title: 'Fecha' },
                            { title: 'Usuario' },
                            { title: 'Items' },
                            { title: 'Total' },
                            { title: 'Estado' },
                            { title: 'Acciones' }
                        ]}
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

            <Modal isOpen={!!ventaSeleccionada} onClose={() => setVentaSeleccionada(null)}>
                {renderDetalleVenta()}
            </Modal>
        </div>
    );
};

export default GestionVentas;