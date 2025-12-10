// frontend/js/minha_loja.js

const API_BASE_URL = window.API_BASE_URL || '/api';
const LOJAS_ENDPOINT = `${API_BASE_URL}/lojas`;

document.addEventListener('DOMContentLoaded', () => {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

  const alertBox = document.getElementById('loja-alert');
  const blocoFormLoja = document.getElementById('bloco-form-loja');

  const form = document.getElementById('loja-form');
  const inputId = document.getElementById('loja-id');
  const inputNome = document.getElementById('loja-nome');
  const inputDescricao = document.getElementById('loja-descricao');
  const inputEndereco = document.getElementById('loja-endereco');
  const inputTelefone = document.getElementById('loja-telefone');
  const inputImagemLogo = document.getElementById('loja-imagem-logo');
  const inputHorarioAbertura = document.getElementById('loja-horario-abertura');
  const inputHorarioFechamento = document.getElementById('loja-horario-fechamento');

  const tituloForm = document.getElementById('titulo-form-loja');
  const descricaoForm = document.getElementById('descricao-form-loja');
  const textoBotaoForm = document.getElementById('texto-botao-form');
  const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

  const errorBox = document.getElementById('loja-error');
  const successBox = document.getElementById('loja-success');

  // Se não tiver usuário logado
  if (!user) {
    renderAlert(
      alertBox,
      'Você precisa estar logado como vendedor para gerenciar sua loja.',
      'danger'
    );
    if (blocoFormLoja) blocoFormLoja.classList.add('d-none');
    return;
  }

  // Se não for vendedor
  if (user.tipo !== 'VENDEDOR') {
    renderAlert(
      alertBox,
      'Apenas usuários do tipo Vendedor podem acessar esta página.',
      'warning'
    );
    if (blocoFormLoja) blocoFormLoja.classList.add('d-none');
    return;
  }

  // ID da loja atual (se existir). null = ainda criando a primeira loja.
  let lojaEmEdicaoId = null;

  // Carrega a loja do vendedor ao abrir a página
  carregarLojaDoVendedor();

  // --- Eventos ---

  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener('click', () => {
      // Volta os dados da loja que está no backend
      carregarLojaDoVendedor();
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      limparMensagens(errorBox, successBox);

      const nome = (inputNome?.value || '').trim();
      const descricao = (inputDescricao?.value || '').trim() || null;
      const endereco = (inputEndereco?.value || '').trim() || null;
      const telefone = (inputTelefone?.value || '').trim() || null;
      const imagemLogo = (inputImagemLogo?.value || '').trim() || null;
      const horarioAbertura = inputHorarioAbertura?.value || null;   // "HH:mm"
      const horarioFechamento = inputHorarioFechamento?.value || null;

      if (!nome) {
        if (errorBox) errorBox.textContent = 'O nome da loja é obrigatório.';
        return;
      }

      const body = {
        nome,
        descricao,
        endereco,
        telefone,
        imagemLogo,
        horarioAbertura,
        horarioFechamento,
      };

      try {
        let res;

        if (lojaEmEdicaoId !== null) {
          // Atualizar loja existente
          res = await fetch(`${LOJAS_ENDPOINT}/${lojaEmEdicaoId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
          });
        } else {
          // Criar nova loja
          res = await fetch(LOJAS_ENDPOINT, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body),
          });
        }

        if (!res.ok) {
          const data = await safeJson(res);
          const msg =
            data && data.message
              ? data.message
              : 'Não foi possível salvar a loja.';
          throw new Error(msg);
        }

        const loja = await res.json();
        lojaEmEdicaoId = loja.id || null;

        if (successBox) {
          successBox.textContent =
            lojaEmEdicaoId !== null
              ? 'Loja salva com sucesso!'
              : 'Loja cadastrada com sucesso!';
        }

        // Recarrega estado a partir do backend (garante dados sincronizados)
        await carregarLojaDoVendedor(false);
      } catch (err) {
        console.error(err);
        if (errorBox) {
          errorBox.textContent = err.message || 'Erro ao salvar a loja.';
        }
      }
    });
  }

  /* ============================================================
     Funções principais
     ============================================================ */

  async function carregarLojaDoVendedor(mostrarLoading = true) {
    try {
      if (mostrarLoading) {
        renderAlert(alertBox, 'Carregando sua loja...', 'info');
      }

      const res = await fetch(`${LOJAS_ENDPOINT}/minha`, {
        headers: getAuthHeaders(),
      });

      if (res.status === 404) {
        // Nenhuma loja cadastrada ainda → modo "primeira loja"
        lojaEmEdicaoId = null;
        iniciarModoCriacaoPrimeiraLoja();
        renderAlert(
          alertBox,
          'Você ainda não cadastrou sua loja. Preencha o formulário abaixo para criar.',
          'info'
        );
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(
          (data && data.message) || 'Não foi possível carregar a loja.'
        );
      }

      const loja = await res.json();
      lojaEmEdicaoId = loja.id || null;

      iniciarModoEdicaoLoja(loja);
      renderAlert(
        alertBox,
        'Esta é a sua loja cadastrada. Atualize as informações sempre que necessário.',
        'success'
      );
    } catch (err) {
      console.error(err);
      renderAlert(
        alertBox,
        err.message || 'Erro ao carregar dados da loja.',
        'danger'
      );
    }
  }

  function iniciarModoCriacaoPrimeiraLoja() {
    if (!blocoFormLoja) return;

    if (inputId) inputId.value = '';
    if (inputNome) inputNome.value = '';
    if (inputDescricao) inputDescricao.value = '';
    if (inputEndereco) inputEndereco.value = '';
    if (inputTelefone) inputTelefone.value = '';
    if (inputImagemLogo) inputImagemLogo.value = '';
    if (inputHorarioAbertura) inputHorarioAbertura.value = '';
    if (inputHorarioFechamento) inputHorarioFechamento.value = '';

    lojaEmEdicaoId = null;

    if (tituloForm) tituloForm.textContent = 'Cadastrar loja';
    if (descricaoForm) {
      descricaoForm.textContent =
        'Cadastre sua primeira loja para começar a vender no SeridóHub.';
    }
    if (textoBotaoForm) textoBotaoForm.textContent = 'Salvar loja';

    if (btnCancelarEdicao) btnCancelarEdicao.classList.add('d-none');

    blocoFormLoja.classList.remove('d-none');
    limparMensagens(errorBox, successBox);
  }

  function iniciarModoEdicaoLoja(loja) {
    if (!blocoFormLoja) return;

    if (inputId) inputId.value = loja.id ? String(loja.id) : '';

    if (inputNome) inputNome.value = loja.nome || '';
    if (inputDescricao) inputDescricao.value = loja.descricao || '';
    if (inputEndereco) inputEndereco.value = loja.endereco || '';
    if (inputTelefone) inputTelefone.value = loja.telefone || '';
    if (inputImagemLogo) {
      inputImagemLogo.value = loja.imagemLogo || '';
    }

    if (inputHorarioAbertura) {
      inputHorarioAbertura.value = formatHoraParaInput(loja.horarioAbertura);
    }
    if (inputHorarioFechamento) {
      inputHorarioFechamento.value = formatHoraParaInput(loja.horarioFechamento);
    }

    if (tituloForm) tituloForm.textContent = 'Editar loja';
    if (descricaoForm) {
      descricaoForm.textContent =
        'Altere as informações da sua loja. As mudanças serão refletidas para os clientes.';
    }
    if (textoBotaoForm) textoBotaoForm.textContent = 'Salvar alterações';

    if (btnCancelarEdicao) btnCancelarEdicao.classList.remove('d-none');

    blocoFormLoja.classList.remove('d-none');
    limparMensagens(errorBox, successBox);

    blocoFormLoja.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* ============================================================
   AUXILIARES
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

function renderAlert(container, message, type = 'info') {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${type} small py-2 mb-3" role="alert">
      ${message}
    </div>
  `;
}

function limparMensagens(errorBox, successBox) {
  if (errorBox) errorBox.textContent = '';
  if (successBox) successBox.textContent = '';
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Converte o valor vindo do backend para o formato "HH:mm" do input[type="time"]
function formatHoraParaInput(value) {
  if (!value) return '';

  // Se já estiver no formato "HH:mm", retorna direto
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';

    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}
