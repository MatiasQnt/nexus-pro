import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, AlertTriangle, Package, Users, Trophy } from 'lucide-react';
import { StatCard, Card } from '../../components/ui/ComponentesUI';

const DashboardAdmin = ({ dashboardData }) => {
    // Extraemos todos los datos necesarios del prop.
    const { kpis, low_stock_products, rankings } = dashboardData;

    // Se extrae la lista de productos más vendidos para usarla más fácilmente.
    const topSoldProducts = rankings?.mas_vendidos || [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            
            {/* Sección de Indicadores Principales (KPIs) - sin cambios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Ventas del Día" 
                    value={`$${(kpis.ventas_del_dia || 0).toFixed(2)}`} 
                    icon={DollarSign} 
                    color="bg-green-500" 
                />
                <StatCard 
                    title="Ganancia Bruta del Día" 
                    value={`$${(kpis.ganancia_bruta_del_dia || 0).toFixed(2)}`}
                    icon={DollarSign} 
                    color="bg-sky-500" 
                />
                <StatCard 
                    title="Ticket Promedio" 
                    value={`$${(kpis.ticket_promedio || 0).toFixed(2)}`} 
                    icon={Users} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Productos Vendidos Hoy" 
                    value={kpis.productos_vendidos || 0} 
                    icon={Package} 
                    color="bg-purple-500" 
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Lista: Productos con Bajo Stock */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-yellow-500" size={24} />
                        <h2 className="text-xl font-bold text-gray-800">Productos con Bajo Stock</h2>
                    </div>
                    {low_stock_products && low_stock_products.length > 0 ? (
                        <ul className="space-y-3">
                            {low_stock_products.map(product => (
                                <li key={product.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">{product.name}</span>
                                    <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                        {product.stock} unid.
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No hay productos con bajo stock.</p>
                    )}
                </Card>
                
                {/* 2. Lista: Top 5 Productos Vendidos */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="text-amber-500" size={24} />
                        <h2 className="text-xl font-bold text-gray-800">Top 5 Productos Vendidos</h2>
                    </div>
                     {topSoldProducts && topSoldProducts.length > 0 ? (
                        <ul className="space-y-3">
                            {topSoldProducts.slice(0, 5).map((product, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">{product.product__name}</span>
                                    <span className="font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                                        {product.value} vendidos
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No hay datos de ventas recientes.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DashboardAdmin;