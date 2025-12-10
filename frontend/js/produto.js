// frontend/js/produto.js

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const produtoId = params.get("id") || params.get("produtoId");

  const container = document.getElementById('produto-container');

  if (!produtoId) {
    if (container) {
      container.innerHTML =
        '<p class="text-danger">Produto não informado. Volte para a lista de produtos.</p>';
    }
    return;
  }

  loadProduto(produtoId);
});

async function loadProduto(produtoId) {
  const container = document.getElementById('produto-container');
  if (!container) return;

  container.innerHTML = '<p>Carregando produto...</p>';

  try {
    const resp = await fetch(`${API_URL}/produtos/${produtoId}`);
    const data = await resp.json();

    if (!resp.ok) {
      container.innerHTML =
        `<p class="text-danger">Erro ao carregar produto: ${data.message || ''}</p>`;
      return;
    }

    renderProduto(container, data);
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<p class="text-danger">Erro de conexão ao carregar produto.</p>';
  }
}

function renderProduto(container, produto) {
  const precoNumber = Number(produto.preco ?? 0);
  const precoFormatado = precoNumber.toFixed(2).replace('.', ',');

  const loja = produto.loja || null;
  const lojaLink = loja ? `produtos.html?lojaId=${loja.id}` : 'lojas.html';

  container.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-md-5">
        <div class="card shadow-sm">
          ${
            produto.imagemUrl
              ? `<img src="${produto.imagemUrl}" class="card-img-top" alt="${produto.nome}" />`
              : `
                <div class="card-img-top d-flex align-items-center justify-content-center bg-light" style="height: 260px;">
                  <i class="bi bi-box-seam fs-1 text-muted"></i>
                </div>
              `
          }
        </div>
      </div>

      <div class="col-12 col-md-7">
        <nav class="small mb-2">
          <a href="index.html" class="text-decoration-none">Início</a>
          <span class="text-muted"> / </span>
          <a href="lojas.html" class="text-decoration-none">Lojas</a>
          ${
            loja
              ? `
                <span class="text-muted"> / </span>
                <a href="${lojaLink}" class="text-decoration-none">
                  ${loja.nome}
                </a>
              `
              : ''
          }
        </nav>

        <h1 class="h5 mb-2">${produto.nome}</h1>

        ${
          produto.descricao
            ? `<p class="text-muted">${produto.descricao}</p>`
            : ''
        }

        <div class="d-flex align-items-baseline gap-3 mb-3">
          <span class="fs-4 fw-bold text-primary">R$ ${precoFormatado}</span>
          ${
            produto.estoque > 0
              ? `<span class="badge bg-success-subtle text-success small">
                   Em estoque (${produto.estoque})
                 </span>`
              : `<span class="badge bg-danger-subtle text-danger small">
                   Indisponível
                 </span>`
          }
        </div>

        ${
          loja
            ? `
              <div class="mb-3 small text-muted">
                Vendido por
                <a href="${lojaLink}" class="text-decoration-none">
                  ${loja.nome}
                </a>
              </div>
            `
            : ''
        }

        <div class="d-flex align-items-center gap-2 mb-3">
          <label for="produto-quantidade" class="small mb-0">Quantidade:</label>
          <input
            id="produto-quantidade"
            type="number"
            min="1"
            value="1"
            class="form-control form-control-sm"
            style="width: 80px;"
          />
        </div>

        <div class="d-flex flex-wrap gap-2">
          <button
            id="add-to-cart-btn"
            type="button"
            class="btn btn-primary rounded-pill px-4"
            ${produto.estoque > 0 ? '' : 'disabled'}
          >
            <i class="bi bi-cart-plus me-1"></i>
            Adicionar ao carrinho
          </button>

          <a href="${lojaLink}" class="btn btn-outline-secondary rounded-pill">
            Ver outros produtos da loja
          </a>
        </div>
      </div>
    </div>
  `;

  // Ligar botão de adicionar ao carrinho
  const addBtn = document.getElementById('add-to-cart-btn');
  const qtyInput = document.getElementById('produto-quantidade');

  if (addBtn && qtyInput && produto.estoque > 0 && typeof addToCart === 'function') {
    addBtn.addEventListener('click', () => {
      const qty = Number(qtyInput.value || '1');
      const quantidade = Number.isNaN(qty) || qty <= 0 ? 1 : qty;

      addToCart({
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        imagemUrl: produto.imagemUrl,
        lojaId: loja ? loja.id : null,
        lojaNome: loja ? loja.nome : '',
        quantidade,
      });

      alert('Produto adicionado ao carrinho!');
    });
  }
}
