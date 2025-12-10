// frontend/js/cart.js

const CART_KEY = 'cartItems';

// Lê o carrinho do localStorage
function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// Salva o carrinho
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// Quantidade total de itens
function getCartCount() {
  const items = getCart();
  return items.reduce((sum, item) => sum + (item.quantidade || 0), 0);
}

// Atualiza o badge do header
function syncCartBadge() {
  const badge = document.getElementById('cart-count-badge');
  if (!badge) return;
  badge.textContent = getCartCount();
}

// Adiciona produto ao carrinho
function addToCart(item) {
  // item esperado:
  // { id, nome, preco, imagemUrl?, lojaId, lojaNome, quantidade? }

  if (!item || !item.id) return;

  const cart = getCart();
  const existing = cart.find((p) => p.id === item.id);

  const qtyToAdd = item.quantidade && item.quantidade > 0 ? item.quantidade : 1;

  if (existing) {
    existing.quantidade += qtyToAdd;
  } else {
    cart.push({
      id: item.id,
      nome: item.nome,
      preco: Number(item.preco) || 0,
      imagemUrl: item.imagemUrl || null,
      lojaId: item.lojaId || null,
      lojaNome: item.lojaNome || '',
      quantidade: qtyToAdd,
    });
  }

  saveCart(cart);
  syncCartBadge();
}

// Atualiza quantidade de um item
function updateCartItemQuantity(productId, newQty) {
  const cart = getCart();
  const item = cart.find((p) => p.id === productId);
  if (!item) return;

  const qty = Number(newQty);
  if (Number.isNaN(qty) || qty <= 0) {
    // se ficar <=0, remove
    removeFromCart(productId);
    return;
  }

  item.quantidade = qty;
  saveCart(cart);
  syncCartBadge();
}

// Remove item
function removeFromCart(productId) {
  const cart = getCart().filter((p) => p.id !== productId);
  saveCart(cart);
  syncCartBadge();
}

// Limpa tudo
function clearCart() {
  saveCart([]);
  syncCartBadge();
}

// Ao carregar qualquer página que inclua cart.js, sincroniza o badge
document.addEventListener('DOMContentLoaded', () => {
  syncCartBadge();
});
