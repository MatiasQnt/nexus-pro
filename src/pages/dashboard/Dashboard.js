import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package } from 'lucide-react';
import { StatCard, Card } from '../../components/ui/ComponentesUI';

const DashboardAdmin = ({ productos, ventas }) => {
    // Usamos useMemo para optimizar el cálculo, solo se recalculará si las ventas cambian.
    const ventasTotales = useMemo(() => 
        ventas.reduce((sum, sale) => sum + parseFloat(sale.final_amount), 0), 
        [ventas]
    );
    
    // Optimizamos el cálculo de los datos para el gráfico
    const datosGrafico = useMemo(() => {
        const ventasPorDia = ventas.reduce((acc, sale) => {
            const fecha = new Date(sale.date_time).toLocaleDateString('es-AR', { weekday: 'short' });
            acc[fecha] = (acc[fecha] || 0) + parseFloat(sale.final_amount);
            return acc;
        }, {});
        // Formateamos los datos para que sean compatibles con la librería de gráficos
        return Object.keys(ventasPorDia).map(dia => ({ name: dia, Ventas: ventasPorDia[dia] }));
    }, [ventas]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Ventas Totales" 
                    value={`$${ventasTotales.toFixed(2)}`} 
                    icon={DollarSign} 
                    color="bg-green-500" 
                />
                <StatCard 
                    title="Transacciones" 
                    value={ventas.length} 
                    icon={ShoppingCart} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Productos Activos" 
                    value={productos.length} 
                    icon={Package} 
                    color="bg-purple-500" 
                />
            </div>
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Ventas de la Semana</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datosGrafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="Ventas" fill="#4f46e5" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export default DashboardAdmin;
