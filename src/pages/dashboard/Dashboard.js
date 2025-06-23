import React from 'react';
import { DollarSign, AlertTriangle, Package, Users, Trophy } from 'lucide-react';
import { Card } from '../../components/ui/ComponentesUI';

const DashboardAdmin = ({ dashboardData }) => {
    // Si no hay datos, mostramos un estado de carga o vacío.
    if (!dashboardData) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-lg text-gray-500">Cargando datos...</p>
            </div>
        );
    }

    const { kpis, low_stock_products, rankings } = dashboardData;
    const topSoldProducts = rankings?.mas_vendidos || [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            
            {/* Sección de Indicadores Principales (KPIs) - Estilos Modificados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI Card: Ventas del Día */}
                <div className="bg-white border-l-4 border-green-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                    <div className="flex-shrink-0 p-3 rounded-full bg-green-100 text-green-600">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ventas del Día</p>
                        <p className="text-2xl font-bold text-gray-800">${(kpis.ventas_del_dia || 0).toFixed(2)}</p>
                    </div>
                </div>

                {/* KPI Card: Ganancia Bruta */}
                <div className="bg-white border-l-4 border-sky-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                     <div className="flex-shrink-0 p-3 rounded-full bg-sky-100 text-sky-600">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ganancia Bruta</p>
                        <p className="text-2xl font-bold text-gray-800">${(kpis.ganancia_bruta_del_dia || 0).toFixed(2)}</p>
                    </div>
                </div>

                {/* KPI Card: Ticket Promedio */}
                <div className="bg-white border-l-4 border-blue-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                     <div className="flex-shrink-0 p-3 rounded-full bg-blue-100 text-blue-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-gray-800">${(kpis.ticket_promedio || 0).toFixed(2)}</p>
                    </div>
                </div>

                {/* KPI Card: Productos Vendidos */}
                <div className="bg-white border-l-4 border-purple-500 rounded-r-lg shadow-md p-5 flex items-center gap-5">
                     <div className="flex-shrink-0 p-3 rounded-full bg-purple-100 text-purple-600">
                        <Package size={28} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Productos Vendidos</p>
                        <p className="text-2xl font-bold text-gray-800">{kpis.productos_vendidos || 0}</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Lista: Productos con Bajo Stock */}
                <Card>
                    <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
                        <AlertTriangle className="text-yellow-500" size={22} />
                        <h2 className="text-lg font-semibold text-gray-800">Productos con Bajo Stock</h2>
                    </div>
                    {low_stock_products && low_stock_products.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
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
                
                {/* 2. Lista: Top 5 Productos Vendidos */}
                <Card>
                    <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-3">
                        <Trophy className="text-amber-500" size={22} />
                        <h2 className="text-lg font-semibold text-gray-800">Top 5 Productos Vendidos</h2>
                    </div>
                    {topSoldProducts && topSoldProducts.length > 0 ? (
                         <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {topSoldProducts.slice(0, 5).map((product, index) => (
                                <li key={index} className="p-2 flex justify-between items-center text-sm hover:bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-500 w-5 text-center">{index + 1}.</span>
                                        <span className="text-gray-700">{product.product__name}</span>
                                    </div>
                                    <span className="font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                                        {product.value} vendidos
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">No hay datos de ventas recientes.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DashboardAdmin;