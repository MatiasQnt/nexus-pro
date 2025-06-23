// src/components/ui/ComponentesUI.js

import React from 'react';
import { Edit, PlusCircle, Trash2, CheckCircle, Eye, EyeOff, Users, ShoppingCart, DollarSign, Package, Truck, BarChart2, UserPlus, LogOut, Archive, UploadCloud, CreditCard, Activity, TrendingUp } from 'lucide-react';

export const Card = ({ children, className = '' }) => <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>{children}</div>;

export const Button = ({ children, onClick, className = '', variant = 'primary', icon: Icon, type = 'button', disabled = false }) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-transform transform hover:scale-105';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        success: 'bg-green-500 text-white hover:bg-green-600'
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{Icon && <Icon size={18} />}{children}</button>;
};

export const Modal = ({ children, isOpen, onClose, title, footer }) => { // <--- Añade 'footer'
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                {/* El título ahora es opcional */}
                {title && <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>

                {/* Contenido principal */}
                <div className="pr-4">{children}</div> 

                {/* Renderizado condicional del footer */}
                {footer && (
                    <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Table = ({ headers, data, renderRow }) => (
    <table className="w-full text-sm text-left text-gray-500 table-fixed">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
                {headers.map((header, index) => (
                    <th key={index} scope="col" className={`px-4 py-3 ${header.width || ''}`}>
                        {header.title}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {data.map((item, index) => renderRow(item, index))}
        </tbody>
    </table>
);

export const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className={`relative overflow-hidden`}>
        <div className={`absolute -top-4 -right-4 p-4 rounded-full opacity-20 ${color}`}><Icon size={60} /></div>
        <h3 className="text-gray-500 font-semibold">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 truncate" title={value}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </Card>
);