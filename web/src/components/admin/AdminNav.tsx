'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  {
    href: '/admin',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
  {
    href: '/admin/inventario/nuevo',
    label: 'Nuevo Producto',
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/><path d="M12 5v14"/>
      </svg>
    ),
  },
  {
    href: '/admin/productos',
    label: 'Productos',
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
      </svg>
    ),
  },
  {
    href: '/admin/stock',
    label: 'Stock',
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
      </svg>
    ),
  },
  {
    href: '/admin/ventas',
    label: 'Validar Ventas',
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    ),
  },
  {
    href: '/admin/configuracion',
    label: 'Configuración',
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    href: '/admin/categorias',
    label: 'Categorías',
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
      </svg>
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const currentLink = navLinks.find(link => isActive(link.href, link.exact)) || navLinks[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-[#0F0F12]/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Lado Izquierdo: Brand + Mobile Dropdown */}
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            {/* Brand */}
            <Link href="/admin" className="flex items-center gap-1 sm:gap-2.5 shrink-0" onClick={() => setIsOpen(false)}>
              <span className="text-[#F400A1] font-black text-lg tracking-tight font-display">WEEK</span>
              <span className="text-white font-black text-lg tracking-tight font-display">SPORT</span>
              <span className="hidden sm:inline-block ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-white/10 px-1.5 py-0.5 rounded-lg">
                Admin
              </span>
            </Link>

            <div className="h-6 w-px bg-white/10 sm:hidden block"></div>

            {/* Mobile Dropdown Toggle (Visible ONLY on mobile) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${
                isOpen ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <span className="text-sm font-bold text-white">{currentLink.label}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`text-[#F400A1] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {/* Mobile Dropdown Menu */}
            {isOpen && (
              <div className="sm:hidden absolute top-[60px] left-0 bg-[#1A1A20] border border-white/10 rounded-xl shadow-2xl p-2 w-64 flex flex-col gap-1 animate-fadeIn origin-top-left">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                  Menú Principal
                </div>
                {navLinks.map((link) => {
                  const active = isActive(link.href, link.exact);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                        active
                          ? 'bg-[#F400A1]/15 text-[#F400A1]'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={active ? 'text-[#F400A1]' : 'text-gray-500'}>{link.icon}</span>
                      {link.label}
                    </Link>
                  );
                })}
                <div className="h-px bg-white/5 my-1"></div>
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  Volver a la tienda
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Nav Links (Visible ONLY on desktop) */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    active
                      ? 'bg-[#F400A1]/15 text-[#F400A1] border border-[#F400A1]/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={active ? 'text-[#F400A1]' : 'text-gray-500'}>{link.icon}</span>
                  <span className="inline">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Acceso al catálogo público (Visible ONLY on desktop, since mobile has it in dropdown) */}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span>Ver tienda</span>
          </Link>

        </div>
      </div>
    </nav>
  );
}
