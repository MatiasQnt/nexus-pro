import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ShoppingCart, DollarSign, Package, Truck, BarChart2, UserPlus, LogOut, Archive, UploadCloud, CreditCard, Users, Shield, User as UserIcon, LayoutDashboard, Receipt, Folder, Tag, UserCog, ChevronsLeft, ChevronsRight, Dna } from 'lucide-react';
import { ContextoAuth } from './context/AuthContext';
import { Button } from './components/ui/ComponentesUI';
import { Toaster, toast } from 'sonner';
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
import GestionCategorias from './pages/categorias/GestionCategorias';

const API_URL = 'http://127.0.0.1:8000/api';
const titulosPanel = { 'dashboard': 'Dashboard', 'mi-perfil': 'Mi Perfil', 'products': 'Gestión de Productos', 'categories': 'Gestión de Categorías', 'sales': 'Gestión de Ventas', 'providers': 'Gestión de Proveedores', 'clients': 'Gestión de Clientes', 'reports': 'Reportes y Estadísticas', 'cash-count': 'Cierre de Caja', 'bulk-price-update': 'Actualización Masiva de Precios', 'payment-methods': 'Métodos de Pago', 'users': 'Gestión de Usuarios' };

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
    const [productosActivos, setProductosActivos] = useState([]);
    const [productosPopulares, setProductosPopulares] = useState([]);
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
    const [sidebarColapsado, setSidebarColapsado] = useState(false);
    const menuRef = useRef(null);

    const obtenerDatos = useCallback(async () => { if (!tokensAuth) return; let endpoints = ['products', 'payment-methods', 'products/popular-for-pos/']; if (puedeVerPanel) { endpoints.push('reports/dashboard'); } if (esAdminOSuperAdmin) { endpoints.push('sales', 'providers', 'clients', 'categories', 'admin/payment-methods'); } if (esSuperAdmin) { endpoints.push('users', 'groups'); } try { const requests = endpoints.map(endpoint => fetch(`${API_URL}/${endpoint}`, { headers: { 'Authorization': 'Bearer ' + String(tokensAuth.access) } }).then(res => { if (res.status === 401) { cerrarSesion(); return Promise.reject(new Error("Token inválido")); } if (!res.ok) { console.error(`Error al obtener ${endpoint}: ${res.status}`); return Promise.resolve(null); } return res.json(); })); const data = await Promise.all(requests); const dataMap = Object.fromEntries(endpoints.map((e, i) => [e, data[i]])); const todosLosProductos = dataMap.products || []; setProductos(todosLosProductos); setProductosActivos(todosLosProductos.filter(p => p.estado === 'activo')); setProductosPopulares(dataMap['products/popular-for-pos/'] || []); setMetodosDePago(dataMap['payment-methods'] || []); if (puedeVerPanel) { setDashboardData(dataMap['reports/dashboard'] || null); } if (esAdminOSuperAdmin) { setVentas(dataMap.sales || []); setProveedores(dataMap.providers || []); setClientes(dataMap.clients || []); setCategorias(dataMap.categories || []); setMetodosDePagoAdmin(dataMap['admin/payment-methods'] || []); } else { setVentas([]); setCategorias([]); } if (esSuperAdmin) { setTodosLosUsuarios(dataMap.users || []); setGrupos(dataMap.groups || []); } setError(null); } catch (err) { if (err.message !== "Token inválido") { setError("No se pudo conectar con el servidor."); } } finally { setCargando(false); } }, [tokensAuth, cerrarSesion, esSuperAdmin, esAdminOSuperAdmin, puedeVerPanel]);
    useEffect(() => { if (usuario) { obtenerDatos(); } else { setCargando(false); } }, [usuario?.user_id, obtenerDatos]);
    useEffect(() => { if (usuario) { setVista('pos'); setVistaPanel('dashboard'); setMenuPerfilAbierto(false); } }, [usuario?.username]);
    useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) { setMenuPerfilAbierto(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); }; }, [menuRef]);

    const handleNavegarAPerfil = () => { setVista('panel'); setVistaPanel('mi-perfil'); setMenuPerfilAbierto(false); };
    const handleVentaCompleta = async (carrito, total, idMetodoPago) => { const datosVenta = { total_amount: total.toFixed(2), details: carrito.map(item => ({ product_id: item.id, quantity: item.quantity, unit_price: item.price.toFixed(2) })), payment_method_id: idMetodoPago }; const promesaDeVenta = fetch(`${API_URL}/sales/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + String(tokensAuth.access) }, body: JSON.stringify(datosVenta) }).then(res => { if (!res.ok) return res.json().then(err => Promise.reject(err)); return res.json(); }); toast.promise(promesaDeVenta, { loading: 'Registrando venta...', success: () => { obtenerDatos(); return 'Venta registrada con éxito.'; }, error: (err) => `Error al registrar la venta: ${JSON.stringify(err)}` }); };
    
    const renderizarVistaPanel = () => { const roles = { esSuperAdmin, esAdmin, esVendedor }; switch (vistaPanel) { case 'dashboard': return dashboardData ? <DashboardAdmin dashboardData={dashboardData} /> : <div>Cargando...</div>; case 'mi-perfil': return <MiPerfil />; case 'products': return <GestionProductos productos={productos} proveedores={proveedores} categorias={categorias} obtenerDatos={obtenerDatos} roles={roles} />; case 'categories': return esAdminOSuperAdmin && <GestionCategorias categorias={categorias} obtenerDatos={obtenerDatos} />; case 'sales': return esAdminOSuperAdmin && <GestionVentas ventas={ventas} obtenerDatos={obtenerDatos} />; case 'providers': return esAdminOSuperAdmin && <GestionProveedores proveedores={proveedores} obtenerDatos={obtenerDatos} />; case 'clients': return esAdminOSuperAdmin && <GestionClientes clientes={clientes} obtenerDatos={obtenerDatos} />; case 'reports': return esAdminOSuperAdmin && <ReportesYEstadisticas />; case 'cash-count': return esAdminOSuperAdmin && <CierreCaja />; case 'bulk-price-update': return esAdminOSuperAdmin && <ActualizacionMasivaPrecios productos={productos} proveedores={proveedores} obtenerDatos={obtenerDatos} />; case 'payment-methods': return esAdminOSuperAdmin && <GestionMetodosDePago metodosDePago={metodosDePagoAdmin} obtenerDatos={obtenerDatos} />; case 'users': return esSuperAdmin && <GestionUsuarios usuarios={todosLosUsuarios} grupos={grupos} obtenerDatos={obtenerDatos} />; default: return dashboardData ? <DashboardAdmin dashboardData={dashboardData} /> : <div>Cargando...</div>; } };
    const NavItem = ({ icon: Icon, children, onClick, active, colapsado }) => (<a href="#" onClick={onClick} className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${active ? 'bg-gray-900 text-white' : 'hover:bg-gray-700 text-white'} ${colapsado ? 'justify-center' : ''}`}><Icon className={`h-5 w-5 flex-shrink-0 ${colapsado ? '' : 'mr-3'} ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} /><span className={`font-medium ${colapsado ? 'hidden' : 'block'}`}>{children}</span></a>);
    const NavGroup = ({ title, children, colapsado }) => (<div className="pt-4"><h3 className={`px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${colapsado ? 'hidden' : 'block'}`}>{title}</h3><div className="mt-2 space-y-1">{children}</div></div>);

    if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Cargando datos...</div>
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 bg-gray-100">{error}</div>
    if (!usuario) { return <PaginaLogin />; }

    return (
        <div className="flex h-screen bg-gray-800 font-sans">
    {vista === 'panel' && puedeVerPanel && (
        <aside className={`text-white flex flex-col flex-shrink-0 bg-gray-800 transition-all duration-300 ${sidebarColapsado ? 'w-20' : 'w-64'}`}>
                    <div className="p-4 border-b border-gray-700 h-[65px] flex items-center justify-center"><h1 className="text-2xl font-bold whitespace-nowrap">{sidebarColapsado ? <Dna className="h-8 w-8 text-white" /> : <>Nexus<span className="font-light">POS</span></>}</h1></div>
                    <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                        <NavItem icon={LayoutDashboard} active={vistaPanel === 'dashboard'} onClick={(e) => { e.preventDefault(); setVistaPanel('dashboard'); setVista('panel'); }} colapsado={sidebarColapsado}>Dashboard</NavItem>
                        {esAdminOSuperAdmin && (<NavGroup title="Gestión de Ventas" colapsado={sidebarColapsado}><NavItem icon={Receipt} active={vistaPanel === 'sales'} onClick={(e) => { e.preventDefault(); setVistaPanel('sales'); setVista('panel'); }} colapsado={sidebarColapsado}>Ventas</NavItem><NavItem icon={Archive} active={vistaPanel === 'cash-count'} onClick={(e) => { e.preventDefault(); setVistaPanel('cash-count'); setVista('panel'); }} colapsado={sidebarColapsado}>Cierre de Caja</NavItem><NavItem icon={BarChart2} active={vistaPanel === 'reports'} onClick={(e) => { e.preventDefault(); setVistaPanel('reports'); setVista('panel'); }} colapsado={sidebarColapsado}>Reportes</NavItem></NavGroup>)}
                        <NavGroup title="Inventario" colapsado={sidebarColapsado}><NavItem icon={Package} active={vistaPanel === 'products'} onClick={(e) => { e.preventDefault(); setVistaPanel('products'); setVista('panel'); }} colapsado={sidebarColapsado}>Productos</NavItem>{esAdminOSuperAdmin && (<><NavItem icon={Folder} active={vistaPanel === 'categories'} onClick={(e) => { e.preventDefault(); setVistaPanel('categories'); setVista('panel'); }} colapsado={sidebarColapsado}>Categorías</NavItem><NavItem icon={Tag} active={vistaPanel === 'bulk-price-update'} onClick={(e) => { e.preventDefault(); setVistaPanel('bulk-price-update'); setVista('panel'); }} colapsado={sidebarColapsado}>Actualizar Precios</NavItem><NavItem icon={Truck} active={vistaPanel === 'providers'} onClick={(e) => { e.preventDefault(); setVistaPanel('providers'); setVista('panel'); }} colapsado={sidebarColapsado}>Proveedores</NavItem></>)}</NavGroup>
                        {esAdminOSuperAdmin && (<NavGroup title="Administración" colapsado={sidebarColapsado}><NavItem icon={Users} active={vistaPanel === 'clients'} onClick={(e) => { e.preventDefault(); setVistaPanel('clients'); setVista('panel'); }} colapsado={sidebarColapsado}>Clientes</NavItem>{esSuperAdmin && <NavItem icon={UserCog} active={vistaPanel === 'users'} onClick={(e) => { e.preventDefault(); setVistaPanel('users'); setVista('panel'); }} colapsado={sidebarColapsado}>Usuarios</NavItem>}<NavItem icon={CreditCard} active={vistaPanel === 'payment-methods'} onClick={(e) => { e.preventDefault(); setVistaPanel('payment-methods'); setVista('panel'); }} colapsado={sidebarColapsado}>Métodos de Pago</NavItem></NavGroup>)}
                    </nav>
                    <div className="p-2 mt-auto border-t border-gray-700 space-y-2">
                        <a href="#" onClick={() => setVista('pos')} className={`flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300`} title="Ir al Punto de Venta"><ShoppingCart className={`h-5 w-5 flex-shrink-0 ${sidebarColapsado ? '' : 'mr-2'}`} />{!sidebarColapsado && 'Punto de Venta'}</a>
                        <button onClick={() => setSidebarColapsado(!sidebarColapsado)} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:bg-gray-700 hover:text-white py-2 px-4 rounded-lg transition-colors duration-200" title={sidebarColapsado ? 'Expandir menú' : 'Colapsar menú'}>{sidebarColapsado ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}</button>
                    </div>
                </aside>
            )}
            <main className="flex-1 flex flex-col bg-gray-100 rounded-l-xl overflow-hidden">
                <header className={`p-4 flex justify-between items-center flex-shrink-0 z-10 transition-colors duration-300 ${vista === 'pos' ? 'bg-gray-800 text-white rounded-tl-xl' : 'bg-white text-gray-800 shadow-sm rounded-tl-xl'}`}>
                    <div className="flex-1">{vista === 'pos' && puedeVerPanel && (<Button onClick={() => setVista('panel')} variant="secondary" className="bg-gray-700 text-white hover:bg-gray-600">Volver al Panel</Button>)}</div>
                    <h2 className="text-xl font-semibold text-center flex-1">{vista === 'pos' ? 'Punto de Venta' : titulosPanel[vistaPanel] || 'Panel'}</h2>
                    <div className="flex-1 flex justify-end"><div className="relative" ref={menuRef}><div className="flex items-center gap-3 cursor-pointer" onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}><span className="font-semibold">{usuario.username}</span><div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">{usuario.username.charAt(0).toUpperCase()}</div></div>{menuPerfilAbierto && (<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"><a href="#" onClick={(e) => { e.preventDefault(); handleNavegarAPerfil(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi Perfil</a><a href="#" onClick={(e) => { e.preventDefault(); cerrarSesion(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar Sesión</a></div>)}</div></div>
                </header>
                <main className="flex-1 overflow-y-auto"><div className="h-full">{vista === 'panel' && puedeVerPanel ? <div className="p-6">{renderizarVistaPanel()}</div> : <PuntoDeVenta productosActivos={productosActivos} metodosDePago={metodosDePago} onVentaCompleta={handleVentaCompleta} productosPopulares={productosPopulares} />}</div></main>
            </main>
            <Toaster richColors position="top-right" />
        </div>
    );
}