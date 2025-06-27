import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Archive } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Card, Table } from '../../components/ui/ComponentesUI';
import { useServerSidePagination } from '../../hooks/useServerSidePagination';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000/api';

const FiltrosHistorial = ({ setFiltros, filtros, resetFiltros }) => {
    const handleDateChange = (e) => {
        // El backend espera los filtros como 'date__gte' (mayor o igual que) y 'date__lte' (menor o igual que).
        const filterName = e.target.name === 'fechaDesde' ? 'date__gte' : 'date__lte';
        setFiltros(prev => ({ ...prev, [filterName]: e.target.value }));
    };

    return (
        <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-grow">
                <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700">Desde</label>
                <input id="fechaDesde" type="date" name="fechaDesde" value={filtros.date__gte || ''} onChange={handleDateChange} className="mt-1 p-2 border rounded-lg w-full" />
            </div>
            <div className="flex-grow">
                <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700">Hasta</label>
                <input id="fechaHasta" type="date" name="fechaHasta" value={filtros.date__lte || ''} onChange={handleDateChange} className="mt-1 p-2 border rounded-lg w-full" />
            </div>
            <Button onClick={resetFiltros} variant="secondary">Limpiar</Button>
        </div>
    );
};

const CierreCaja = () => {
    // Estado para la sección "Cierre del Día"
    const [todayData, setTodayData] = useState(null);
    const [loadingToday, setLoadingToday] = useState(true);
    const [errorToday, setErrorToday] = useState('');
    const [montoContado, setMontoContado] = useState('');
    
    const { tokensAuth } = useContext(ContextoAuth);

    // Hook para la sección "Historial de Cierres"
    const { 
        datosPaginados, 
        loading: loadingHistory, 
        error: errorHistory, 
        FiltrosUI, 
        PaginacionUI,
        refetch: refetchHistory
    } = useServerSidePagination({
        // Asumimos un nuevo endpoint solo para el historial, que debe ser creado en el backend.
        endpoint: 'cash-count-history',
        tokensAuth: tokensAuth,
        ComponenteFiltros: FiltrosHistorial,
        initialFilters: { date__gte: '', date__lte: '' }
    });

    const obtenerDatosDelDia = useCallback(async () => {
        if (!tokensAuth) return;
        setLoadingToday(true);
        setErrorToday('');
        try {
            const response = await fetch(`${API_URL}/cash-count/`, { headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } });
            const responseData = await response.json();
            if (!response.ok) {
                if (response.status === 409) {
                    setErrorToday(responseData.message);
                } else {
                    throw new Error(responseData.detail || 'No se pudieron cargar los datos del día.');
                }
            } else {
                setTodayData(responseData);
            }
        } catch (error) {
            setErrorToday(error.message);
        } finally {
            setLoadingToday(false);
        }
    }, [tokensAuth]);

    useEffect(() => {
        obtenerDatosDelDia();
    }, [obtenerDatosDelDia]);

    const guardarCierre = async () => {
        if(montoContado === '' || isNaN(parseFloat(montoContado))) {
            toast.error("Por favor, ingresa un monto contado válido.");
            return;
        }

        const promesa = fetch(`${API_URL}/cash-count/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
            body: JSON.stringify({
                counted_amount: parseFloat(montoContado),
                expected_amount: todayData.expected_amount
            })
        }).then(res => {
            if (!res.ok) return res.json().then(err => Promise.reject(err));
            return res.json();
        });

        toast.promise(promesa, {
            loading: 'Guardando cierre de caja...',
            success: (data) => {
                setMontoContado('');
                obtenerDatosDelDia(); // Recargamos los datos del día
                refetchHistory();     // Recargamos el historial
                return data.message || '¡Cierre de caja guardado con éxito!';
            },
            error: (err) => `Error: ${err.message || 'No se pudo guardar el cierre.'}`
        });
    };
    
    const diferencia = todayData?.expected_amount != null && montoContado !== '' ? parseFloat(montoContado) - todayData.expected_amount : null;

    if (loadingToday) return <div className="p-6 text-center">Cargando...</div>;
    
    return (
        <div className="space-y-8 p-6">
            <h1 className="text-3xl font-bold text-gray-800">Cierre de Caja Diario</h1>
            
            <Card>
                <h2 className="text-xl font-bold text-gray-700 mb-4">Cierre del Día ({new Date().toLocaleDateString('es-AR')})</h2>
                {errorToday && !todayData?.expected_amount ? (
                    <div className="text-center p-8 bg-yellow-50 rounded-lg">
                        <p className="text-lg font-semibold text-yellow-700">{errorToday}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-800 uppercase">Monto Esperado (Sistema)</h3>
                            <p className="text-4xl font-bold text-blue-900">${parseFloat(todayData?.expected_amount || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-4">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Monto Contado en Caja</label>
                             <input 
                                 type="number"
                                 value={montoContado}
                                 onChange={(e) => setMontoContado(e.target.value)}
                                 placeholder="0.00"
                                 className="w-full p-3 text-2xl text-center border-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                             />
                        </div>
                        <div className={`text-center p-4 rounded-lg ${diferencia === null ? 'bg-gray-100' : diferencia === 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <h3 className={`text-sm font-semibold uppercase ${diferencia === null ? 'text-gray-800' : diferencia === 0 ? 'text-green-800' : 'text-red-800'}`}>Diferencia</h3>
                            <p className={`text-4xl font-bold ${diferencia === null ? 'text-gray-900' : diferencia === 0 ? 'text-green-900' : 'text-red-900'}`}>{diferencia !== null ? `$${diferencia.toFixed(2)}` : '-'}</p>
                        </div>
                        <div className="md:col-span-3 text-center">
                            <Button onClick={guardarCierre} disabled={diferencia === null || !!errorToday} variant="primary" icon={Archive}>Guardar Cierre de Caja</Button>
                        </div>
                    </div>
                )}
            </Card>

            <div>
                 <h2 className="text-xl font-bold text-gray-700 mb-4">Historial de Cierres</h2>
                 {FiltrosUI}
                 
                 {loadingHistory && <p>Cargando historial...</p>}
                 {errorHistory && <p className="text-red-500">{errorHistory}</p>}

                 {!loadingHistory && !errorHistory && (
                     datosPaginados.length > 0 ? (
                         <>
                             <Table
                                 headers={[
                                     { title: 'Fecha' },
                                     { title: 'Monto Esperado' },
                                     { title: 'Monto Contado' },
                                     { title: 'Diferencia' },
                                     { title: 'Usuario' }
                                 ]}
                                 data={datosPaginados}
                                 renderRow={(c) => (
                                     <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                                         <td className="px-6 py-4">{new Date(c.date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                                         <td className="px-6 py-4">${parseFloat(c.expected_amount).toFixed(2)}</td>
                                         <td className="px-6 py-4">${parseFloat(c.counted_amount).toFixed(2)}</td>
                                         <td className={`px-6 py-4 font-bold ${c.difference > 0 ? 'text-green-600' : c.difference < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                             {c.difference > 0 ? `+${parseFloat(c.difference).toFixed(2)}` : parseFloat(c.difference).toFixed(2)}
                                         </td>
                                         <td className="px-6 py-4">{c.user_name || c.user}</td>
                                     </tr>
                                 )}
                             />
                             {PaginacionUI}
                         </>
                     ) : (
                         <div className="text-center py-16 px-6 bg-white rounded-lg shadow">
                             <h3 className="text-lg font-semibold text-gray-700">No se encontraron cierres de caja</h3>
                             <p className="text-gray-500 mt-1">Intenta ajustar el rango de fechas para encontrar resultados.</p>
                         </div>
                     )
                 )}
            </div>
        </div>
    );
};

export default CierreCaja;