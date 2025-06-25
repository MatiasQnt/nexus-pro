import React, { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, Package, Users, Activity } from 'lucide-react';
import { Card } from '../../components/ui/ComponentesUI';


const DashboardAdmin = ({ dashboardData }) => {
    // Estado para guardar los datos de la cotización del dólar
    const [dolarData, setDolarData] = useState(null);
    const [loadingDolar, setLoadingDolar] = useState(true);

    useEffect(() => {
        const fetchDolarData = async () => {
            setLoadingDolar(true);
            try {
                const response = await fetch('http://127.0.0.1:8000/api/cotizaciones/');

                if (!response.ok) {
                    throw new Error('Error del servidor al obtener las cotizaciones');
                }
                
                const data = await response.json();

                setDolarData({
                    blue: data.blue,
                    oficial: data.oficial,
                    mep: data.mep,
                    lastUpdate: new Date(data.last_update)
                });

            } catch (error) {
                console.error("No se pudo cargar la cotización del dólar desde el backend:", error);
                setDolarData(null); 
            } finally {
                setLoadingDolar(false);
            }
        };

        fetchDolarData();
    }, []); 


    if (!dashboardData) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
                <p className="text-lg text-gray-500">Cargando datos...</p>
            </div>
        );
    }

    const { kpis, low_stock_products } = dashboardData;
    
    // Componente para una fila de cotización, para no repetir código.
    const CotizacionRow = ({ label, values, colorClass }) => (
        <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                <span className="font-medium text-gray-700">{label}</span>
            </div>
            <div className="flex gap-5 text-right">
                <div>
                    <span className="text-xs text-gray-400 block">Compra</span>
                    <p className="font-bold text-lg text-gray-800">${values?.value_buy ?? '---'}</p>
                </div>
                <div>
                    <span className="text-xs text-gray-400 block">Venta</span>
                    <p className="font-bold text-lg text-gray-800">${values?.value_sell ?? '---'}</p>
                </div>
            </div>
        </div>
    );


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            
            {/* Fila de KPIs principales del negocio */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border-l-4 border-green-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                    <div className="flex-shrink-0 p-3 rounded-full bg-green-100 text-green-600"><DollarSign size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ventas del Día</p>
                        <p className="text-2xl font-bold text-gray-800">${(kpis.ventas_del_dia || 0).toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white border-l-4 border-sky-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                    <div className="flex-shrink-0 p-3 rounded-full bg-sky-100 text-sky-600"><DollarSign size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ganancia Bruta</p>
                        <p className="text-2xl font-bold text-gray-800">${(kpis.ganancia_bruta_del_dia || 0).toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white border-l-4 border-blue-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                    <div className="flex-shrink-0 p-3 rounded-full bg-blue-100 text-blue-600"><Users size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-gray-800">${(kpis.ticket_promedio || 0).toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white border-l-4 border-purple-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                    <div className="flex-shrink-0 p-3 rounded-full bg-purple-100 text-purple-600"><Package size={28} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Productos Vendidos</p>
                        <p className="text-2xl font-bold text-gray-800">{kpis.productos_vendidos || 0}</p>
                    </div>
                </div>
            </div>
            
            {/* --- SECCIÓN INFERIOR: STOCK Y COTIZACIONES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
                        <AlertTriangle className="text-yellow-500" size={22} />
                        <h2 className="text-lg font-semibold text-gray-800">Productos con Bajo Stock</h2>
                    </div>
                    {low_stock_products && low_stock_products.length > 0 ? (
                        <ul className="space-y-2 max-h-[26rem] overflow-y-auto pr-2">
                            {low_stock_products.map(product => (
                                <li key={product.id} className="p-2 flex justify-between items-center text-sm hover:bg-gray-50 rounded-md">
                                    <span className="text-gray-700">{product.name}</span>
                                    <span className="font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                                        {product.stock} unid.
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">¡Felicidades! No hay productos con bajo stock.</p>
                    )}
                </Card>
                
                {/* Tarjeta de cotizaciones que ahora usa el Card importado */}
                <Card>
                    <div className="flex items-center gap-3 mb-2">
                         <Activity className="text-gray-500" size={22} />
                        <h2 className="text-lg font-semibold text-gray-800">Cotizaciones del Dólar</h2>
                    </div>
                    {loadingDolar ? (
                        <div className="text-center text-sm text-gray-400 py-4">Cargando cotizaciones...</div>
                    ) : dolarData ? (
                        <div className="divide-y divide-gray-100">
                           <CotizacionRow label="Dólar Blue" values={dolarData.blue} colorClass="bg-cyan-500" />
                           <CotizacionRow label="Dólar Oficial" values={dolarData.oficial} colorClass="bg-teal-500" />
                           <CotizacionRow label="Dólar MEP" values={dolarData.mep} colorClass="bg-indigo-500" />
                           <p className="text-xs text-gray-400 text-center pt-4">
                                Última actualización: {dolarData.lastUpdate.toLocaleString('es-AR')}
                           </p>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-red-500 py-4">No se pudieron cargar las cotizaciones.</div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DashboardAdmin;
