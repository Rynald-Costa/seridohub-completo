// frontend/js/layout.js
// Responsável por carregar header/footer + aplicar estado de autenticação no header

const PARTIALS_BASE = "partials/";

document.addEventListener("DOMContentLoaded", () => {
  loadLayout();
});

/* -------------------- Carrega Header e Footer -------------------- */

async function loadLayout() {
  const headerContainer = document.getElementById("site-header");
  const footerContainer = document.getElementById("site-footer");

  if (headerContainer) {
    const page = window.location.pathname.split("/").pop().toLowerCase();

    const publicPages = [
      "login.html",
      "cadastro.html",
      "register.html",
      "signin.html",
      "signup.html",
      "index_public.html",
    ];

    const headerFile = publicPages.includes(page)
      ? `${PARTIALS_BASE}header_public.html`
      : `${PARTIALS_BASE}header_app.html`;

    try {
      const response = await fetch(headerFile);
      headerContainer.innerHTML = await response.text();

      // Só depois que o header for injetado
      applyAuthToHeader();
    } catch (err) {
      console.error("Erro ao carregar header:", err);
    }
  }

  if (footerContainer) {
    try {
      const response = await fetch(`${PARTIALS_BASE}footer.html`);
      footerContainer.innerHTML = await response.text();
    } catch (err) {
      console.error("Erro ao carregar footer:", err);
    }
  }
}

/* -------------------- Personalização visual por tipo de usuário -------------------- */
/**
 * Header padrão para visitante/cliente/admin.
 * Para VENDEDOR:
 * - Sem busca desktop
 * - Sem botão busca mobile
 * - Sem barra secundária ("Todos")
 * - Sem carrinho
 * - Sem link "Devoluções e pedidos"
 * - Aplica classe .seller-mode (bolinhas)
 */
function customizeHeaderForUserType(tipo) {
  const headerEl = document.querySelector(".serido-header");
  const searchForm = document.getElementById("header-search-form");
  const searchMobileBtn = document.getElementById(
    "header-search-mobile-button"
  );
  const secondaryNav = document.getElementById("header-secondary-nav");
  const cartLink = document.querySelector(".serido-header-cart-link");
  const ordersLink = document.getElementById("header-orders-link");

  const isSeller = tipo === "VENDEDOR";

  if (headerEl) {
    headerEl.classList.toggle("seller-mode", isSeller);
  }

  const toToggle = [searchForm, searchMobileBtn, secondaryNav, cartLink, ordersLink];

  toToggle.forEach((el) => {
    if (!el) return;
    if (isSeller) {
      el.classList.add("header-hidden");
    } else {
      el.classList.remove("header-hidden");
    }
  });
}

/* -------------------- Estado de Autenticação no Header -------------------- */

function applyAuthToHeader() {
  // Elementos específicos do header_app.html (topo)
  const userLink = document.getElementById("header-user-link");
  const greetingSpan = document.getElementById("header-user-greeting");
  const actionSpan = document.getElementById("header-user-action");
  const sellerLink = document.getElementById("header-seller-link");
  const headerLogoutLink = document.getElementById("header-logout-link");

  // Elementos do menu lateral (offcanvas)
  const menuUserLabel = document.getElementById("menu-user-label");
  const menuBtnLoginLogout = document.getElementById("menu-btn-login-logout");
  const menuItemMinhaLoja = document.getElementById("menu-item-minha-loja");

  // Se não tiver elementos de header, provavelmente é header_public → não faz nada
  if (!userLink || !greetingSpan || !actionSpan) return;

  // user + token salvos pelo auth.js
  const rawUser =
    localStorage.getItem("user") || localStorage.getItem("currentUser");
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");

  // -------------------- VISITANTE --------------------
  if (!rawUser || !token) {
    greetingSpan.textContent = "Olá, visitante";
    actionSpan.textContent = "Entre ou cadastre-se";
    userLink.href = "login.html";

    if (sellerLink) sellerLink.classList.add("d-none");
    if (menuItemMinhaLoja) menuItemMinhaLoja.classList.add("d-none");
    if (menuUserLabel) menuUserLabel.textContent = "visitante";
    if (headerLogoutLink) headerLogoutLink.classList.add("d-none");

    if (menuBtnLoginLogout) {
      menuBtnLoginLogout.textContent = "Entrar ou cadastrar-se";
      menuBtnLoginLogout.classList.remove("btn-outline-danger");
      menuBtnLoginLogout.classList.add("btn-outline-dark");
      menuBtnLoginLogout.onclick = () => {
        window.location.href = "login.html";
      };
    }

    // Header padrão para visitante
    customizeHeaderForUserType("VISITANTE");
    return;
  }

  // -------------------- LOGADO --------------------
  let user;
  try {
    user = JSON.parse(rawUser);
  } catch {
    // se der erro, limpa tudo e volta a ser visitante
    clearAuth();
    greetingSpan.textContent = "Olá, visitante";
    actionSpan.textContent = "Entre ou cadastre-se";
    userLink.href = "login.html";

    if (sellerLink) sellerLink.classList.add("d-none");
    if (menuItemMinhaLoja) menuItemMinhaLoja.classList.add("d-none");
    if (menuUserLabel) menuUserLabel.textContent = "visitante";
    if (headerLogoutLink) headerLogoutLink.classList.add("d-none");

    if (menuBtnLoginLogout) {
      menuBtnLoginLogout.textContent = "Entrar ou cadastrar-se";
      menuBtnLoginLogout.classList.remove("btn-outline-danger");
      menuBtnLoginLogout.classList.add("btn-outline-dark");
      menuBtnLoginLogout.onclick = () => {
        window.location.href = "login.html";
      };
    }

    customizeHeaderForUserType("VISITANTE");
    return;
  }

  const primeiroNome =
    typeof user.nome === "string" ? user.nome.split(" ")[0] : "usuário";
  const tipo = user.tipo || "CLIENTE";

  // Header superior
  greetingSpan.textContent = `Olá, ${primeiroNome}`;
  actionSpan.textContent = "Minha conta";
  userLink.href = "conta.html";

  // Controle do link "Minha loja" → só para VENDEDOR
  const isSeller = tipo === "VENDEDOR";
  if (sellerLink) {
    sellerLink.classList.toggle("d-none", !isSeller);
  }
  if (menuItemMinhaLoja) {
    menuItemMinhaLoja.classList.toggle("d-none", !isSeller);
  }

  // Label "Logado como ..." no menu lateral
  if (menuUserLabel) {
    const tipoLabel =
      tipo === "VENDEDOR"
        ? "vendedor"
        : tipo === "ADMIN"
        ? "administrador"
        : "cliente";
    menuUserLabel.textContent = `${primeiroNome} (${tipoLabel})`;
  }

  // Botão do menu lateral → vira "Sair"
  if (menuBtnLoginLogout) {
    menuBtnLoginLogout.textContent = "Sair";
    menuBtnLoginLogout.classList.remove("btn-outline-dark");
    menuBtnLoginLogout.classList.add("btn-outline-danger");

    menuBtnLoginLogout.onclick = () => {
      if (typeof logout === "function") {
        logout();
      } else {
        clearAuth();
      }

      const offcanvasElement = document.getElementById(
        "menuPrincipalOffcanvas"
      );
      if (
        offcanvasElement &&
        typeof bootstrap !== "undefined" &&
        bootstrap.Offcanvas
      ) {
        let offcanvasInstance = bootstrap.Offcanvas.getInstance(
          offcanvasElement
        );
        if (!offcanvasInstance) {
          offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement);
        }
        offcanvasInstance.hide();
      }

      window.location.href = "index.html";
    };
  }

  // Logout no header (bolinha vermelha) → só para vendedor
  if (headerLogoutLink) {
    if (!isSeller) {
      headerLogoutLink.classList.add("d-none");
    } else {
      headerLogoutLink.classList.remove("d-none");
      headerLogoutLink.onclick = (e) => {
        e.preventDefault();
        if (typeof logout === "function") {
          logout();
        } else {
          clearAuth();
        }
        window.location.href = "index.html";
      };
    }
  }

  // Ajusta o visual do header conforme o tipo (VENDEDOR x demais)
  customizeHeaderForUserType(tipo);
}

/* -------------------- Função auxiliar para logout global -------------------- */

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
}
