// src/context/CartContext.jsx
import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('marketplace_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('marketplace_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Thêm vào giỏ hàng
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingIdx = prevItems.findIndex(
        (item) => item.sanPhamId === product.sanPhamId && item.khoHangId === product.khoHangId
      );

      if (existingIdx > -1) {
        const next = [...prevItems];
        next[existingIdx].quantity += quantity;
        return next;
      }

      return [
        ...prevItems,
        {
          id: product.id,
          sanPhamId: product.sanPhamId,
          sku: product.sku,
          name: product.tenSanPham,
          price: product.giaBanHienTai || product.giaBan,
          image: product.hinhAnh,
          khoHangId: product.khoHangId,
          tenShop: product.tenShop || product.tenKho || 'Gian Hàng Chính Hãng',
          quantity,
        },
      ];
    });
  };

  // Cập nhật số lượng
  const updateQuantity = (sanPhamId, khoHangId, delta) => {
    setCartItems((prevItems) => {
      return prevItems
        .map((item) => {
          if (item.sanPhamId === sanPhamId && item.khoHangId === khoHangId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Xóa món khỏi giỏ
  const removeFromCart = (sanPhamId, khoHangId) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.sanPhamId === sanPhamId && item.khoHangId === khoHangId)
      )
    );
  };

  // Xóa sạch giỏ
  const clearCart = () => {
    setCartItems([]);
  };

  // Gom nhóm sản phẩm theo Gian hàng (Multi-Shop Cart Blocks)
  const groupedByShop = cartItems.reduce((acc, item) => {
    const shopId = item.khoHangId || 1;
    if (!acc[shopId]) {
      acc[shopId] = {
        cuaHangId: shopId,
        tenShop: item.tenShop,
        items: [],
      };
    }
    acc[shopId].items.push(item);
    return acc;
  }, {});

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        groupedByShop: Object.values(groupedByShop),
        totalQuantity,
        totalPrice,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

