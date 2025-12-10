// frontend/js/pedidos_vendedor.js

// Base da API (mesma lógica usada em outras páginas)
const API_BASE_URL = window.API_BASE_URL || '/api';
const PEDIDOS_ENDPOINT = `${API_BASE_URL}/pedidos/minha-loja`; 
// 👉 ajuste se o seu backend usar outro caminho, ex: /pedidos/vendedor

let todosPedidos = [];
let pedidosFiltrados = [];
let pedidoAtual = null;

// Helpers de elementos
const els = {};

document.addEventListener('DOMContentLoaded', () => {
  // Confere usuário logado
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user || user.tipo !== 'VENDEDOR') {
    // Se quiser, pode redirecionar:
    // window.location.href = 'login.html';
    console.warn('Usuário não é vendedor ou não está logado.');
  }

  cacheElements();
  configurarFiltros();
  carregarPedidos();
  configurarModalStatus();
});

/* ============================================================
   CACHE DE ELEMENTOS
   ============================================================ */

function cacheElements() {
  els.loading = document.getElementById('pedidos-loading');
  els.empty = document.getElementById('pedidos-empty');
  els.error = document.getElementById('pedidos-error');
  els.tabelaWrapper = document.getElementById('pedidos-tabela-wrapper');
  els.tbody = document.getElementById('pedidos-tbody');

  els.inputBusca = document.getElementById('filtro-busca');
  els.selectStatus = document.getElementById('filtro-status');
  els.selectOrdenacao = document.getElementById('filtro-ordenacao');
  els.btnLimparFiltros = document.getElementById('btn-limpar-filtros');

  // Modal
  els.modalEl = document.getElementById('modal-detalhe-pedido');
  els.modal = els.modalEl ? new bootstrap.Modal(els.modalEl) : null;

  els.modalCodigo = document.getElementById('modal-pedido-codigo');
  els.modalData = document.getElementById('modal-pedido-data');
  els.modalClienteNome = document.getElementById('modal-cliente-nome');
  els.modalClienteContato = document.getElementById('modal-cliente-contato');
  els.modalEndereco = document.getElementById('modal-endereco-entrega');
  els.modalPagamentoForma = document.getElementById('modal-pagamento-forma');
  els.modalPagamentoTotal = document.getElementById('modal-pagamento-total');
  els.modalItensLista = document.getElementById('modal-itens-lista');
  els.modalStatusSelect = document.getElementById('modal-status-select');
  els.modalStatusAtualTexto = document.getElementById('modal-status-atual-texto');
  els.modalObs = document.getElementById('modal-pedido-observacao');
  els.btnSalvarStatus = document.getElementById('btn-salvar-status');
}

/* ============================================================
   AUTH HEADERS
   ============================================================ */

function getAuthHeaders() {
  const token =
    (typeof getToken === 'function' && getToken()) ||
    localStorage.getItem('token') ||
    null;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/* ============================================================
   CARREGAR PEDIDOS DO VENDEDOR
   ============================================================ */

async function carregarPedidos() {
  if (!els.loading || !els.empty || !els.error || !els.tbody) return;

  els.loading.classList.remove('d-none');
  els.empty.classList.add('d-none');
  els.error.classList.add('d-none');
  els.tabelaWrapper.classList.add('d-none');
  els.tbody.innerHTML = '';

  try {
    const res = await fetch(PEDIDOS_ENDPOINT, {
      headers: getAuthHeaders(),
    });

    // 👉 se não houver pedidos, backend responde 204
    if (res.status === 204) {
      todosPedidos = [];
      pedidosFiltrados = [];

      els.loading.classList.add('d-none');
      els.empty.classList.remove('d-none');
      els.tabelaWrapper.classList.add('d-none');
      return;
    }

    if (!res.ok) {
      throw new Error('Falha ao buscar pedidos');
    }

    const data = await res.json();

    const pedidos = Array.isArray(data) ? data : data.pedidos || [];

    todosPedidos = pedidos;
    pedidosFiltrados = [...todosPedidos];

    if (!pedidos || pedidos.length === 0) {
      els.loading.classList.add('d-none');
      els.empty.classList.remove('d-none');
      return;
    }

    aplicarFiltrosEOrdenacao();
  } catch (err) {
    console.error('Erro ao carregar pedidos:', err);
    els.loading.classList.add('d-none');
    els.error.classList.remove('d-none');
  }
}

  

/* ============================================================
   FILTROS E ORDENAÇÃO
   ============================================================ */

function configurarFiltros() {
  if (els.inputBusca) {
    els.inputBusca.addEventListener('input', () => {
      aplicarFiltrosEOrdenacao();
    });
  }

  if (els.selectStatus) {
    els.selectStatus.addEventListener('change', () => {
      aplicarFiltrosEOrdenacao();
    });
  }

  if (els.selectOrdenacao) {
    els.selectOrdenacao.addEventListener('change', () => {
      aplicarFiltrosEOrdenacao();
    });
  }

  if (els.btnLimparFiltros) {
    els.btnLimparFiltros.addEventListener('click', () => {
      if (els.inputBusca) els.inputBusca.value = '';
      if (els.selectStatus) els.selectStatus.value = '';
      if (els.selectOrdenacao) els.selectOrdenacao.value = 'mais-recentes';
      aplicarFiltrosEOrdenacao();
    });
  }
}

function aplicarFiltrosEOrdenacao() {
  if (!todosPedidos) return;

  const termo = (els.inputBusca?.value || '').trim().toLowerCase();
  const statusFiltro = els.selectStatus?.value || '';
  const ordenacao = els.selectOrdenacao?.value || 'mais-recentes';

  let lista = [...todosPedidos];

  // Filtro de busca (código ou cliente)
  if (termo) {
    lista = lista.filter((pedido) => {
      const id = String(pedido.id || '');
      const codigo = gerarCodigoPedido(pedido);
      const clienteNome =
        (pedido.cliente && (pedido.cliente.nome || pedido.cliente.nomeCompleto)) ||
        pedido.clienteNome ||
        pedido.nomeCliente ||
        '';

      const texto = `${id} ${codigo} ${clienteNome}`.toLowerCase();
      return texto.includes(termo);
    });
  }

  // Filtro de status
  if (statusFiltro) {
    lista = lista.filter((pedido) => {
      const s = normalizarStatus(pedido.status);
      return s === statusFiltro;
    });
  }

  // Ordenação
  lista.sort((a, b) => {
    switch (ordenacao) {
      case 'mais-antigos':
        return getDataPedido(a) - getDataPedido(b);
      case 'maior-valor':
        return getValorTotal(b) - getValorTotal(a);
      case 'menor-valor':
        return getValorTotal(a) - getValorTotal(b);
      case 'mais-recentes':
      default:
        return getDataPedido(b) - getDataPedido(a);
    }
  });

  pedidosFiltrados = lista;
  renderTabela();
}

/* ============================================================
   RENDERIZAÇÃO DA TABELA
   ============================================================ */

function renderTabela() {
  if (!els.tbody || !els.loading || !els.empty || !els.tabelaWrapper) return;

  els.tbody.innerHTML = '';

  if (!pedidosFiltrados || pedidosFiltrados.length === 0) {
    els.loading.classList.add('d-none');
    els.empty.classList.remove('d-none');
    els.tabelaWrapper.classList.add('d-none');
    return;
  }

  els.loading.classList.add('d-none');
  els.empty.classList.add('d-none');
  els.tabelaWrapper.classList.remove('d-none');

  const linhasHtml = pedidosFiltrados.map((pedido) => {
    const codigo = gerarCodigoPedido(pedido);
    const dataStr = formatarDataHoraCurta(getDataPedido(pedido));

    const clienteNome =
      (pedido.cliente && (pedido.cliente.nome || pedido.cliente.nomeCompleto)) ||
      pedido.clienteNome ||
      pedido.nomeCliente ||
      'Cliente';

    const total = formatarPreco(getValorTotal(pedido));
    const formaPagamento = formatarFormaPagamento(pedido.formaPagamento || pedido.forma_pagamento);

    const itens = pedido.itens || pedido.itensPedido || pedido.itens_pedido || [];
    const quantidadeItens = Array.isArray(itens)
      ? itens.reduce((acc, item) => acc + (item.quantidade || item.qtd || 1), 0)
      : 0;

    const statusNormalizado = normalizarStatus(pedido.status);
    const { labelStatus, badgeClass } = getInfoStatus(statusNormalizado);

    return `
      <tr>
        <td>
          <div class="d-flex flex-column">
            <span class="pedido-codigo">${codigo}</span>
            <span class="pedido-data">${dataStr}</span>
          </div>
        </td>
        <td>
          <span class="pedido-cliente-nome">${escapeHtml(clienteNome)}</span>
        </td>
        <td class="text-center">
          ${quantidadeItens}
        </td>
        <td class="text-end">
          ${total}
        </td>
        <td>
          <span class="text-muted small">${formaPagamento}</span>
        </td>
        <td>
          <span class="pedido-status-badge ${badgeClass}">
            ${labelStatus}
          </span>
        </td>
        <td class="text-end">
          <button
            class="btn btn-outline-primary btn-sm btn-ver-pedido"
            type="button"
            data-pedido-id="${pedido.id}"
          >
            <i class="bi bi-eye me-1"></i>
            Ver detalhes
          </button>
        </td>
      </tr>
    `;
  });

  els.tbody.innerHTML = linhasHtml.join('');

  // Liga eventos nos botões "Ver detalhes"
  els.tbody.querySelectorAll('.btn-ver-pedido').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-pedido-id'));
      const pedido = todosPedidos.find((p) => Number(p.id) === id);
      if (pedido) {
        abrirModalPedido(pedido);
      }
    });
  });
}

/* ============================================================
   MODAL: VER DETALHES E ATUALIZAR STATUS
   ============================================================ */

function configurarModalStatus() {
  if (!els.btnSalvarStatus) return;

  els.btnSalvarStatus.addEventListener('click', async () => {
    if (!pedidoAtual || !els.modalStatusSelect) return;

    const novoStatus = els.modalStatusSelect.value;
    if (!novoStatus) return;

    try {
      els.btnSalvarStatus.disabled = true;
      els.btnSalvarStatus.innerText = 'Salvando...';

      // Exemplo de endpoint de atualização de status:
      // PATCH /api/pedidos/:id/status  { status: "EM_PREPARO" }
      const res = await fetch(`${API_BASE_URL}/pedidos/${pedidoAtual.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar status do pedido');
      }

      const pedidoAtualizado = await res.json();

      // Atualiza na lista em memória
      todosPedidos = todosPedidos.map((p) =>
        p.id === pedidoAtualizado.id ? pedidoAtualizado : p
      );
      pedidosFiltrados = pedidosFiltrados.map((p) =>
        p.id === pedidoAtualizado.id ? pedidoAtualizado : p
      );

      pedidoAtual = pedidoAtualizado;

      // Atualiza UI
      aplicarFiltrosEOrdenacao(); // re-render tabela
      preencherStatusModal(pedidoAtual);

      // Feedback simples (poderia ser toast)
      els.modalStatusAtualTexto.classList.remove('text-muted');
      els.modalStatusAtualTexto.classList.add('text-success');
      els.modalStatusAtualTexto.innerText =
        'Status atualizado com sucesso: ' +
        getInfoStatus(normalizarStatus(pedidoAtual.status)).labelStatus;
    } catch (err) {
      console.error(err);
      alert('Não foi possível atualizar o status do pedido. Tente novamente.');
    } finally {
      els.btnSalvarStatus.disabled = false;
      els.btnSalvarStatus.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Salvar status';
    }
  });
}

function abrirModalPedido(pedido) {
  pedidoAtual = pedido;

  if (!els.modal) return;

  // Cabeçalho
  if (els.modalCodigo) {
    els.modalCodigo.textContent = gerarCodigoPedido(pedido);
  }

  if (els.modalData) {
    els.modalData.textContent = formatarDataHoraLonga(getDataPedido(pedido));
  }

  // Dados do cliente
  const cliente =
    pedido.cliente ||
    {
      nome: pedido.clienteNome || pedido.nomeCliente || 'Cliente',
      telefone: pedido.clienteTelefone || '',
      email: pedido.clienteEmail || '',
    };

  if (els.modalClienteNome) {
    els.modalClienteNome.textContent = cliente.nome || 'Cliente';
  }

  if (els.modalClienteContato) {
    const contato = [cliente.telefone, cliente.email]
      .filter(Boolean)
      .join(' · ');
    els.modalClienteContato.textContent = contato || '—';
  }

  // Endereço e pagamento
  if (els.modalEndereco) {
    els.modalEndereco.textContent =
      pedido.enderecoEntrega ||
      pedido.endereco_entrega ||
      '—';
  }

  if (els.modalPagamentoForma) {
    els.modalPagamentoForma.textContent = formatarFormaPagamento(
      pedido.formaPagamento || pedido.forma_pagamento
    );
  }

  if (els.modalPagamentoTotal) {
    els.modalPagamentoTotal.textContent = formatarPreco(getValorTotal(pedido));
  }

  // Observações
  if (els.modalObs) {
    const obs =
      pedido.observacao ||
      pedido.observacoes ||
      pedido.obs ||
      '';
    els.modalObs.textContent = obs
      ? `Observações do cliente: ${obs}`
      : 'Observações do cliente: —';
  }

  // Itens do pedido
  if (els.modalItensLista) {
    const itens = pedido.itens || pedido.itensPedido || pedido.itens_pedido || [];
    if (!itens.length) {
      els.modalItensLista.innerHTML =
        '<li class="text-muted">Nenhum item encontrado neste pedido.</li>';
    } else {
      els.modalItensLista.innerHTML = itens
        .map((item) => {
          const nome =
            (item.produto && item.produto.nome) ||
            item.nomeProduto ||
            item.nome_produto ||
            'Produto';

          const qtd = item.quantidade || item.qtd || 1;
          const precoUnit = formatarPreco(
            item.precoUnitario || item.preco_unitario || item.preco || 0
          );
          const subtotal = formatarPreco(
            item.subtotal || (item.precoUnitario || item.preco_unitario || item.preco || 0) * qtd
          );

          return `
            <li class="d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-semibold">${escapeHtml(nome)}</div>
                <div class="text-muted small">${qtd} x ${precoUnit}</div>
              </div>
              <div class="fw-semibold small">
                ${subtotal}
              </div>
            </li>
          `;
        })
        .join('');
    }
  }

  // Status
  preencherStatusModal(pedido);

  els.modal.show();
}

function preencherStatusModal(pedido) {
  const statusNormalizado = normalizarStatus(pedido.status);
  const { labelStatus } = getInfoStatus(statusNormalizado);

  if (els.modalStatusSelect) {
    els.modalStatusSelect.value = statusNormalizado || 'PENDENTE';
  }

  if (els.modalStatusAtualTexto) {
    els.modalStatusAtualTexto.classList.remove('text-success');
    els.modalStatusAtualTexto.classList.add('text-muted');
    els.modalStatusAtualTexto.textContent = `Status atual: ${labelStatus}`;
  }
}

/* ============================================================
   HELPERS DE FORMATAÇÃO
   ============================================================ */

function gerarCodigoPedido(pedido) {
  // Ex: #1024  ou #0001
  const id = pedido.codigo || pedido.code || pedido.id;
  if (!id && id !== 0) return '#—';
  const num = Number(id);
  if (Number.isNaN(num)) return `#${id}`;
  return '#' + String(num).padStart(4, '0');
}

function getDataPedido(pedido) {
  const raw =
    pedido.dataPedido ||
    pedido.data_pedido ||
    pedido.createdAt ||
    pedido.created_at ||
    pedido.data ||
    null;

  const d = raw ? new Date(raw) : new Date();
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

function formatarDataHoraCurta(date) {
  try {
    return (
      date.toLocaleDateString('pt-BR') +
      ' · ' +
      date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  } catch {
    return '';
  }
}

function formatarDataHoraLonga(date) {
  try {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function getValorTotal(pedido) {
  const val =
    pedido.valorTotal ||
    pedido.valor_total ||
    pedido.total ||
    0;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function formatarPreco(valor) {
  const num = Number(valor);
  if (Number.isNaN(num)) return 'R$ --';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatarFormaPagamento(forma) {
  if (!forma) return '—';

  const f = String(forma).toUpperCase();
  if (f.includes('PIX')) return 'Pix';
  if (f.includes('CART')) return 'Cartão';
  if (f.includes('DINHEIRO') || f.includes('CASH')) return 'Dinheiro';
  if (f.includes('BOLETO')) return 'Boleto';
  return forma;
}

function normalizarStatus(status) {
  if (!status) return '';
  const s = String(status).toUpperCase();

  if (s === 'PENDENTE') return 'PENDENTE';
  if (s === 'EM_PREPARO' || s === 'EM PREPARO' || s === 'PREPARO') return 'EM_PREPARO';
  if (s === 'SAIU_PARA_ENTREGA' || s === 'SAIU PARA ENTREGA' || s === 'A_CAMINHO') {
    return 'SAIU_PARA_ENTREGA';
  }
  if (s === 'ENTREGUE') return 'ENTREGUE';
  if (s === 'CANCELADO') return 'CANCELADO';

  // mapeia de possíveis enum antigos (preparo, a_caminho, etc.)
  if (s === 'PREPARO') return 'EM_PREPARO';
  if (s === 'A_CAMINHO') return 'SAIU_PARA_ENTREGA';

  return s;
}

function getInfoStatus(statusNormalizado) {
  switch (statusNormalizado) {
    case 'PENDENTE':
      return { labelStatus: 'Pendente', badgeClass: 'pendente' };
    case 'EM_PREPARO':
      return { labelStatus: 'Em preparo', badgeClass: 'em-preparo' };
    case 'SAIU_PARA_ENTREGA':
      return { labelStatus: 'Saiu para entrega', badgeClass: 'saiu-para-entrega' };
    case 'ENTREGUE':
      return { labelStatus: 'Entregue', badgeClass: 'entregue' };
    case 'CANCELADO':
      return { labelStatus: 'Cancelado', badgeClass: 'cancelado' };
    default:
      return { labelStatus: statusNormalizado || '—', badgeClass: 'pendente' };
  }
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
