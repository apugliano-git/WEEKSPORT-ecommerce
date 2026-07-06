import React from 'react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#1A1A20] border-t border-white/5 w-full">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:flex md:flex-row md:justify-center md:items-start gap-8 md:gap-12 lg:gap-16">
          
          {/* Bloque 1 - Envío */}
          <div className="flex flex-col items-center text-center">
            <div className="text-[#F400A1] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <h4 className="font-display uppercase tracking-wide text-sm text-white mb-2">Envío</h4>
            <p className="font-sans text-gray-400 text-sm max-w-[150px]">
              Envío gratis hasta 3km del local
            </p>
          </div>

          {/* Bloque 2 - Medios de pago */}
          <div className="flex flex-col items-center text-center">
            <div className="text-[#F400A1] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <circle cx="12" cy="12" r="2"></circle>
                <path d="M6 12h.01M18 12h.01"></path>
              </svg>
            </div>
            <h4 className="font-display uppercase tracking-wide text-sm text-white mb-2">Medios de pago</h4>
            <p className="font-sans text-gray-400 text-sm max-w-[150px]">
              Efectivo, transferencia, tarjeta de débito y crédito
            </p>
          </div>

          {/* Bloque 3 - Ubicación */}
          <div className="flex flex-col items-center text-center">
            <div className="text-[#F400A1] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h4 className="font-display uppercase tracking-wide text-sm text-white mb-2">Ubicación</h4>
            <p className="font-sans text-gray-400 text-sm max-w-[160px]">
              Triunvirato 1194, esq. Vélez Sarsfield. Quilmes Oeste
            </p>
          </div>

          {/* Bloque 4 - Contacto */}
          <div className="flex flex-col items-center text-center">
            <div className="text-[#F400A1] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h4 className="font-display uppercase tracking-wide text-sm text-white mb-2">Contacto</h4>
            <div className="flex flex-col font-sans text-gray-400 text-sm gap-1">
              <Link 
                href="https://www.instagram.com/weeksport_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-[#F400A1] transition-colors"
              >
                Instagram: weeksport_
              </Link>
              <a 
                href="https://wa.me/54911XXXXXXXX" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#F400A1] transition-colors"
              >
                Tel: +54 9 11 XXXX-XXXX
              </a>
              <a 
                href="mailto:weeksport1310@gmail.com" 
                className="hover:text-[#F400A1] transition-colors"
              >
                weeksport1310@gmail.com
              </a>
            </div>
          </div>

        </div>
        
        {/* Enlace de Administrador Discreto */}
        <div className="mt-12 text-center">
          <Link 
            href="/admin/login" 
            className="font-sans text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ¿Es administrador del comercio? Ingrese aquí.
          </Link>
        </div>

        {/* Aviso Legal y Copyright */}
        <div className="mt-16 pt-6 border-t border-white/5 text-center flex flex-col gap-2">
          <p className="font-sans text-[10px] text-gray-600 max-w-2xl mx-auto leading-relaxed">
            La presente página es solo a título informativo. Para formalizar la compra usted será redirigido al contacto del vendedor una vez seleccionados los productos.
          </p>
          <p className="font-sans text-[10px] text-gray-600">
            &copy; 2026. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
