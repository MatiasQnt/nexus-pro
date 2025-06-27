import React from 'react';

// --- Input Component (Nuevo) ---
export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    const baseClasses = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    return (
        <input
            type={type}
            className={`${baseClasses} ${className}`}
            ref={ref}
            {...props}
        />
    );
});


// --- Button Component (Modificado) ---
export const Button = ({ children, onClick, className = '', variant = 'primary', size = 'default', icon: Icon, type = 'button', disabled = false }) => {
    const baseClasses = 'font-semibold flex items-center justify-center gap-2 transition-all duration-200 ease-in-out';
    
    const sizeClasses = {
        default: 'px-4 py-2 rounded-lg',
        icon: 'h-9 w-9 rounded-md',
    };

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500',
        outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400',
        success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500',
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105';

    return (
        <button 
            type={type} 
            onClick={onClick} 
            disabled={disabled} 
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
        >
            {Icon && <Icon size={size === 'icon' ? 16 : 18} />}
            {size !== 'icon' && children}
        </button>
    );
};

// --- Badge Component ---
export const Badge = ({ children, variant = 'default', className = '' }) => {
    const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    
    const variantClasses = {
        default: 'border-transparent bg-green-100 text-green-800',
        secondary: 'border-transparent bg-gray-100 text-gray-800',
        destructive: 'border-transparent bg-red-100 text-red-800',
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </div>
    );
};

// --- Componentes existentes (sin cambios) ---
export const Card = ({ children, className = '' }) => <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>{children}</div>;

export const Modal = ({ children, isOpen, onClose, title, footer }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                {title && <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div className="pr-4">{children}</div> 
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
                    <th key={index} scope="col" className={`px-6 py-4 ${header.width || ''}`}>
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