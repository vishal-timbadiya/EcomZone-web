// Cart item type definition
export interface CartItem {
  productId: string;
  name?: string;
  imageUrl?: string;
  singleQty: number;
  cartonQty: number;
  cartonQtyPerBox?: number;
}

/**
 * Get cart from localStorage
 * @returns Cart items array or empty array if not found
 */
export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const cartData = localStorage.getItem("cart");
    if (!cartData) return [];
    
    const parsed = JSON.parse(cartData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading cart from localStorage:", error);
    return [];
  }
}

/**
 * Save cart to localStorage and dispatch update event
 * @param cart - Array of cart items to save
 */
export function saveCart(cart: CartItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
}

/**
 * Clear cart from localStorage
 */
export function clearCart(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Error clearing cart from localStorage:", error);
  }
}

/**
 * Add item to cart or update quantity if already exists
 * @param newItem - Item to add to cart
 */
export function addToCart(newItem: CartItem): CartItem[] {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (item) => item.productId === newItem.productId
  );

  let updatedCart: CartItem[];

  if (existingIndex !== -1) {
    // Update existing item quantity
    updatedCart = cart.map((item, index) => {
      if (index === existingIndex) {
        return {
          ...item,
          singleQty: item.singleQty + newItem.singleQty,
          cartonQty: item.cartonQty + newItem.cartonQty,
        };
      }
      return item;
    });
  } else {
    // Add new item
    updatedCart = [...cart, newItem];
  }

  saveCart(updatedCart);
  return updatedCart;
}

/**
 * Remove item from cart by productId
 * @param productId - ID of product to remove
 */
export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart();
  const updatedCart = cart.filter((item) => item.productId !== productId);
  saveCart(updatedCart);
  return updatedCart;
}

/**
 * Get cart item count (total units)
 */
export function getCartCount(): number {
  const cart = getCart();
  return cart.reduce((count, item) => {
    return count + item.singleQty + (item.cartonQty * (item.cartonQtyPerBox || 0));
  }, 0);
}

