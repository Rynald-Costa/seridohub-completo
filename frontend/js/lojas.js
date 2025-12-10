// frontend/js/lojas.js

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  carregarLojas();
});

let lojas = []; // vai guardar o que vier da API

function calcularStatusHorario(loja) {
  // Se não tiver horários configurados, só marca como "indisponível"
  if (!loja.horario_abertura || !loja.horario_fechamento) {
    return loja.status === 'aprovado' ? 'indisponivel' : 'indisponivel';
  }

  if (loja.status === 'pendente') return 'em_breve';

  const agora = new Date();
  const [abHr, abMin] = loja.horario_abertura.split(':').map(Number);
  const [feHr, feMin] = loja.horario_fechamento.split(':').map(Number);

  const inicio = new Date();
  inicio.setHours(abHr, abMin, 0, 0);
  const fim = new Date();
  fim.setHours(feHr, feMin, 0, 0);

  if (agora >= inicio && agora <= fim && loja.status === 'aprovado') {
    return 'aberta';
  }

  if (loja.status !== 'aprovado') {
    return 'indisponivel';
  }

  return 'fechada';
}

function formatarHorario(horaStr) {
  if (!horaStr) return '';
  return horaStr.slice(0, 5); // "HH:MM"
}

function formatarDataCriacao(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${mes}/${ano}`;
}

function criarBadgeStatus(loja) {
  const statusHorario = calcularStatusHorario(loja);

  if (statusHorario === 'em_breve') {
    return '<span class="badge badge-soon rounded-pill">Em breve</span>';
  }
  if (statusHorario === 'aberta') {
    return '<span class="badge badge-open rounded-pill">Aberta agora</span>';
  }
  if (statusHorario === 'fechada') {
    return '<span class="badge badge-closed rounded-pill">Fechada</span>';
  }
  return '<span class="badge bg-secondary rounded-pill">Indisponível</span>';
}

function criarCardLoja(loja) {
  const badge = criarBadgeStatus(loja);

  const horario = `${formatarHorario(loja.horario_abertura)} às ${formatarHorario(
    loja.horario_fechamento
  )}`;
  const desde = formatarDataCriacao(loja.data_criacao);

  // Agora o link aponta para a página de produtos, passando o id da loja
  const linkLoja = `produtos.html?lojaId=${loja.id}`;

  return `
    <div class="col-12 col-md-6 col-lg-4">
      <article class="card store-card h-100">
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-center mb-2">
            <div class="store-logo-wrapper">
              <img src="${loja.imagem_logo || 'https://via.placeholder.com/120x120.png?text=Loja'}" alt="Logo da loja ${loja.nome}">
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center justify-content-between">
                <h3 class="store-name mb-0">${loja.nome}</h3>
                <div class="ms-2">
                  ${badge}
                </div>
              </div>
              <div class="store-meta mt-1">
                <i class="bi bi-geo-alt"></i>
                <span>${loja.endereco || 'Endereço não informado'}</span>
              </div>
            </div>
          </div>

          <p class="store-description mb-3">
            ${loja.descricao || 'Loja cadastrada no SeridóHub.'}
          </p>

          <div class="mt-auto">
            <div class="d-flex flex-wrap justify-content-between store-meta mb-2 gap-2">
              <span>
                <i class="bi bi-telephone"></i>
                ${loja.telefone || 'Telefone não informado'}
              </span>
              <span>
                <i class="bi bi-clock-history"></i>
                ${horario || 'Horário não informado'}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center store-meta mb-3">
              <span class="small">
                <i class="bi bi-calendar-check"></i>
                No SeridóHub desde ${desde || '—'}
              </span>
            </div>
            <a href="${linkLoja}" class="btn btn-primary w-100 btn-view-store">
              Ver loja
            </a>
          </div>
        </div>
      </article>
    </div>
  `;
}

function aplicarFiltros(lojasLista, termoBusca, filtroStatus) {
  return lojasLista.filter((loja) => {
    const texto = (loja.nome + ' ' + (loja.descricao || '')).toLowerCase();
    if (termoBusca && !texto.includes(termoBusca.toLowerCase())) {
      return false;
    }

    if (filtroStatus === 'todos') return true;
    if (filtroStatus === 'aprovado') return loja.status === 'aprovado';
    if (filtroStatus === 'pendente') return loja.status === 'pendente';
    if (filtroStatus === 'fechada') {
      const s = calcularStatusHorario(loja);
      return s === 'fechada';
    }

    return true;
  });
}

function renderizarLojas(lojasLista) {
  const grid = document.getElementById('storesGrid');
  const empty = document.getElementById('storesEmpty');
  const count = document.getElementById('storesCount');

  if (!grid) return;

  if (!lojasLista.length) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('d-none');
    if (count) count.textContent = '0 lojas encontradas';
    return;
  }

  if (empty) empty.classList.add('d-none');
  grid.innerHTML = lojasLista.map(criarCardLoja).join('');
  if (count) count.textContent = `${lojasLista.length} loja(s) encontrada(s)`;
}

function atualizarLista() {
  const termoBusca = document.getElementById('searchInput')?.value.trim() || '';
  const filtroStatus = document.getElementById('statusFilter')?.value || 'todos';
  const filtradas = aplicarFiltros(lojas, termoBusca, filtroStatus);
  renderizarLojas(filtradas);
}

async function carregarLojas() {
  const grid = document.getElementById('storesGrid');
  const empty = document.getElementById('storesEmpty');
  const count = document.getElementById('storesCount');

  if (grid) grid.innerHTML = '<p>Carregando lojas...</p>';
  if (empty) empty.classList.add('d-none');
  if (count) count.textContent = '';

  try {
    const resp = await fetch(`${API_URL}/lojas`);
    const data = await resp.json();

    if (!resp.ok) {
      if (grid) {
        grid.innerHTML = `<p class="text-danger">Erro ao carregar lojas: ${
          data.message || ''
        }</p>`;
      }
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      lojas = [];
      renderizarLojas(lojas);
      return;
    }

    // Mapeia o que vem da API para o formato esperado pelo layout
    lojas = data.map((loja) => ({
      ...loja,
      // Como o banco ainda não tem esses campos, usamos defaults pra manter o layout
      status: 'aprovado',
      horario_abertura: '08:00',
      horario_fechamento: '18:00',
      imagem_logo: null,
      endereco: '',
      telefone: '',
      data_criacao: new Date().toISOString(),
    }));

    atualizarLista();
  } catch (err) {
    console.error(err);
    if (grid) {
      grid.innerHTML =
        '<p class="text-danger">Erro de conexão com o servidor.</p>';
    }
  }

  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const refreshBtn = document.getElementById('refreshBtn');

  if (searchInput) {
    searchInput.addEventListener('input', atualizarLista);
  }
  if (statusFilter) {
    statusFilter.addEventListener('change', atualizarLista);
  }
  if (refreshBtn) {
    refreshBtn.addEventListener('click', carregarLojas);
  }
}
