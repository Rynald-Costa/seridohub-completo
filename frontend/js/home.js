// frontend/js/home.js

// Base da API – como o backend e o frontend estão na mesma origem (localhost:3000),
// podemos usar apenas o prefixo /api. Se em algum momento você definir window.API_BASE_URL
// em outro lugar, ele é reaproveitado.
const API_BASE_URL = window.API_BASE_URL || '/api';

const LOJAS_ENDPOINT = `${API_BASE_URL}/lojas`;
const PRODUTOS_ENDPOINT = `${API_BASE_URL}/produtos`;
let clienteHomeInicializado = false;
let vendedorDashboardInicializado = false;

document.addEventListener('DOMContentLoaded', () => {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

  const badgeTipo = document.getElementById('badge-tipo-usuario');
  const spanNome = document.querySelector('.usuario-nome');
  const heroSubtitle = document.getElementById('hero-subtitle');

  const btnLogin = document.getElementById('btn-login');
  const btnCadastro = document.getElementById('btn-cadastro');
  const btnLogout = document.getElementById('btn-logout');

  const btnVisitorCreate = document.getElementById('visitor-create-account');
  const btnBannerCreate = document.getElementById('banner-create-account');

  const secVisitante = document.getElementById('visitante-home');
  const secCliente = document.getElementById('cliente-home');
  const secVendedor = document.getElementById('vendedor-home');

  // --- Navegação dos botões ---
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  if (btnCadastro) {
    btnCadastro.addEventListener('click', () => {
      window.location.href = 'cadastro.html';
    });
  }

  if (btnVisitorCreate) {
    btnVisitorCreate.addEventListener('click', () => {
      window.location.href = 'cadastro.html';
    });
  }

  if (btnBannerCreate) {
    btnBannerCreate.addEventListener('click', () => {
      window.location.href = 'cadastro.html';
    });
  }

  if (btnLogout && typeof logout === 'function') {
    btnLogout.addEventListener('click', () => {
      logout();
    });
  }

  // --- Estado: visitante x logado ---
  if (!user) {
    // Visitante
    if (badgeTipo) {
      badgeTipo.textContent = 'Visitante';
      badgeTipo.classList.remove('bg-success', 'bg-primary', 'bg-danger');
      badgeTipo.classList.add('bg-dark');
    }

    if (spanNome) spanNome.textContent = 'visitante';

    if (heroSubtitle) {
      heroSubtitle.textContent =
        'Explore as lojas e descubra o SeridóHub. Faça login ou crie uma conta para aproveitar tudo.';
    }

    if (btnLogin) btnLogin.classList.remove('d-none');
    if (btnCadastro) btnCadastro.classList.remove('d-none');
    if (btnLogout) btnLogout.classList.add('d-none');

    if (secVisitante) secVisitante.classList.remove('d-none');
    if (secCliente) secCliente.classList.add('d-none');
    if (secVendedor) secVendedor.classList.add('d-none');

    // garante que o banner apareça para visitante
    mostrarBannerPrincipal();
  } else {
    // Usuário logado
    const nome = user.nome || 'usuário';
    const tipo = user.tipo || 'CLIENTE';

    if (spanNome) spanNome.textContent = nome;

    if (heroSubtitle) {
      heroSubtitle.textContent =
        tipo === 'VENDEDOR'
          ? 'Gerencie sua loja, acompanhe pedidos e atualize seus produtos no SeridóHub.'
          : 'Veja as lojas disponíveis, encontre ofertas e acompanhe seus pedidos.';
    }

    if (badgeTipo) {
      badgeTipo.textContent =
        tipo === 'VENDEDOR'
          ? 'Vendedor'
          : tipo === 'ADMIN'
          ? 'Administrador'
          : 'Cliente';

      badgeTipo.classList.remove('bg-dark', 'bg-danger', 'bg-primary', 'bg-success');

      if (tipo === 'VENDEDOR') {
        badgeTipo.classList.add('bg-primary');
      } else if (tipo === 'ADMIN') {
        badgeTipo.classList.add('bg-danger');
      } else {
        badgeTipo.classList.add('bg-success');
      }
    }

    if (btnLogin) btnLogin.classList.add('d-none');
    if (btnCadastro) btnCadastro.classList.add('d-none');
    if (btnLogout) btnLogout.classList.remove('d-none');

    // exibe seção conforme tipo
    if (secVisitante) secVisitante.classList.add('d-none');

    if (tipo === 'VENDEDOR') {
      if (secCliente) secCliente.classList.add('d-none');
      if (secVendedor) secVendedor.classList.remove('d-none');

      ocultarBannerParaVendedor();
      inicializarDashboardVendedor();
    } else {
      // CLIENTE ou ADMIN → por enquanto trata como cliente
      if (secCliente) secCliente.classList.remove('d-none');
      if (secVendedor) secVendedor.classList.add('d-none');

      mostrarBannerPrincipal();
      // Inicializa a home do cliente (carrossel + produtos)
      inicializarClienteHome();
    }
  }
});

/* ============================================================
   FUNÇÕES DA HOME DO CLIENTE
   ============================================================ */

function inicializarClienteHome() {
  if (clienteHomeInicializado) return;
  clienteHomeInicializado = true;

  carregarLojasCliente();
  carregarProdutosCliente();
}

function getAuthHeaders() {
  // Se o seu auth.js tiver uma função própria pra pegar token, você pode usar aqui
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

/* ---------- Carrossel de lojas ---------- */

async function carregarLojasCliente() {
  const loadingEl = document.getElementById('lojas-carousel-loading');
  const emptyEl = document.getElementById('lojas-carousel-empty');
  const errorEl = document.getElementById('lojas-carousel-error');
  const carouselEl = document.getElementById('lojas-carousel');
  const innerEl = document.getElementById('lojas-carousel-inner');

  if (!innerEl) return;

  // Estado inicial
  if (loadingEl) loadingEl.classList.remove('d-none');
  if (emptyEl) emptyEl.classList.add('d-none');
  if (errorEl) errorEl.classList.add('d-none');
  if (carouselEl) carouselEl.classList.add('d-none');

  try {
    const res = await fetch(LOJAS_ENDPOINT, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error('Falha ao buscar lojas');
    }

    const lojas = await res.json();

    if (!lojas || lojas.length === 0) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (emptyEl) emptyEl.classList.remove('d-none');
      return;
    }

    // Monta as slides
    innerEl.innerHTML = lojas
      .map((loja, index) => {
        const nome = loja.nome || 'Loja';
        const descricao =
          loja.descricao || 'Loja parceira do SeridóHub.';
        const id = loja.id;
        const imagem =
          loja.imagemLogo ||
          loja.imagem_logo ||
          null;

        return `
          <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <div class="card loja-carousel-card mx-auto">
              <div class="row g-0 align-items-center">
                <!-- LOGO / IMAGEM À ESQUERDA -->
                <div class="col-12 col-md-4 text-center p-4 border-end loja-carousel-logo-col">
                  ${
                    imagem
                      ? `<div class="loja-carousel-logo-wrapper mx-auto">
                           <img
                             src="${imagem}"
                             alt="${nome}"
                             class="img-fluid loja-carousel-logo-img"
                           />
                         </div>`
                      : `<div class="loja-carousel-logo-placeholder mx-auto">
                           <span class="fw-bold fs-1">${nome.charAt(0)}</span>
                         </div>`
                  }
                </div>

                <!-- TEXTO / AÇÕES À DIREITA -->
                <div class="col-12 col-md-8 p-4">
                  <div class="d-flex flex-column h-100 justify-content-center">
                    <p class="text-uppercase small text-muted mb-1">Loja parceira</p>
                    <h3 class="h4 mb-2">${nome}</h3>
                    <p class="text-muted mb-3 loja-carousel-description">
                      ${descricao}
                    </p>
                    ${
                      id
                        ? `<div>
                             <a href="loja.html?id=${id}" class="btn btn-outline-primary rounded-pill px-4">
                               Ver loja
                             </a>
                           </div>`
                        : ''
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    if (loadingEl) loadingEl.classList.add('d-none');
    if (carouselEl) carouselEl.classList.remove('d-none');
  } catch (err) {
    console.error('Erro ao carregar lojas:', err);
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) errorEl.classList.remove('d-none');
  }
}

/* ---------- Grid de produtos ---------- */

async function carregarProdutosCliente() {
  const loadingEl = document.getElementById('produtos-loading');
  const emptyEl = document.getElementById('produtos-empty');
  const errorEl = document.getElementById('produtos-error');
  const gridEl = document.getElementById('produtos-grid');

  if (!gridEl) return;

  // Estado inicial
  if (loadingEl) loadingEl.classList.remove('d-none');
  if (emptyEl) emptyEl.classList.add('d-none');
  if (errorEl) errorEl.classList.add('d-none');
  gridEl.innerHTML = '';

  try {
    const res = await fetch(PRODUTOS_ENDPOINT, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error('Falha ao buscar produtos');
    }

    const produtos = await res.json();

    if (!produtos || produtos.length === 0) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (emptyEl) emptyEl.classList.remove('d-none');
      return;
    }

    gridEl.innerHTML = produtos
      .map((produto) => {
        const id = produto.id;
        const nome = produto.nome || 'Produto';
        const descricao =
          produto.descricao || '';
        const preco = formatarPreco(produto.preco);
        const imagem =
          produto.imagemUrl ||
          produto.imagem_principal ||
          'assets/placeholder-product.png';

        return `
          <div class="col-6 col-md-4 col-lg-3">
            <div class="card h-100 product-card position-relative">
              <div class="ratio ratio-4x3 product-thumb">
                <img
                  src="${imagem}"
                  alt="${nome}"
                  class="img-fluid rounded-top object-fit-cover"
                />
              </div>
              <div class="card-body d-flex flex-column">
                <h3 class="h6 mb-1 text-truncate" title="${nome}">${nome}</h3>
                ${
                  descricao
                    ? `<p class="small text-muted mb-2 text-truncate">${descricao}</p>`
                    : ''
                }
                <div class="mt-auto">
                  <div class="fw-bold mb-1">${preco}</div>
                  ${
                    id
                      ? `<a href="produto.html?id=${id}" class="btn btn-outline-primary btn-sm rounded-pill w-100">
                           Ver produto
                         </a>`
                      : ''
                  }
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    if (loadingEl) loadingEl.classList.add('d-none');
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) errorEl.classList.remove('d-none');
  }
}

/* ============================================================
   DASHBOARD DO VENDEDOR
   ============================================================ */

function ocultarBannerParaVendedor() {
  const promoBanner = document.getElementById('promo-banner');
  if (promoBanner) {
    promoBanner.classList.add('d-none');
  }
}

function mostrarBannerPrincipal() {
  const promoBanner = document.getElementById('promo-banner');
  if (promoBanner) {
    promoBanner.classList.remove('d-none');
  }
}

async function inicializarDashboardVendedor() {
  if (vendedorDashboardInicializado) return;
  vendedorDashboardInicializado = true;

  const blocoSemLoja = document.getElementById('vendedor-sem-loja');
  const blocoComLoja = document.getElementById('vendedor-com-loja');

  if (!blocoSemLoja || !blocoComLoja) {
    console.warn('Blocos do dashboard do vendedor não encontrados.');
    return;
  }

  const possuiLoja = await vendedorPossuiAlgumaLoja();

  if (possuiLoja) {
    blocoSemLoja.classList.add('d-none');
    blocoComLoja.classList.remove('d-none');
  } else {
    blocoSemLoja.classList.remove('d-none');
    blocoComLoja.classList.add('d-none');
  }

  configurarAtalhosDashboard();
}

// Verifica se o vendedor já possui alguma loja cadastrada
async function vendedorPossuiAlgumaLoja() {
  try {
    // Agora usamos /lojas/minhas (plural), que retorna um ARRAY de lojas
    const res = await fetch(`${LOJAS_ENDPOINT}/minhas`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 404 || res.status === 204) {
      // backend responde 404 quando não existir nenhuma loja
      return false;
    }

    if (!res.ok) {
      throw new Error('Falha ao buscar lojas do vendedor');
    }

    const data = await res.json();

    // Esperado: array de lojas
    if (Array.isArray(data)) {
      return data.length > 0;
    }

    // Se algum dia o backend devolver um objeto único, tratamos também:
    if (data && typeof data === 'object') {
      return true;
    }

    return false;
  } catch (err) {
    console.warn('Não foi possível verificar lojas do vendedor:', err);
    return false;
  }
}

// Liga os botões de atalho do dashboard às páginas correspondentes
function configurarAtalhosDashboard() {
  const btnCadastroLoja = document.getElementById('btn-dashboard-cadastrar-loja');
  const btnMinhasLojas = document.getElementById('btn-dashboard-minhas-lojas');
  const btnProdutosUnificado = document.getElementById('btn-dashboard-produtos-unificado');
  const btnPedidos = document.getElementById('btn-dashboard-pedidos');

  // Fluxos de loja levam para minha_loja.html,
  // onde o vendedor gerencia suas lojas
  if (btnCadastroLoja) {
    btnCadastroLoja.addEventListener('click', () => {
      window.location.href = 'minha_loja.html';
    });
  }

  if (btnMinhasLojas) {
    btnMinhasLojas.addEventListener('click', () => {
      window.location.href = 'minha_loja.html';
    });
  }

  // Widget unificado de produtos → vai para meus_produtos.html
  if (btnProdutosUnificado) {
    btnProdutosUnificado.addEventListener('click', () => {
      window.location.href = 'meus_produtos.html';
    });
  }

  if (btnPedidos) {
    btnPedidos.addEventListener('click', () => {
      // quando você tiver essa página:
      window.location.href = 'meus_pedidos.html';
    });
  }
}

/* ---------- Utils ---------- */

function formatarPreco(valor) {
  if (typeof valor === 'number') {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  const num = Number(valor);
  if (isNaN(num)) return 'R$ --';

  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
