'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, Producto, VarianteStock } from '@/types'

interface CartContextType {
  cart: CartItem[];
  isLoaded: boolean;
  addItem: (producto: Producto, variante: VarianteStock, cantidad?: number) => void;
  removeItem: (variante_id: string) => void;
  updateQuantity: (variante_id: string, cantidad: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Cargar desde localStorage al inicio
  useEffect(() => {
    const savedCart = localStorage.getItem('weeksport_cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to parse cart', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Guardar en localStorage cada vez que el carrito cambia
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('weeksport_cart', JSON.stringify(cart))
    }
  }, [cart, isLoaded])

  const addItem = (producto: Producto, variante: VarianteStock, cantidad: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.variante_id === variante.id)
      if (existingItem) {
        return prevCart.map(item => 
          item.variante_id === variante.id 
            ? { ...item, cantidad: Math.min(item.cantidad + cantidad, variante.cantidad) } 
            : item
        )
      }
      return [...prevCart, { variante_id: variante.id, producto, variante, cantidad }]
    })
    setIsDrawerOpen(true) // Open drawer automatically when item is added
  }

  const removeItem = (variante_id: string) => {
    setCart((prevCart) => prevCart.filter(item => item.variante_id !== variante_id))
  }

  const updateQuantity = (variante_id: string, cantidad: number) => {
    setCart((prevCart) => 
      prevCart.map(item => {
        if (item.variante_id === variante_id) {
          // Asegurar no exceder el stock disponible ni bajar de 1
          const newQuantity = Math.max(1, Math.min(cantidad, item.variante.cantidad))
          return { ...item, cantidad: newQuantity }
        }
        return item
      })
    )
  }

  const clearCart = () => setCart([])

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0)
  const totalPrice = cart.reduce((acc, item) => acc + (item.variante.precio * item.cantidad), 0)

  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoaded,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isDrawerOpen,
        openDrawer,
        closeDrawer
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider')
  }
  return context
}
