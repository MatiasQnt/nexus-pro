import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, AlertTriangle, Package, Users, Trophy, PieChart as PieChartIcon } from 'lucide-react';
import { StatCard, Card } from '../../components/ui/ComponentesUI';

// Colores para el gráfico de torta
const COLORS = ['#4f46e5', '#818cf8', '#34d399', '#f59e0b', '#ec4899'];

const DashboardAdmin = ({ dashboardData }) => {
    // Extraemos todos los datos necesarios del prop.
    const { kpis, charts, low_stock_products, rankings } = dashboardData;

    // Preparamos los datos para el gráfico de torta, asegurándonos de que 'name' y 'value' existan.
    const pieChartData = charts?.ventas_por_categoria?.map(item => ({
        name: item.name || 'Sin Categoría',
        value: item.Ventas || 0
    })) || [];

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
            
            {/* --- INICIO DE CORRECCIÓN --- */}
            {/* Nueva sección de gráficos y listas en una cuadrícula de 2x2 con el orden cambiado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Lista: Productos con Bajo Stock (Movido Arriba) */}
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
                
                {/* 2. Lista: Top 5 Productos Vendidos (Movido Arriba) */}
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

                {/* 3. Gráfico de Barras: Ventas Diarias */}
                <Card>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Ventas de los Últimos 30 Días</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={charts.ventas_diarias}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `$${value}`} />
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="Ventas" fill="#4f46e5" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* 4. Gráfico de Torta: Ventas por Categoría */}
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <PieChartIcon className="text-indigo-500" size={24} />
                        <h2 className="text-xl font-bold text-gray-800">Ventas por Categoría</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
            {/* --- FIN DE CORRECCIÓN --- */}
        </div>
    );
};

export default DashboardAdmin;
