// frontend/js/finalizacao.js

const SELECTED_ADDRESS_KEY = 'selectedAddress';
const PAYMENT_SELECTION_KEY = 'selectedPayment';
const LAST_ORDER_KEY = 'lastOrder';

document.addEventListener('DOMContentLoaded', () => {
  const alertBox = document.getElementById('finalizacao-alert');

  const cartItems = getCart();
  if (!cartItems.length) {
    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert alert-warning">
          Seu carrinho está vazio. Adicione itens antes de finalizar a compra.
        </div>
      `;
    }
    setTimeout(() => {
      window.location.href = 'carrinho.html';
    }, 2000);
    return;
  }

  const address = loadSelectedAddress();
  if (!address) {
    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert alert-warning">
          Nenhum endereço selecionado. Selecione um endereço antes de finalizar.
        </div>
      `;
    }
    setTimeout(() => {
      window.location.href = 'endereco.html';
    }, 2000);
    return;
  }

  const payment = loadSelectedPayment();
  if (!payment) {
    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert alert-warning">
          Nenhuma forma de pagamento selecionada. Escolha uma forma de pagamento antes de finalizar.
        </div>
      `;
    }
    setTimeout(() => {
      window.location.href = 'pagamento.html';
    }, 2000);
    return;
  }

  renderItens(cartItems);
  renderEndereco(address);
  renderPagamento(payment);
  renderResumo(cartItems);

  setupConfirmButton(cartItems, address, payment);
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

function loadSelectedPayment() {
  const raw = localStorage.getItem(PAYMENT_SELECTION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderItens(items) {
  const container = document.getElementById('finalizacao-itens');
  if (!container) return;

  container.innerHTML = items
    .map((item) => {
      const itemTotal = (item.preco || 0) * (item.quantidade || 0);
      const precoFormatado = (item.preco || 0).toFixed(2).replace('.', ',');
      const totalFormatado = itemTotal.toFixed(2).replace('.', ',');

      return `
        <div class="d-flex align-items-start gap-3 border-bottom py-3">
          <div class="flex-shrink-0">
            ${
              item.imagemUrl
                ? `<img src="${item.imagemUrl}" alt="${item.nome}" class="rounded" style="width:64px;height:64px;object-fit:cover;">`
                : `
                  <div class="rounded bg-light d-flex align-items-center justify-content-center" style="width:64px;height:64px;">
                    <i class="bi bi-box-seam text-muted"></i>
                  </div>
                `
            }
          </div>
          <div class="flex-grow-1">
            <div class="fw-semibold">${item.nome}</div>
            ${
              item.lojaNome
                ? `<div class="small text-muted">Vendido por ${item.lojaNome}</div>`
                : ''
            }
            <div class="small mt-1">
              Quantidade: <strong>${item.quantidade}</strong> &middot;
              Preço: <strong>R$ ${precoFormatado}</strong>
            </div>
          </div>
          <div class="text-end small">
            <div class="text-muted">Total</div>
            <div class="fw-semibold">R$ ${totalFormatado}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderEndereco(address) {
  const container = document.getElementById('finalizacao-endereco');
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

function renderPagamento(payment) {
  const container = document.getElementById('finalizacao-pagamento');
  if (!container) return;

  let descricao = '';
  if (payment.metodo === 'CARTAO') {
    const final = payment.detalhes?.final || '****';
    descricao = `Cartão de crédito • final ${final}`;
  } else if (payment.metodo === 'PIX') {
    descricao = 'Pix (simulação de pagamento instantâneo)';
  } else if (payment.metodo === 'DINHEIRO') {
    descricao = 'Dinheiro na entrega';
  } else {
    descricao = 'Método desconhecido';
  }

  const label =
    payment.metodo === 'CARTAO'
      ? 'Cartão de crédito'
      : payment.metodo === 'PIX'
      ? 'Pix'
      : payment.metodo === 'DINHEIRO'
      ? 'Dinheiro'
      : payment.metodo;

  container.innerHTML = `
    <div class="small">
      <div><strong>${label}</strong></div>
      <div class="text-muted">${descricao}</div>
    </div>
  `;
}

function renderResumo(items) {
  const subtotalSpan = document.getElementById('finalizacao-subtotal');
  const totalSpan = document.getElementById('finalizacao-total');

  let subtotal = 0;
  items.forEach((item) => {
    subtotal += (item.preco || 0) * (item.quantidade || 0);
  });

  const formatted = subtotal.toFixed(2).replace('.', ',');

  if (subtotalSpan) subtotalSpan.textContent = `R$ ${formatted}`;
  if (totalSpan) totalSpan.textContent = `R$ ${formatted}`;
}

function setupConfirmButton(items, address, payment) {
  const btn = document.getElementById('finalizacao-confirmar-btn');
  const alertBox = document.getElementById('finalizacao-alert');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // Monta um "pedido" fake
    const now = new Date();
    const orderId = `PED-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(
      now.getHours()
    ).padStart(2, '0')}${String(now.getMinutes()).padStart(
      2,
      '0'
    )}${String(now.getSeconds()).padStart(2, '0')}`;

    let subtotal = 0;
    items.forEach((item) => {
      subtotal += (item.preco || 0) * (item.quantidade || 0);
    });

    const pedido = {
      id: orderId,
      criadoEm: now.toISOString(),
      itens: items,
      endereco: address,
      pagamento: payment,
      subtotal,
      total: subtotal, // se tivesse frete, somaria aqui
      status: 'CONFIRMADO', // simulação
    };

    // Salva como "último pedido" (poderíamos ter lista de pedidos depois)
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(pedido));

    // Limpa carrinho e seleções
    clearCart();
    localStorage.removeItem(SELECTED_ADDRESS_KEY);
    localStorage.removeItem(PAYMENT_SELECTION_KEY);

    syncCartBadge();

    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert alert-success">
          <strong>Pedido confirmado!</strong><br/>
          Código do pedido: <code>${orderId}</code><br/>
          Você pode simular uma tela futura de acompanhamento de pedidos usando esse código.
        </div>
      `;
    }

    btn.disabled = true;
    btn.textContent = 'Pedido confirmado';

    // Opcional: redirecionar de volta para a home depois de alguns segundos
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
  });
}
