// frontend/js/pagamento.js

const SELECTED_ADDRESS_KEY = 'selectedAddress';
const PAYMENT_SELECTION_KEY = 'selectedPayment';

document.addEventListener('DOMContentLoaded', () => {
  // Se não tiver endereço ou carrinho vazio, volta etapas
  const address = loadSelectedAddress();
  const cartItems = getCart();

  if (!cartItems.length) {
    alert('Seu carrinho está vazio. Adicione itens antes de pagar.');
    window.location.href = 'carrinho.html';
    return;
  }

  if (!address) {
    alert('Selecione um endereço antes de escolher o pagamento.');
    window.location.href = 'endereco.html';
    return;
  }

  renderAddress(address);
  renderTotals(cartItems);
  setupPaymentForm();
  setupContinueButton();
});

function loadSelectedAddress() {
  const raw = localStorage.getItem(SELECTED_ADDRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderAddress(address) {
  const container = document.getElementById('payment-address');
  if (!container) return;

  const linha1 = [
    address.logradouro || '',
    address.numero || '',
    address.bairro || '',
  ]
    .filter(Boolean)
    .join(', ');

  const linha2 = [
    address.cidade || '',
    address.estado || '',
    address.cep || '',
  ]
    .filter(Boolean)
    .join(' - ');

  container.innerHTML = `
    <div class="small">
      <div><strong>${address.apelido || 'Endereço'}</strong></div>
      <div>${address.nome || ''}</div>
      <div>${linha1 || ''}</div>
      <div class="text-muted">${linha2 || ''}</div>
      ${
        address.complemento
          ? `<div class="text-muted">${address.complemento}</div>`
          : ''
      }
    </div>
  `;
}

function renderTotals(cartItems) {
  const subtotalSpan = document.getElementById('payment-subtotal');
  const totalSpan = document.getElementById('payment-total');

  let subtotal = 0;
  cartItems.forEach((item) => {
    subtotal += (item.preco || 0) * (item.quantidade || 0);
  });

  const formatted = subtotal.toFixed(2).replace('.', ',');

  if (subtotalSpan) subtotalSpan.textContent = `R$ ${formatted}`;
  if (totalSpan) totalSpan.textContent = `R$ ${formatted}`;
}

function setupPaymentForm() {
  const form = document.getElementById('payment-form');
  const cardFields = document.getElementById('card-fields');
  const errorBox = document.getElementById('payment-error');

  if (!form) return;

  const radios = form.querySelectorAll('input[name="paymentMethod"]');
  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (errorBox) errorBox.textContent = '';

      if (radio.value === 'CARTAO') {
        cardFields?.classList.remove('d-none');
      } else {
        cardFields?.classList.add('d-none');
      }
    });
  });

  // Se já havia método salvo, marca
  const savedRaw = localStorage.getItem(PAYMENT_SELECTION_KEY);
  if (savedRaw) {
    try {
      const saved = JSON.parse(savedRaw);
      const method = saved.metodo;
      const radio = form.querySelector(
        `input[name="paymentMethod"][value="${method}"]`
      );
      if (radio) {
        radio.checked = true;
        if (method === 'CARTAO') {
          cardFields?.classList.remove('d-none');
        }
      }
    } catch {
      // ignore
    }
  }
}

function setupContinueButton() {
  const btn = document.getElementById('payment-continue-btn');
  const form = document.getElementById('payment-form');
  const errorBox = document.getElementById('payment-error');

  if (!btn || !form) return;

  btn.addEventListener('click', () => {
    if (errorBox) errorBox.textContent = '';

    const methodInput = form.querySelector(
      'input[name="paymentMethod"]:checked'
    );

    if (!methodInput) {
      if (errorBox) {
        errorBox.textContent = 'Selecione uma forma de pagamento.';
      } else {
        alert('Selecione uma forma de pagamento.');
      }
      return;
    }

    const metodo = methodInput.value; // CARTAO | PIX | DINHEIRO

    let detalhes = null;

    if (metodo === 'CARTAO') {
      const cardHolder = document.getElementById('card-holder').value.trim();
      const cardNumber = document.getElementById('card-number').value.trim();
      const cardExpiry = document.getElementById('card-expiry').value.trim();
      const cardCvv = document.getElementById('card-cvv').value.trim();

      if (!cardHolder || !cardNumber) {
        if (errorBox) {
          errorBox.textContent =
            'Preencha ao menos nome e número do cartão (simulação).';
        }
        return;
      }

      // Salvamos só últimos dígitos, por segurança (mesmo sendo simulado)
      const last4 = cardNumber.replace(/\D/g, '').slice(-4);

      detalhes = {
        nome: cardHolder,
        final: last4,
        validade: cardExpiry,
      };
    }

    const paymentInfo = {
      metodo, // CARTAO | PIX | DINHEIRO
      detalhes, // ou null
    };

    localStorage.setItem(PAYMENT_SELECTION_KEY, JSON.stringify(paymentInfo));

    // Próxima etapa: finalização da compra (item 11)
    // por enquanto, só redirecionamos para uma página futura
    window.location.href = 'finalizacao.html';
  });
}
