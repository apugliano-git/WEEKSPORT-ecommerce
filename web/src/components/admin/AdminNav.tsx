'use client';

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
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/60 shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
            <span className="text-[#FF5C00] font-black text-lg tracking-tight">WEEK</span>
            <span className="text-white font-black text-lg tracking-tight">SPORT</span>
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/25'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70 border border-transparent'
                  }`}
                >
                  <span className={active ? 'text-[#FF5C00]' : 'text-zinc-500'}>{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Acceso al catálogo público */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="hidden sm:inline">Ver tienda</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
