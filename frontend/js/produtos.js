// frontend/js/produtos.js

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const lojaId = params.get('lojaId');

  if (!lojaId) {
    const grid = document.getElementById('produtosGrid');
    if (grid) {
      grid.innerHTML =
        '<p class="text-danger">Loja não informada. Volte para a lista de lojas.</p>';
    }
    return;
  }

  loadLojaInfo(lojaId);
  loadProdutos(lojaId);
});

async function loadLojaInfo(lojaId) {
  const container = document.getElementById('loja-info');
  if (!container) return;

  container.innerHTML = '<p>Carregando dados da loja...</p>';

  try {
    const resp = await fetch(`${API_URL}/lojas/${lojaId}`);
    const data = await resp.json();

    if (!resp.ok) {
      container.innerHTML =
        `<p class="text-danger">Erro ao carregar loja: ${data.message || ''}</p>`;
      return;
    }

    container.innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-2">
        <div class="rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center" style="width:56px;height:56px;">
          <i class="bi bi-shop-window fs-4 text-warning"></i>
        </div>
        <div>
          <h1 class="h5 mb-1">${data.nome}</h1>
          ${
            data.descricao
              ? `<p class="text-muted small mb-0">${data.descricao}</p>`
              : ''
          }
        </div>
      </div>
      <a href="lojas.html" class="small text-decoration-none">
        <i class="bi bi-arrow-left"></i> Voltar para todas as lojas
      </a>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<p class="text-danger">Erro de conexão ao carregar loja.</p>';
  }
}

async function loadProdutos(lojaId) {
  const grid = document.getElementById('produtosGrid');
  const empty = document.getElementById('produtosEmpty');
  const count = document.getElementById('produtosCount');

  if (!grid) return;

  grid.innerHTML = '<p>Carregando produtos...</p>';
  if (empty) empty.classList.add('d-none');
  if (count) count.textContent = '';

  try {
    const resp = await fetch(`${API_URL}/lojas/${lojaId}/produtos`);
    const data = await resp.json();

    if (!resp.ok) {
      grid.innerHTML =
        `<p class="text-danger">Erro ao carregar produtos: ${data.message || ''}</p>`;
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('d-none');
      if (count) count.textContent = '0 produtos encontrados';
      return;
    }

    if (count) count.textContent = `${data.length} produto(s) encontrado(s)`;

    grid.innerHTML = data
      .map((produto) => criarCardProduto(produto))
      .join('');
  } catch (err) {
    console.error(err);
    grid.innerHTML =
      '<p class="text-danger">Erro de conexão ao carregar produtos.</p>';
  }
}

function criarCardProduto(produto) {
    const precoNumber = Number(produto.preco ?? 0);
    const precoFormatado = precoNumber.toFixed(2).replace('.', ',');
  
    return `
      <div class="col-6 col-md-4 col-lg-3">
        <article class="card h-100 shadow-sm produto-card">
          ${
            produto.imagemUrl
              ? `<img src="${produto.imagemUrl}" class="card-img-top" alt="${produto.nome}" />`
              : `
                <div class="card-img-top d-flex align-items-center justify-content-center bg-light" style="height: 150px;">
                  <i class="bi bi-box-seam fs-1 text-muted"></i>
                </div>
              `
          }
          <div class="card-body d-flex flex-column">
            <h3 class="h6 mb-1 text-truncate">${produto.nome}</h3>
            ${
              produto.descricao
                ? `<p class="small text-muted mb-2 text-truncate-2">${produto.descricao}</p>`
                : ''
            }
            <strong class="text-primary mb-2">R$ ${precoFormatado}</strong>
            <a
              href="produto.html?produtoId=${produto.id}"
              class="btn btn-outline-primary btn-sm mt-auto rounded-pill"
            >
              Ver detalhes
            </a>
          </div>
        </article>
      </div>
    `;
  }
  
