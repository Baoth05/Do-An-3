/**
 * ==============================================================================
 * Module: CartContext.jsx
 * Mô tả: Context quản lý trạng thái giỏ hàng sàn TMĐT tập trung (Marketplace Cart).
 * Chức năng: Lưu trữ giỏ hàng trong localStorage, tự động gom nhóm sản phẩm theo gian hàng (groupedByShop),
 *            hỗ trợ thêm/bớt/xóa, chọn/bỏ chọn sản phẩm (Select Checkbox CRUD),
 *            kiểm tra giới hạn tồn kho, tính toán tổng số lượng và tổng tiền chuẩn xác.
 * ==============================================================================
 */
import { createContext, useState, useEffect, useMemo } from 'react';

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

  // Lưu giỏ hàng mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('marketplace_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [cartItems]);

  // Thêm vào giỏ hàng (Cart CRUD - Create / Update)
  const addToCart = (product, quantity = 1) => {
    const maxStock = product.soLuongThucTe || 999;

    setCartItems((prevItems) => {
      const existingIdx = prevItems.findIndex(
        (item) => item.sanPhamId === product.sanPhamId && item.khoHangId === product.khoHangId
      );

      if (existingIdx > -1) {
        const next = [...prevItems];
        const newQty = Math.min(next[existingIdx].quantity + quantity, maxStock);
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: newQty,
          selected: true,
          maxStock,
        };
        return next;
      }

      return [
        ...prevItems,
        {
          id: product.id,
          sanPhamId: product.sanPhamId,
          sku: product.sku,
          name: product.tenSanPham,
          price: product.giaBanHienTai || product.giaBan || 0,
          originalPrice: product.giaBan || product.giaBanHienTai || 0,
          image: product.hinhAnh,
          khoHangId: product.khoHangId,
          tenShop: product.tenShop || product.tenKho || 'Gian Hàng Chính Hãng',
          maxStock,
          quantity: Math.min(quantity, maxStock),
          selected: true, // Mặc định khi thêm mới là được chọn
        },
      ];
    });
  };

  // Cập nhật số lượng (+ / -)
  const updateQuantity = (sanPhamId, khoHangId, delta) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.sanPhamId === sanPhamId && item.khoHangId === khoHangId) {
            const nextQty = item.quantity + delta;
            const max = item.maxStock || 999;
            if (nextQty <= 0) return null; // Xóa nếu giảm về 0
            return { ...item, quantity: Math.min(nextQty, max) };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Thiết lập số lượng cụ thể qua input
  const setSpecificQuantity = (sanPhamId, khoHangId, rawQty) => {
    const val = parseInt(rawQty, 10);
    if (isNaN(val) || val <= 0) return;

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.sanPhamId === sanPhamId && item.khoHangId === khoHangId) {
          const max = item.maxStock || 999;
          return { ...item, quantity: Math.min(val, max) };
        }
        return item;
      })
    );
  };

  // Xóa 1 món khỏi giỏ (Cart CRUD - Delete)
  const removeFromCart = (sanPhamId, khoHangId) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.sanPhamId === sanPhamId && item.khoHangId === khoHangId)
      )
    );
  };

  // Xóa toàn bộ sản phẩm của 1 Shop
  const removeShopItems = (shopId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => (item.khoHangId || 1) !== shopId)
    );
  };

  // Xóa sạch giỏ (Cart CRUD - Clear All)
  const clearCart = () => {
    setCartItems([]);
  };

  // Chọn / bỏ chọn 1 sản phẩm
  const toggleSelectItem = (sanPhamId, khoHangId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.sanPhamId === sanPhamId && item.khoHangId === khoHangId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  // Chọn / bỏ chọn toàn bộ sản phẩm của 1 Shop
  const toggleSelectShop = (shopId, selectAll = null) => {
    setCartItems((prev) => {
      const shopItems = prev.filter((i) => (i.khoHangId || 1) === shopId);
      const isAllShopSelected = shopItems.every((i) => i.selected);
      const targetState = selectAll !== null ? selectAll : !isAllShopSelected;

      return prev.map((item) =>
        (item.khoHangId || 1) === shopId ? { ...item, selected: targetState } : item
      );
    });
  };

  // Chọn / bỏ chọn tất cả các món trong giỏ hàng
  const toggleSelectAll = (forceValue = null) => {
    setCartItems((prev) => {
      const isAllSelected = prev.length > 0 && prev.every((i) => i.selected);
      const targetState = forceValue !== null ? forceValue : !isAllSelected;
      return prev.map((item) => ({ ...item, selected: targetState }));
    });
  };

  // Gom nhóm sản phẩm theo Gian hàng (Multi-Shop Cart Blocks)
  const groupedByShop = useMemo(() => {
    const map = cartItems.reduce((acc, item) => {
      const shopId = item.khoHangId || 1;
      if (!acc[shopId]) {
        acc[shopId] = {
          cuaHangId: shopId,
          tenShop: item.tenShop,
          items: [],
          allSelected: true,
        };
      }
      acc[shopId].items.push(item);
      return acc;
    }, {});

    // Tính trạng thái allSelected cho từng shop
    Object.values(map).forEach((shop) => {
      shop.allSelected = shop.items.length > 0 && shop.items.every((i) => i.selected);
    });

    return Object.values(map);
  }, [cartItems]);

  // Các món hàng ĐÃ ĐƯỢC CHỌN (để mang sang Checkout)
  const selectedItems = useMemo(() => {
    return cartItems.filter((i) => i.selected);
  }, [cartItems]);

  const selectedGroupedByShop = useMemo(() => {
    return groupedByShop
      .map((shop) => ({
        ...shop,
        items: shop.items.filter((i) => i.selected),
      }))
      .filter((shop) => shop.items.length > 0);
  }, [groupedByShop]);

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedTotalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedTotalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const isAllSelected = cartItems.length > 0 && cartItems.every((i) => i.selected);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        groupedByShop,
        selectedItems,
        selectedGroupedByShop,
        totalQuantity,
        totalPrice,
        selectedTotalQuantity,
        selectedTotalPrice,
        isAllSelected,
        addToCart,
        updateQuantity,
        setSpecificQuantity,
        removeFromCart,
        removeShopItems,
        clearCart,
        toggleSelectItem,
        toggleSelectShop,
        toggleSelectAll,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
