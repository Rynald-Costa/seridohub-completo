// frontend/js/auth.js

const API_URL = 'http://localhost:3000/api';

/* ------------------- AUTH STORAGE ------------------- */

// Salva token e usuário no localStorage
function saveAuth(data) {
  if (!data) return;

  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('authToken', data.token); // extra, mais descritivo
  }

  if (data.user) {
    const userStr = JSON.stringify(data.user);
    localStorage.setItem('user', userStr);
    localStorage.setItem('currentUser', userStr); // extra, mais descritivo
  }
}

// Helpers para login/logout
function getCurrentUser() {
  const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

/* ------------------- LOGIN (login.html) ------------------- */

function setupLoginPage() {
  const stepEmail = document.getElementById('step-email');
  const stepPassword = document.getElementById('step-password');

  const emailForm = document.getElementById('email-form');
  const passwordForm = document.getElementById('password-form');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  const displayEmail = document.getElementById('display-email');
  const changeEmailLink = document.getElementById('change-email');

  // Se a página não tiver essa estrutura, não faz nada
  if (
    !stepEmail ||
    !stepPassword ||
    !emailForm ||
    !passwordForm ||
    !emailInput ||
    !passwordInput ||
    !emailError ||
    !passwordError ||
    !displayEmail ||
    !changeEmailLink
  ) {
    return;
  }

  let currentEmail = '';

  // Se vier email pela URL (?email=...), já preenche e pula pra senha
  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get('email');
  if (emailFromUrl) {
    emailInput.value = emailFromUrl;
    currentEmail = emailFromUrl;
    displayEmail.textContent = emailFromUrl;
    stepEmail.classList.add('d-none');
    stepPassword.classList.remove('d-none');
    passwordInput.focus();
  }

  // ETAPA 1 — verifica se o e-mail existe no banco
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailError.textContent = '';

    const email = emailInput.value.trim();

    if (!email) {
      emailError.textContent = 'Por favor, informe um e-mail.';
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        emailError.textContent =
          data.message || 'Erro ao verificar e-mail. Tente novamente.';
        return;
      }

      // Se não existe → manda pro cadastro com o e-mail preenchido
      if (!data.exists) {
        const irCadastro = confirm(
          'Não encontramos uma conta com esse e-mail. Deseja criar uma conta?'
        );

        if (irCadastro) {
          window.location.href = `cadastro.html?email=${encodeURIComponent(
            email
          )}`;
        }

        return;
      }

      // Se existe mas estiver desativado / bloqueado (caso você use isso depois)
      if (data.status === false || data.status === 'inativo' || data.status === 'bloqueado') {
        emailError.textContent =
          'Esta conta está desativada. Entre em contato com o suporte.';
        return;
      }

      // E-mail existe e está ativo → segue para etapa da senha
      currentEmail = email;
      displayEmail.textContent = email;

      stepEmail.classList.add('d-none');
      stepPassword.classList.remove('d-none');

      passwordInput.focus();
    } catch (err) {
      console.error(err);
      emailError.textContent = 'Erro de conexão com o servidor.';
    }
  });

  // ETAPA 2 — faz login na API
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordError.textContent = '';

    const senha = passwordInput.value.trim();

    if (!senha) {
      passwordError.textContent = 'Por favor, informe a senha.';
      return;
    }

    if (!currentEmail) {
      passwordError.textContent = 'Erro inesperado. Tente novamente.';
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, senha }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        passwordError.textContent =
          data.message || 'E-mail ou senha inválidos.';
        return;
      }

      // sucesso → salva no localStorage e vai pra home
      saveAuth(data);
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      passwordError.textContent = 'Erro de conexão com o servidor.';
    }
  });

  // voltar para alterar e-mail
  changeEmailLink.addEventListener('click', (e) => {
    e.preventDefault();

    stepPassword.classList.add('d-none');
    stepEmail.classList.remove('d-none');

    passwordInput.value = '';
    passwordError.textContent = '';

    emailInput.focus();
  });
}

/* ------------------- CADASTRO (cadastro.html) ------------------- */

function setupCadastroPage() {
  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get('email');
  if (emailFromUrl) {
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = emailFromUrl;
  }

  const form = document.getElementById('cadastro-form');
  const errorBox = document.getElementById('cadastro-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.textContent = '';

    const nome = document.getElementById('nome')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const telefone = document.getElementById('telefone')?.value.trim();
    const tipo = document.getElementById('tipo')?.value;
    const senha = document.getElementById('senha')?.value;
    const confirmarSenha = document.getElementById('confirmarSenha')?.value;

    // validação básica
    if (!nome || !email || !tipo || !senha || !confirmarSenha) {
      if (errorBox) {
        errorBox.textContent = 'Preencha todos os campos obrigatórios.';
      } else {
        alert('Preencha todos os campos obrigatórios.');
      }
      return;
    }

    if (senha.length < 8) {
      if (errorBox) {
        errorBox.textContent = 'A senha deve ter pelo menos 8 caracteres.';
      } else {
        alert('A senha deve ter pelo menos 8 caracteres.');
      }
      return;
    }

    if (senha !== confirmarSenha) {
      if (errorBox) {
        errorBox.textContent = 'As senhas não coincidem.';
      } else {
        alert('As senhas não coincidem.');
      }
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          telefone: telefone || undefined,
          tipo,
          senha,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (errorBox) {
          errorBox.textContent = data.message || 'Erro ao criar conta.';
        } else {
          alert(data.message || 'Erro ao criar conta.');
        }
        return;
      }

      // auto-login após cadastro (API devolve { token, user })
      saveAuth(data);
      alert('Conta criada com sucesso!');
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      if (errorBox) {
        errorBox.textContent = 'Erro de conexão com o servidor.';
      } else {
        alert('Erro de conexão com o servidor.');
      }
    }
  });
}

/* ------------------- INICIALIZAÇÃO ------------------- */

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop()?.toLowerCase();

  if (page === 'login.html') {
    setupLoginPage();
  } else if (page === 'cadastro.html') {
    setupCadastroPage();
  }
});

// Se quiser usar esses helpers em outros arquivos,
// eles já estão no escopo global (window.*) por estarem no topo.
