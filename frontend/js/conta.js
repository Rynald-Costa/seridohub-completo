// frontend/js/conta.js

document.addEventListener('DOMContentLoaded', () => {
  initContaPage();
});

function getStoredUser() {
  const rawUser =
    localStorage.getItem('user') || localStorage.getItem('currentUser');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function saveStoredUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function initContaPage() {
  const secVisitante = document.getElementById('sec-conta-visitante');
  const secLogado = document.getElementById('sec-conta-logado');

  const user = getStoredUser();
  const token =
    localStorage.getItem('token') || localStorage.getItem('authToken');

  if (!user || !token) {
    // VISITANTE
    if (secVisitante) secVisitante.classList.remove('d-none');
    if (secLogado) secLogado.classList.add('d-none');
    return;
  }

  // LOGADO
  if (secVisitante) secVisitante.classList.add('d-none');
  if (secLogado) secLogado.classList.remove('d-none');

  preencherDadosConta(user);
  configurarFormularios(user);
  configurarExclusaoConta();
}

function preencherDadosConta(user) {
  const nome = user.nome || 'Usuário';
  const email = user.email || 'email@exemplo.com';
  const telefone = user.telefone || 'Não informado';
  const tipo = user.tipo || 'CLIENTE';

  const inicial = nome.trim().charAt(0).toUpperCase();

  const nomeEl = document.getElementById('conta-nome');
  const emailEl = document.getElementById('conta-email');
  const telefoneEl = document.getElementById('conta-telefone');
  const avatarInitialEl = document.getElementById('conta-avatar-initial');
  const tipoBadgeEl = document.getElementById('conta-tipo-badge');
  const atalhoMinhaLoja = document.getElementById('conta-atalho-minha-loja');

  if (nomeEl) nomeEl.textContent = nome;
  if (emailEl) emailEl.textContent = email;
  if (telefoneEl) telefoneEl.textContent = telefone;
  if (avatarInitialEl) avatarInitialEl.textContent = inicial || 'U';

  if (tipoBadgeEl) {
    let label = 'Cliente';
    let classes = ['bg-success-subtle', 'text-success-emphasis'];

    if (tipo === 'VENDEDOR') {
      label = 'Vendedor';
      classes = ['bg-primary-subtle', 'text-primary-emphasis'];
    } else if (tipo === 'ADMIN') {
      label = 'Administrador';
      classes = ['bg-danger-subtle', 'text-danger-emphasis'];
    }

    tipoBadgeEl.textContent = label;
    tipoBadgeEl.className = 'badge rounded-pill ' + classes.join(' ');
  }

  // Atalho para Minha loja só para vendedor
  if (atalhoMinhaLoja) {
    if (tipo === 'VENDEDOR') {
      atalhoMinhaLoja.classList.remove('d-none');
    } else {
      atalhoMinhaLoja.classList.add('d-none');
    }
  }

  // Preenche inputs dos formulários
  const inputTel = document.getElementById('input-telefone');
  const inputEmail = document.getElementById('input-email');

  if (inputTel) inputTel.value = user.telefone || '';
  if (inputEmail) inputEmail.value = user.email || '';
}

function configurarFormularios(user) {
  const formTel = document.getElementById('form-telefone');
  const formEmail = document.getElementById('form-email');
  const formSenha = document.getElementById('form-senha');

  // Atualizar telefone (apenas localStorage, por enquanto)
  if (formTel) {
    formTel.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('input-telefone');
      if (!input) return;

      const novoTel = input.value.trim();
      user.telefone = novoTel;

      saveStoredUser(user);
      preencherDadosConta(user);

      alert(
        'Telefone atualizado (no frontend). Para refletir na API, é preciso implementar a rota de atualização.'
      );
    });
  }

  // Atualizar e-mail (apenas localStorage)
  if (formEmail) {
    formEmail.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('input-email');
      if (!input) return;

      const novoEmail = input.value.trim();
      if (!novoEmail) {
        alert('Informe um e-mail válido.');
        return;
      }

      user.email = novoEmail;

      saveStoredUser(user);
      preencherDadosConta(user);

      alert(
        'E-mail atualizado (no frontend). Para refletir na API, é preciso implementar a rota de atualização.'
      );
    });
  }

  // Alterar senha (aqui só mostramos uma mensagem por enquanto)
  if (formSenha) {
    formSenha.addEventListener('submit', (e) => {
      e.preventDefault();
      alert(
        'A alteração de senha depende de uma rota específica na API (por exemplo, /api/usuarios/senha). ' +
          'Nesta versão, a tela está pronta no frontend, mas a integração ainda precisa ser feita.'
      );
    });
  }
}

function configurarExclusaoConta() {
  const btnExcluir = document.getElementById('btn-excluir-conta');
  if (!btnExcluir) return;

  btnExcluir.addEventListener('click', () => {
    const confirma = confirm(
      'Tem certeza que deseja excluir sua conta? Esta ação é permanente e não pode ser desfeita.'
    );
    if (!confirma) return;

    // IMPORTANTE: aqui seria o ponto de chamar a API real de exclusão de conta.
    // Exemplo futuro:
    // fetch('/api/usuarios/me', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })

    // Por enquanto, simulamos apenas limpando os dados locais + logout.
    if (typeof logout === 'function') {
      logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
    }

    alert(
      'Sua conta foi desconectada deste dispositivo. A exclusão no banco de dados ainda precisa ser implementada na API.'
    );

    window.location.href = 'index.html';
  });
}
