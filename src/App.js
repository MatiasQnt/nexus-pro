import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ShoppingCart, DollarSign, Package, Truck, BarChart2, UserPlus, LogOut, Archive, UploadCloud, CreditCard, Users } from 'lucide-react';
import { ContextoAuth } from './context/AuthContext';
import { Button } from './components/ui/ComponentesUI';

import PaginaLogin from './pages/login/PaginaLogin';
import PuntoDeVenta from './pages/pos/PuntoDeVenta';
import DashboardAdmin from './pages/dashboard/Dashboard';
import GestionProductos from './pages/productos/GestionProductos';
import GestionVentas from './pages/ventas/GestionVentas';
import GestionProveedores from './pages/proveedores/GestionProveedores';
import GestionClientes from './pages/clientes/GestionClientes';
import ReportesYEstadisticas from './pages/reportes/ReportesYEstadisticas';
import GestionUsuarios from './pages/usuarios/GestionUsuarios';
import CierreCaja from './pages/cierre-caja/CierreCaja';
import ActualizacionMasivaPrecios from './pages/actualizar-precios/ActualizacionMasivaPrecios';
import GestionMetodosDePago from './pages/metodos-de-pago/GestionMetodosDePago';

const API_URL = 'http://127.0.0.1:8000/api';

export default function App() {
    const { usuario, tokensAuth, cerrarSesion } = useContext(ContextoAuth);

    const [vista, setVista] = useState('pos');
    const [vistaAdmin, setVistaAdmin] = useState('dashboard');
    const [productos, setProductos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [metodosDePago, setMetodosDePago] = useState([]);
    const [metodosDePagoAdmin, setMetodosDePagoAdmin] = useState([]);
    
    // Este estado solo se usará para la carga INICIAL de la aplicación.
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const esAdmin = usuario?.groups?.includes('Administradores');

    const obtenerDatos = useCallback(async () => {
        if (!tokensAuth) return;
        
        // ¡CAMBIO CLAVE! Se elimina `setCargando(true)` de aquí.
        // Esto evita que la pantalla de carga principal se muestre en cada refresco de datos.
        
        let endpoints = ['products', 'sales', 'payment-methods'];
        if (esAdmin) {
            endpoints.push('providers', 'clients', 'categories', 'users', 'groups', 'admin/payment-methods');
        }
        try {
            const requests = endpoints.map(endpoint => 
                fetch(`${API_URL}/${endpoint}/`, { headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } }).then(res => {
                    if(res.status === 401) { cerrarSesion(); return Promise.reject(new Error("Token inválido")); }
                    if (!res.ok) return Promise.resolve([]);
                    return res.json()
                })
            );
            
            const data = await Promise.all(requests);
            const dataMap = Object.fromEntries(endpoints.map((e, i) => [e, data[i]]));

            setProductos(dataMap.products || []); 
            setVentas(dataMap.sales || []);
            setMetodosDePago(dataMap['payment-methods'] || []);
            if(esAdmin) {
                setProveedores(dataMap.providers || []); 
                setClientes(dataMap.clients || []); 
                setCategorias(dataMap.categories || []); 
                setTodosLosUsuarios(dataMap.users || []);
                setGrupos(dataMap.groups || []);
                setMetodosDePagoAdmin(dataMap['admin/payment-methods'] || []);
            }
            setError(null);
        } catch (err) {
            if (err.message !== "Token inválido") { setError("No se pudo conectar con el servidor."); }
        } finally { 
            // La carga solo se desactiva, nunca se reactiva en los refrescos.
            setCargando(false); 
        }
    }, [tokensAuth, cerrarSesion, esAdmin]); 

    useEffect(() => {
        if (usuario && tokensAuth) {
            obtenerDatos();
        } else if (!usuario) {
            setCargando(false);
        }
    }, [usuario, tokensAuth, obtenerDatos]);
    
    useEffect(() => { 
        if (usuario && !esAdmin) {
            setVista('pos'); 
        }
    }, [usuario, esAdmin]);

    if (!usuario) {
        return <PaginaLogin />;
    }

    const handleVentaCompleta = async (carrito, total, idMetodoPago) => {
        const datosVenta = { total_amount: total.toFixed(2), details: carrito.map(item => ({ product_id: item.id, quantity: item.quantity, unit_price: item.price.toFixed(2) })), payment_method_id: idMetodoPago };
        try {
            await fetch(`${API_URL}/sales/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(datosVenta) });
            alert('Venta registrada.'); 
            obtenerDatos();
        } catch (err) { alert(`Error: ${err.message}`); }
    };
    
    const renderizarVistaAdmin = () => {
        switch (vistaAdmin) {
            case 'dashboard': return <DashboardAdmin productos={productos} ventas={ventas} />;
            case 'products': return <GestionProductos productos={productos} proveedores={proveedores} categorias={categorias} obtenerDatos={obtenerDatos} />;
            case 'sales': return <GestionVentas ventas={ventas} obtenerDatos={obtenerDatos}/>;
            case 'providers': return <GestionProveedores proveedores={proveedores} obtenerDatos={obtenerDatos} />;
            case 'clients': return <GestionClientes clientes={clientes} obtenerDatos={obtenerDatos} />;
            case 'reports': return <ReportesYEstadisticas />;
            case 'users': return <GestionUsuarios usuarios={todosLosUsuarios} grupos={grupos} obtenerDatos={obtenerDatos} />;
            case 'cash-count': return <CierreCaja />;
            case 'bulk-price-update': return <ActualizacionMasivaPrecios productos={productos} proveedores={proveedores} obtenerDatos={obtenerDatos} />;
            case 'payment-methods': return <GestionMetodosDePago metodosDePago={metodosDePagoAdmin} obtenerDatos={obtenerDatos} />;
            default: return <DashboardAdmin productos={productos} ventas={ventas}/>;
        }
    };

    const NavItem = ({ icon: Icon, children, onClick, active }) => (<li onClick={onClick} className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg ${active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200'}`}><Icon size={22} /><span className="font-medium">{children}</span></li>);

    if (cargando) return <div className="min-h-screen flex items-center justify-center">Cargando datos...</div>
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {esAdmin && vista === 'admin' && (
                <aside className="w-64 bg-white shadow-xl flex flex-col p-4">
                    <h1 className="text-2xl font-bold text-indigo-600 px-4 mb-6">MiNegocio<span className="font-light">PRO</span></h1>
                    <nav className="flex-grow"><ul className="space-y-2">
                        <NavItem icon={BarChart2} active={vistaAdmin === 'dashboard'} onClick={() => setVistaAdmin('dashboard')}>Dashboard</NavItem>
                        <NavItem icon={Package} active={vistaAdmin === 'products'} onClick={() => setVistaAdmin('products')}>Productos</NavItem>
                        <NavItem icon={UploadCloud} active={vistaAdmin === 'bulk-price-update'} onClick={() => setVistaAdmin('bulk-price-update')}>Actualizar Precios</NavItem>
                        <NavItem icon={DollarSign} active={vistaAdmin === 'sales'} onClick={() => setVistaAdmin('sales')}>Ventas</NavItem>
                        <NavItem icon={Archive} active={vistaAdmin === 'cash-count'} onClick={() => setVistaAdmin('cash-count')}>Cierre de Caja</NavItem>
                        <NavItem icon={CreditCard} active={vistaAdmin === 'payment-methods'} onClick={() => setVistaAdmin('payment-methods')}>Métodos de Pago</NavItem>
                        <NavItem icon={Truck} active={vistaAdmin === 'providers'} onClick={() => setVistaAdmin('providers')}>Proveedores</NavItem>
                        <NavItem icon={Users} active={vistaAdmin === 'clients'} onClick={() => setVistaAdmin('clients')}>Clientes</NavItem>
                        <NavItem icon={BarChart2} active={vistaAdmin === 'reports'} onClick={() => setVistaAdmin('reports')}>Reportes</NavItem>
                        <NavItem icon={UserPlus} active={vistaAdmin === 'users'} onClick={() => setVistaAdmin('users')}>Usuarios</NavItem>
                    </ul></nav>
                    <div className="mt-auto"><NavItem icon={ShoppingCart} onClick={() => setVista('pos')}>Ir al Punto de Venta</NavItem></div>
                </aside>
            )}
            <main className="flex-1 flex flex-col">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
                    <div>{esAdmin && vista === 'pos' && <Button onClick={() => setVista('admin')} variant="secondary">Volver al Panel</Button>}</div>
                    <div className="flex items-center gap-3"><span className="font-semibold text-gray-700">{usuario.username}</span><button onClick={cerrarSesion} className="text-gray-500 hover:text-red-600"><LogOut size={20} /></button></div>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">{vista === 'pos' || !esAdmin ? <PuntoDeVenta productos={productos} metodosDePago={metodosDePago} onVentaCompleta={handleVentaCompleta} /> : renderizarVistaAdmin()}</div>
            </main>
        </div>
    );
}
