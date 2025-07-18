import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ContextoAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/ui/ComponentesUI';
import { DollarSign, ShoppingCart, Users, TrendingUp, Star, Award, FileDown, Layers, Bed, BarChart3, Clock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

// --- SUB-COMPONENTES (Sin cambios) ---
const KpiCard = ({ title, value, icon: Icon, formatAsCurrency = false }) => {
    const formattedValue = formatAsCurrency 
        ? `$${parseFloat(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : parseFloat(value || 0).toLocaleString('es-AR');
    return (
        <Card className="p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <Icon className="text-gray-400" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formattedValue}</p>
        </Card>
    );
};
const RankingTable = ({ title, data, valueLabel, icon: Icon, formatAsCurrency = false }) => (
    <Card className="p-6">
        <div className="flex items-center mb-4">
            <Icon className="text-indigo-500 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        </div>
        <div className="space-y-2">
            {data.length > 0 ? data.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 text-sm">
                    <span className="text-gray-600">{index + 1}. {item.product__name || item.name}</span>
                    <span className="font-bold text-gray-800">
                        {formatAsCurrency 
                            ? `$${parseFloat(item.value).toLocaleString('es-AR', {minimumFractionDigits: 2})}`
                            : `${parseInt(item.value)} ${valueLabel}`
                        }
                    </span>
                </div>
            )) : <p className="text-gray-400 text-center p-4">No hay datos suficientes.</p>}
        </div>
    </Card>
);
const DormantProductsTable = ({ title, data, icon: Icon }) => (
     <Card className="p-6">
        <div className="flex items-center mb-4">
            <Icon className="text-orange-500 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">Top 10 productos con stock que no se han vendido en los últimos 60 días.</p>
        <div className="space-y-2">
            {data.length > 0 ? data.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 text-sm">
                    <span className="text-gray-600">{item.name} <span className="text-xs text-gray-400">({item.sku})</span></span>
                    <span className="font-bold text-gray-800">Stock: {item.stock}</span>
                </div>
            )) : <p className="text-gray-400 text-center p-4">¡Felicidades! Todos los productos tienen buena rotación.</p>}
        </div>
    </Card>
);

// --- COMPONENTE EXPORTTOOL (Sin cambios) ---
const ExportTool = ({ tokensAuth }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!startDate || !endDate) {
            toast.error('Por favor, selecciona un rango de fechas.');
            return;
        }
        
        const url = new URL(`${API_URL}/reports/export-sales/`);
        url.searchParams.append('start_date', startDate);
        url.searchParams.append('end_date', endDate);
        
        const promesa = fetch(url, { headers: { 'Authorization': `Bearer ${String(tokensAuth.access)}` }})
            .then(async res => {
                if (!res.ok) {
                    const errorData = await res.json();
                    return Promise.reject(new Error(errorData.error || 'No se pudo generar el reporte.'));
                }
                return res.blob();
            });

        setExporting(true);
        toast.promise(promesa, {
            loading: 'Generando reporte...',
            success: (blob) => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = downloadUrl;
                a.download = `reporte_ventas_${startDate}_a_${endDate}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                a.remove();
                return '¡Reporte descargado con éxito!';
            },
            error: (err) => err.message,
            finally: () => setExporting(false)
        });
    };

    return (
        <Card className="p-6 bg-gray-50">
            <div className="flex items-center mb-4">
                <FileDown className="text-indigo-500 mr-3" size={24} />
                <h3 className="text-lg font-semibold text-gray-700">Herramientas para el Contador</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
                Selecciona un rango de fechas para generar un reporte de ventas en formato Excel, con el IVA desglosado.
            </p>
            <div className="flex flex-wrap items-end gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Desde</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg w-full mt-1" />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Hasta</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg w-full mt-1" />
                </div>
                <Button onClick={handleExport} disabled={!startDate || !endDate || exporting}>
                    {exporting ? 'Generando...' : 'Exportar a Excel'}
                </Button>
            </div>
        </Card>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ReportesYEstadisticas = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [periodoVentas, setPeriodoVentas] = useState('daily');
    const { tokensAuth } = useContext(ContextoAuth);

    useEffect(() => {
        const fetchReportData = async () => {
            if (!tokensAuth) return;
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/reports/dashboard/`, { headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } });
                if (!response.ok) throw new Error('No se pudieron cargar los datos de los reportes.');
                const responseData = await response.json();
                setData(responseData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [tokensAuth]);

    if (loading) return <div className="p-6 text-center">Cargando reportes...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
    if (!data) return <div className="p-6 text-center">No hay datos disponibles.</div>;
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    
    // --- INICIO DE CAMBIOS EN FRONTEND ---
    const datosGraficoVentas = {
      daily: data.charts.ventas_diarias,
      weekly: data.charts.ventas_semanales,
      monthly: data.charts.ventas_mensuales
    }[periodoVentas] || [];
    // --- FIN DE CAMBIOS EN FRONTEND ---

    return (
        <div className="space-y-8 p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800">Reportes y Estadísticas</h1>

            <div>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4 pb-2 border-b">Resumen del Día</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Ventas del Día" value={data.kpis.ventas_del_dia} icon={DollarSign} formatAsCurrency />
                    <KpiCard title="Ganancia Bruta del Día" value={data.kpis.ganancia_bruta_del_dia} icon={TrendingUp} formatAsCurrency />
                    <KpiCard title="Ticket Promedio" value={data.kpis.ticket_promedio} icon={Users} formatAsCurrency />
                    <KpiCard title="Productos Vendidos" value={data.kpis.productos_vendidos} icon={ShoppingCart} />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4 pb-2 border-b">Análisis de Ventas</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center"><BarChart3 className="mr-2"/>Ventas por Período</h3>
                            <div className="flex gap-2">
                                <Button onClick={() => setPeriodoVentas('daily')} variant={periodoVentas === 'daily' ? 'primary' : 'secondary'} size="sm">Diario</Button>
                                <Button onClick={() => setPeriodoVentas('weekly')} variant={periodoVentas === 'weekly' ? 'primary' : 'secondary'} size="sm">Semanal</Button>
                                <Button onClick={() => setPeriodoVentas('monthly')} variant={periodoVentas === 'monthly' ? 'primary' : 'secondary'} size="sm">Mensual</Button>
                            </div>
                        </div>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={datosGraficoVentas}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                                <Tooltip formatter={(value) => `$${parseFloat(value).toLocaleString('es-AR')}`} />
                                <Bar dataKey="Ventas" fill="#8884d8" />
                            </BarChart>
                         </ResponsiveContainer>
                    </Card>
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><Clock className="mr-2"/>Horas Pico de Venta</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.charts.ventas_por_hora}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `$${parseFloat(value).toLocaleString('es-AR', {minimumFractionDigits: 2})}`} />
                                <Bar dataKey="Ventas" fill="#FF8042" />
                            </BarChart>
                         </ResponsiveContainer>
                    </Card>
                </div>
            </div>
            
             <div>
                 <h2 className="text-2xl font-semibold text-gray-600 mb-4 pb-2 border-b">Rankings y Rendimiento</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    <RankingTable title="Top 10 Productos Más Vendidos" data={data.rankings.mas_vendidos} valueLabel="unidades" icon={Star} />
                    <RankingTable title="Top 10 Productos Más Rentables" data={data.rankings.mas_rentables} valueLabel="Ganancia" icon={Award} formatAsCurrency />
                    <DormantProductsTable title="Productos Dormidos" data={data.other_reports.productos_dormidos} icon={Bed} />
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><CreditCard className="mr-2"/>Ventas por Método de Pago</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={data.charts.ventas_por_metodo_pago} cx="50%" cy="50%" labelLine={false} innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" nameKey="name">
                                    {data.charts.ventas_por_metodo_pago.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${parseFloat(value).toLocaleString('es-AR')}`} />
                                <Legend />
                            </PieChart>
                         </ResponsiveContainer>
                    </Card>
                     <Card className="p-6">
                         <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><Layers className="mr-2"/>Ventas por Categoría</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.charts.ventas_por_categoria} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={120} stroke="#8884d8" interval={0} />
                                <Tooltip formatter={(value) => `$${parseFloat(value).toLocaleString('es-AR')}`} />
                                <Bar dataKey="Ventas" fill="#00C49F" barSize={20} />
                            </BarChart>
                         </ResponsiveContainer>
                    </Card>
                 </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4 pb-2 border-b">Herramientas</h2>
                <ExportTool tokensAuth={tokensAuth} />
             </div>
        </div>
    );
};

export default ReportesYEstadisticas;