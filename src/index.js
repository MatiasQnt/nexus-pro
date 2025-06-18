import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWrapper from './App';
import reportWebVitals from './reportWebVitals';
import { ProveedorAuth } from './context/AuthContext'; // Importamos nuestro proveedor

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Envolvemos toda la aplicación con ProveedorAuth.
      Ahora, cualquier componente dentro de AppWrapper tendrá acceso
      a la información del usuario y a las funciones de login/logout.
    */}
    <ProveedorAuth>
      <AppWrapper />
    </ProveedorAuth>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
