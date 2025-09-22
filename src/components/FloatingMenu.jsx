import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, Calendar, Menu, ShoppingCart } from "lucide-react";
import { useEnterpriseNavigation } from "../hooks/useEnterpriseNavigation";
import { useCart } from "../contexts/useCart";

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { getEnterpriseUrl } = useEnterpriseNavigation();
  const { items } = useCart();
  const menuRef = useRef(null);

  // Componente para ícone do carrinho com contador
  const CartIconWithBadge = () => (
    <div className="relative">
      <ShoppingCart className="w-6 h-6" />
      {items.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {items.length > 99 ? "99+" : items.length}
        </span>
      )}
    </div>
  );

  // Fechar menu quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const menuItems = [
    {
      label: "Início",
      icon: <Home className="w-6 h-6" />,
      to: getEnterpriseUrl(),
    },
    {
      label: "Carrinho",
      icon: <CartIconWithBadge />,
      to: getEnterpriseUrl("cart"),
    },
    {
      label: "Perfil",
      icon: <User className="w-6 h-6" />,
      to: getEnterpriseUrl("profile"),
    },
    {
      label: "Agendamento",
      icon: <Calendar className="w-6 h-6" />,
      to: getEnterpriseUrl("service-details?category=Todos&title=Serviços"),
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
    >
      {open && (
        <div className="flex flex-col items-end gap-3 mb-2 animate-fade-in">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-full text-gray-800 font-medium hover:bg-amber-100 transition-colors ${
                location.pathname === item.to ? "bg-amber-100" : ""
              }`}
              onClick={() => setOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
      <button
        className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
        title="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu className="w-8 h-8" />
      </button>
    </div>
  );
}
