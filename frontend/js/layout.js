const PARTIALS_BASE = "partials/";

document.addEventListener("DOMContentLoaded", () => {
  loadLayout();
});

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

      applyAuthToHeader();

      if (typeof syncCartBadge === "function") {
        syncCartBadge();
      }
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

function customizeHeaderForUserType(tipo) {
  const headerEl = document.querySelector(".serido-header");
  const searchForm = document.getElementById("header-search-form");
  const searchMobileBtn = document.getElementById("header-search-mobile-button");
  const secondaryNav = document.getElementById("header-secondary-nav");
  const cartLink = document.querySelector(".serido-header-cart-link");
  const ordersLink = document.getElementById("header-orders-link");

  const isSeller = tipo === "VENDEDOR";

  if (headerEl) {
    headerEl.classList.toggle("seller-mode", isSeller);
  }

  const toToggle = [
    searchForm,
    searchMobileBtn,
    secondaryNav,
    cartLink,
    ordersLink,
  ];

  toToggle.forEach((el) => {
    if (!el) return;
    if (isSeller) {
      el.classList.add("header-hidden");
    } else {
      el.classList.remove("header-hidden");
    }
  });
}

function applyAuthToHeader() {
  const userLink = document.getElementById("header-user-link");
  const greetingSpan = document.getElementById("header-user-greeting");
  const actionSpan = document.getElementById("header-user-action");
  const sellerLink = document.getElementById("header-seller-link");
  const headerLogoutLink = document.getElementById("header-logout-link");

  const menuUserLabel = document.getElementById("menu-user-label");
  const menuBtnLoginLogout = document.getElementById("menu-btn-login-logout");
  const menuItemMinhaLoja = document.getElementById("menu-item-minha-loja");

  if (!userLink || !greetingSpan || !actionSpan) return;

  const rawUser =
    localStorage.getItem("user") || localStorage.getItem("currentUser");
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");

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

    customizeHeaderForUserType("VISITANTE");
    return;
  }

  let user;
  try {
    user = JSON.parse(rawUser);
  } catch {
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

  greetingSpan.textContent = `Olá, ${primeiroNome}`;
  actionSpan.textContent = "Minha conta";
  userLink.href = "conta.html";

  const isSeller = tipo === "VENDEDOR";
  if (sellerLink) {
    sellerLink.classList.toggle("d-none", !isSeller);
  }
  if (menuItemMinhaLoja) {
    menuItemMinhaLoja.classList.toggle("d-none", !isSeller);
  }

  if (menuUserLabel) {
    const tipoLabel =
      tipo === "VENDEDOR"
        ? "vendedor"
        : tipo === "ADMIN"
        ? "administrador"
        : "cliente";
    menuUserLabel.textContent = `${primeiroNome} (${tipoLabel})`;
  }

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

      const offcanvasElement = document.getElementById("menuPrincipalOffcanvas");
      if (
        offcanvasElement &&
        typeof bootstrap !== "undefined" &&
        bootstrap.Offcanvas
      ) {
        let offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (!offcanvasInstance) {
          offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement);
        }
        offcanvasInstance.hide();
      }

      window.location.href = "index.html";
    };
  }

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

  customizeHeaderForUserType(tipo);

  if (typeof syncCartBadge === "function") {
    syncCartBadge();
  }
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
}
