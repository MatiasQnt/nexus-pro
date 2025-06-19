import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ShoppingCart, DollarSign, Package, Truck, BarChart2, UserPlus, LogOut, Archive, UploadCloud, CreditCard, Users, ShieldCheck, User as UserIcon } from 'lucide-react';
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
import MiPerfil from './pages/perfil/MiPerfil';

const API_URL = 'http://127.0.0.1:8000/api';

export default function App() {
    const { usuario, tokensAuth, cerrarSesion } = useContext(ContextoAuth);

    const esSuperAdmin = usuario?.groups?.includes('SuperAdmin');
    const esAdmin = usuario?.groups?.includes('Admin');
    const esVendedor = usuario?.groups?.includes('Vendedor');
    const esAdminOSuperAdmin = esAdmin || esSuperAdmin;
    const puedeVerPanel = esSuperAdmin || esAdmin || esVendedor;

    const [vista, setVista] = useState('pos');
    const [vistaPanel, setVistaPanel] = useState('dashboard');
    const [productos, setProductos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [todosLosUsuarios, setTodosLosUsuarios] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [metodosDePago, setMetodosDePago] = useState([]);
    const [metodosDePagoAdmin, setMetodosDePagoAdmin] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
    
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const menuRef = useRef(null);

    const obtenerDatos = useCallback(async () => {
        if (!tokensAuth) return;
        
        let endpoints = ['products', 'payment-methods'];

        if (puedeVerPanel) {
            endpoints.push('reports/dashboard');
        }
        if (esAdminOSuperAdmin) {
            endpoints.push('sales', 'providers', 'clients', 'categories', 'admin/payment-methods');
        }
        if (esSuperAdmin) {
            endpoints.push('users', 'groups');
        }

        try {
            const requests = endpoints.map(endpoint => 
                fetch(`${API_URL}/${endpoint}/`, { headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } }).then(res => {
                    if (res.status === 401) {
                        cerrarSesion();
                        return Promise.reject(new Error("Token inválido"));
                    }
                    if (!res.ok) {
                        console.error(`Error al obtener ${endpoint}: ${res.status}`);
                        return Promise.resolve(null);
                    }
                    return res.json();
                })
            );
            
            const data = await Promise.all(requests);
            const dataMap = Object.fromEntries(endpoints.map((e, i) => [e, data[i]]));

            setProductos(dataMap.products || []);
            setMetodosDePago(dataMap['payment-methods'] || []);
            
            if (puedeVerPanel) {
                setDashboardData(dataMap['reports/dashboard'] || null);
            }
            if (esAdminOSuperAdmin) {
                setVentas(dataMap.sales || []);
                setProveedores(dataMap.providers || []);
                setClientes(dataMap.clients || []);
                setCategorias(dataMap.categories || []);
                setMetodosDePagoAdmin(dataMap['admin/payment-methods'] || []);
            } else {
                setVentas([]);
            }
            if (esSuperAdmin) {
                setTodosLosUsuarios(dataMap.users || []);
                setGrupos(dataMap.groups || []);
            }
            setError(null);
        } catch (err) {
            if (err.message !== "Token inválido") { setError("No se pudo conectar con el servidor."); }
        } finally { 
            setCargando(false);
        }
    }, [tokensAuth, cerrarSesion, esSuperAdmin, esAdminOSuperAdmin, puedeVerPanel]);

    useEffect(() => {
        if (usuario && tokensAuth) {
            obtenerDatos();
        } else if (!usuario) {
            setCargando(false);
        }
    }, [usuario, tokensAuth, obtenerDatos]);
    
    useEffect(() => { 
        if (usuario) {
            setVista('pos');
            setVistaPanel('dashboard');
            setMenuPerfilAbierto(false); // <-- AQUÍ ESTÁ LA CORRECCIÓN
        }
    }, [usuario]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuPerfilAbierto(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const handleNavegarAPerfil = () => {
        setVista('panel');
        setVistaPanel('mi-perfil');
        setMenuPerfilAbierto(false);
    };

    if (!usuario) {
        return <PaginaLogin />;
    }

    const handleVentaCompleta = async (carrito, total, idMetodoPago) => {
        const datosVenta = { total_amount: total.toFixed(2), details: carrito.map(item => ({ product_id: item.id, quantity: item.quantity, unit_price: item.price.toFixed(2) })), payment_method_id: idMetodoPago };
        try {
            const response = await fetch(`${API_URL}/sales/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(datosVenta) });
            if (!response.ok) throw new Error('Error al registrar la venta.');
            alert('Venta registrada.'); 
            obtenerDatos();
        } catch (err) { alert(`Error: ${err.message}`); }
    };
    
    const renderizarVistaPanel = () => {
        const roles = { esSuperAdmin, esAdmin, esVendedor };

        switch (vistaPanel) {
            case 'dashboard': return dashboardData ? <DashboardAdmin dashboardData={dashboardData} /> : <div>Cargando...</div>;
            case 'mi-perfil': return <MiPerfil />;
            case 'products': return <GestionProductos productos={productos} proveedores={proveedores} categorias={categorias} obtenerDatos={obtenerDatos} roles={roles} />;
            case 'sales': return esAdminOSuperAdmin && <GestionVentas ventas={ventas} obtenerDatos={obtenerDatos} />;
            case 'providers': return esAdminOSuperAdmin && <GestionProveedores proveedores={proveedores} obtenerDatos={obtenerDatos} />;
            case 'clients': return esAdminOSuperAdmin && <GestionClientes clientes={clientes} obtenerDatos={obtenerDatos} />;
            case 'reports': return esAdminOSuperAdmin && <ReportesYEstadisticas />;
            case 'cash-count': return esAdminOSuperAdmin && <CierreCaja />;
            case 'bulk-price-update': return esAdminOSuperAdmin && <ActualizacionMasivaPrecios productos={productos} proveedores={proveedores} obtenerDatos={obtenerDatos} />;
            case 'payment-methods': return esAdminOSuperAdmin && <GestionMetodosDePago metodosDePago={metodosDePagoAdmin} obtenerDatos={obtenerDatos} />;
            case 'users': return esSuperAdmin && <GestionUsuarios usuarios={todosLosUsuarios} grupos={grupos} obtenerDatos={obtenerDatos} />;
            default: return dashboardData ? <DashboardAdmin dashboardData={dashboardData} /> : <div>Cargando...</div>;
        }
    };

    const NavItem = ({ icon: Icon, children, onClick, active }) => (<li onClick={onClick} className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg ${active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200'}`}><Icon size={22} /><span className="font-medium">{children}</span></li>);

    if (cargando) return <div className="min-h-screen flex items-center justify-center">Cargando datos...</div>
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {puedeVerPanel && vista === 'panel' && (
                <aside className="w-64 bg-white shadow-xl flex flex-col p-4">
                    <h1 className="text-2xl font-bold text-indigo-600 px-4 mb-6">MiNegocio<span className="font-light">PRO</span></h1>
                    <nav className="flex-grow">
                        <ul className="space-y-2">
                            <NavItem icon={BarChart2} active={vistaPanel === 'dashboard'} onClick={() => setVistaPanel('dashboard')}>Dashboard</NavItem>
                            <NavItem icon={Package} active={vistaPanel === 'products'} onClick={() => setVistaPanel('products')}>Productos</NavItem>
                            
                            {esAdminOSuperAdmin && (
                                <>
                                    <NavItem icon={UploadCloud} active={vistaPanel === 'bulk-price-update'} onClick={() => setVistaPanel('bulk-price-update')}>Actualizar Precios</NavItem>
                                    <NavItem icon={DollarSign} active={vistaPanel === 'sales'} onClick={() => setVistaPanel('sales')}>Ventas</NavItem>
                                    <NavItem icon={Archive} active={vistaPanel === 'cash-count'} onClick={() => setVistaPanel('cash-count')}>Cierre de Caja</NavItem>
                                    <NavItem icon={CreditCard} active={vistaPanel === 'payment-methods'} onClick={() => setVistaPanel('payment-methods')}>Métodos de Pago</NavItem>
                                    <NavItem icon={Truck} active={vistaPanel === 'providers'} onClick={() => setVistaPanel('providers')}>Proveedores</NavItem>
                                    <NavItem icon={Users} active={vistaPanel === 'clients'} onClick={() => setVistaPanel('clients')}>Clientes</NavItem>
                                    <NavItem icon={ShieldCheck} active={vistaPanel === 'reports'} onClick={() => setVistaPanel('reports')}>Reportes</NavItem>
                                </>
                            )}

                            {esSuperAdmin && (
                                <NavItem icon={UserPlus} active={vistaPanel === 'users'} onClick={() => setVistaPanel('users')}>Usuarios</NavItem>
                            )}
                        </ul>
                    </nav>
                    <div className="mt-auto">
                        <NavItem icon={ShoppingCart} onClick={() => setVista('pos')}>Ir al Punto de Venta</NavItem>
                    </div>
                </aside>
            )}
            <main className="flex-1 flex flex-col">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
                    <div>
                        {puedeVerPanel && vista === 'pos' && <Button onClick={() => setVista('panel')} variant="secondary">Volver al Panel</Button>}
                    </div>
                    <div className="relative" ref={menuRef}>
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}>
                            <span className="font-semibold text-gray-700">{usuario.username}</span>
                            <UserIcon size={20} className="text-gray-600" />
                        </div>
                        {menuPerfilAbierto && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                                <a href="#" onClick={(e) => { e.preventDefault(); handleNavegarAPerfil(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a>
                                <a href="#" onClick={(e) => { e.preventDefault(); cerrarSesion(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar Sesión</a>
                            </div>
                        )}
                    </div>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    {vista === 'panel' && puedeVerPanel
                        ? renderizarVistaPanel()
                        : <PuntoDeVenta productos={productos} metodosDePago={metodosDePago} onVentaCompleta={handleVentaCompleta} />
                    }
                </div>
            </main>
        </div>
    );
}
