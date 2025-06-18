import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Archive } from 'lucide-react';
import { ContextoAuth } from '../../context/AuthContext';
import { Button, Card, Table } from '../../components/ui/ComponentesUI';
import { useFiltrosYBusqueda } from '../../hooks/useFiltrosYBusqueda';

const API_URL = 'http://127.0.0.1:8000/api';

// --- COMPONENTES Y LÓGICA DE FILTRADO ---

const FiltrosHistorial = ({ setFiltros, filtros, resetFiltros }) => {
    const handleDateChange = (e) => {
        setFiltros(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-grow">
                <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700">Desde</label>
                <input id="fechaDesde" type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleDateChange} className="mt-1 p-2 border rounded-lg w-full" />
            </div>
            <div className="flex-grow">
                <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700">Hasta</label>
                <input id="fechaHasta" type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleDateChange} className="mt-1 p-2 border rounded-lg w-full" />
            </div>
            <Button onClick={resetFiltros} variant="secondary">Limpiar</Button>
        </div>
    );
};

const logicaFiltroHistorial = (historial, filtros) => {
    const { fechaDesde, fechaHasta } = filtros;
    if (!fechaDesde && !fechaHasta) return historial;

    return historial.filter(cierre => {
        const fechaCierre = new Date(cierre.date);
        fechaCierre.setMinutes(fechaCierre.getMinutes() + fechaCierre.getTimezoneOffset());
        const desde = fechaDesde ? new Date(fechaDesde) : null;
        const hasta = fechaHasta ? new Date(fechaHasta) : null;
        if (desde && fechaCierre < desde) return false;
        if (hasta && fechaCierre > hasta) return false;
        return true;
    });
};


// --- COMPONENTE PRINCIPAL ---

const CierreCaja = () => {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [montoContado, setMontoContado] = useState('');
    const [error, setError] = useState('');
    const { tokensAuth } = useContext(ContextoAuth);

    const { datosPaginados, FiltrosUI, PaginacionUI } = useFiltrosYBusqueda({
        items: datos?.history || [],
        itemsPorPagina: 10,
        logicaDeFiltro: logicaFiltroHistorial,
        ComponenteFiltros: FiltrosHistorial,
        filtrosIniciales: { fechaDesde: '', fechaHasta: '' }
    });

    // CORRECCIÓN: Se restauró la lógica completa de esta función.
    const obtenerDatos = useCallback(async () => {
        if (!tokensAuth) return;
        setCargando(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/cash-count/`, { headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } });
            const responseData = await response.json();

            if (!response.ok) {
                 if (response.status === 409) {
                     setError(responseData.message);
                     setDatos({ history: responseData.history || [] }); 
                 } else {
                     throw new Error(responseData.detail || 'No se pudieron cargar los datos.');
                 }
            } else {
                 setDatos(responseData);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setCargando(false);
        }
    }, [tokensAuth]);

    useEffect(() => {
        obtenerDatos();
    }, [obtenerDatos]);

    const guardarCierre = async () => {
        if(montoContado === '' || isNaN(parseFloat(montoContado))) {
            alert("Por favor, ingresa un monto contado válido.");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/cash-count/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) },
                body: JSON.stringify({
                    counted_amount: parseFloat(montoContado),
                    expected_amount: datos.expected_amount
                })
            });
            if (!response.ok) { throw new Error('No se pudo guardar el cierre.'); }
            alert('¡Cierre de caja guardado con éxito!');
            setMontoContado('');
            obtenerDatos();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };
    
    const diferencia = datos?.expected_amount != null && montoContado !== '' ? parseFloat(montoContado) - datos.expected_amount : null;

    if (cargando) return <div className="p-6 text-center">Cargando...</div>;
    
    return (
        <div className="space-y-8 p-6">
            <h1 className="text-3xl font-bold text-gray-800">Cierre de Caja Diario</h1>
            
            <Card>
                <h2 className="text-xl font-bold text-gray-700 mb-4">Cierre del Día ({new Date().toLocaleDateString('es-AR')})</h2>
                {error && !datos?.expected_amount ? (
                    <div className="text-center p-8 bg-yellow-50 rounded-lg">
                        <p className="text-lg font-semibold text-yellow-700">{error}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-800 uppercase">Monto Esperado (Sistema)</h3>
                            <p className="text-4xl font-bold text-blue-900">${parseFloat(datos?.expected_amount || 0).toFixed(2)}</p>
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
                            <Button onClick={guardarCierre} disabled={diferencia === null || !!error} variant="primary" icon={Archive}>Guardar Cierre de Caja</Button>
                        </div>
                    </div>
                )}
            </Card>

            <div>
                 <h2 className="text-xl font-bold text-gray-700 mb-4">Historial de Cierres</h2>
                 {FiltrosUI}
                 <Table
                    headers={['Fecha', 'Monto Esperado', 'Monto Contado', 'Diferencia', 'Usuario']}
                    data={datosPaginados}
                    renderRow={(c) => (
                        <tr key={c.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">{new Date(c.date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                            <td className="px-6 py-4">${parseFloat(c.expected_amount).toFixed(2)}</td>
                            <td className="px-6 py-4">${parseFloat(c.counted_amount).toFixed(2)}</td>
                            <td className={`px-6 py-4 font-bold ${c.difference > 0 ? 'text-green-600' : c.difference < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                {c.difference >= 0 ? `+${parseFloat(c.difference).toFixed(2)}` : parseFloat(c.difference).toFixed(2)}
                            </td>
                            <td className="px-6 py-4">{c.user}</td>
                        </tr>
                    )}
                 />
                 {PaginacionUI}
            </div>
        </div>
    );
};

export default CierreCaja;
