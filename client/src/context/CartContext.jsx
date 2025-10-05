import { createContext, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";
import api from "../utils/api";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cart data
  const { data: cartData, isLoading } = useQuery(
    ["cart"],
    () => api.get("/cart"),
    {
      enabled: isAuthenticated,
      onError: (error) => {
        console.error("Failed to fetch cart:", error);
      },
    },
  );

  // Get cart summary for header
  const { data: cartSummary } = useQuery(
    ["cart-summary"],
    () => api.get("/cart/summary"),
    {
      enabled: isAuthenticated,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  const addToCartMutation = useMutation(
    (itemData) => api.post("/cart/add", itemData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["cart"]);
        queryClient.invalidateQueries(["cart-summary"]);
        toast.success("Added to cart");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Failed to add to cart");
      },
    },
  );

  const updateCartItemMutation = useMutation(
    ({ itemId, quantity }) => api.put(`/cart/update/${itemId}`, { quantity }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["cart"]);
        queryClient.invalidateQueries(["cart-summary"]);
        toast.success("Cart updated");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Failed to update cart");
      },
    },
  );

  const removeFromCartMutation = useMutation(
    (itemId) => api.delete(`/cart/remove/${itemId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["cart"]);
        queryClient.invalidateQueries(["cart-summary"]);
        toast.success("Item removed from cart");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Failed to remove item");
      },
    },
  );

  const clearCartMutation = useMutation(() => api.delete("/cart/clear"), {
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
      queryClient.invalidateQueries(["cart-summary"]);
      toast.success("Cart cleared");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to clear cart");
    },
  });

  const validateCartMutation = useMutation(() => api.post("/cart/validate"), {
    onError: (error) => {
      console.error("Cart validation failed:", error);
    },
  });

  const addToCart = (productId, quantity = 1, variant = null) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }
    addToCartMutation.mutate({ productId, quantity, variant });
  };

  const updateCartItem = (itemId, quantity) => {
    if (!isAuthenticated) return;
    updateCartItemMutation.mutate({ itemId, quantity });
  };

  const removeFromCart = (itemId) => {
    if (!isAuthenticated) return;
    removeFromCartMutation.mutate(itemId);
  };

  const clearCart = () => {
    if (!isAuthenticated) return;
    clearCartMutation.mutate();
  };

  const validateCart = () => {
    if (!isAuthenticated) return;
    validateCartMutation.mutate();
  };

  const value = {
    cart: cartData?.cart,
    cartSummary,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    validateCart,
    isAddToCartLoading: addToCartMutation.isLoading,
    isUpdateCartLoading: updateCartItemMutation.isLoading,
    isRemoveFromCartLoading: removeFromCartMutation.isLoading,
    isClearCartLoading: clearCartMutation.isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
