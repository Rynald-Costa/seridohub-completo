// frontend/js/meus_produtos.js

let PRODUTOS_VENDEDOR = []; // cache em memória para filtros/edição
let TOKEN_ATUAL = null;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof getCurrentUser !== "function" || typeof getToken !== "function") {
    console.error(
      "Funções de autenticação (getCurrentUser/getToken) não disponíveis."
    );
    return;
  }

  const user = getCurrentUser();
  const token = getToken();
  TOKEN_ATUAL = token;

  const alertBox = document.getElementById("produtos-vendedor-alert");

  if (!user || !token) {
    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert alert-warning">
          Você precisa estar logado para acessar esta página.
        </div>
      `;
    }
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  if (user.tipo !== "VENDEDOR") {
    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert alert-danger">
          Apenas usuários do tipo <strong>Vendedor</strong> podem gerenciar produtos.
        </div>
      `;
    }
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
    return;
  }

  // Inicializa toda a página
  initProdutosPage(token);
  setupPreviewInput();
});

function initProdutosPage(token) {
  setupModalNovoProduto();
  setupFormProduto(token);
  setupFiltros();
  carregarProdutos(token);
}

/* ------------------------------------------------------------------
   MODAL / FORMULÁRIO DE PRODUTO (criação + edição)
   ------------------------------------------------------------------ */
function setupPreviewInput() {
  const urlInput = document.getElementById('produto-imagem'); // <- id do campo
  const img      = document.getElementById('produto-preview-img');
  const placeholder = document.getElementById('produto-preview-placeholder');

  if (!urlInput || !img || !placeholder) return;

  const updatePreview = () => {
    const url = urlInput.value.trim();

    if (!url) {
      // sem URL → esconde imagem, mostra placeholder
      img.src = '';
      img.classList.add('d-none');
      placeholder.classList.remove('d-none');
      return;
    }

    // tenta carregar a imagem
    img.onload = () => {
      img.classList.remove('d-none');
      placeholder.classList.add('d-none');
    };

    img.onerror = () => {
      // se a URL for inválida, volta pro placeholder
      img.src = '';
      img.classList.add('d-none');
      placeholder.classList.remove('d-none');
    };

    img.src = url;
  };

  // atualiza enquanto digita e quando perde o foco
  urlInput.addEventListener('input', updatePreview);
  urlInput.addEventListener('change', updatePreview);

  // se o modal abrir já com um valor preenchido, você pode chamar isso
  updatePreview();
}

function setupModalNovoProduto() {
  const btnNovo = document.getElementById("btn-abrir-modal-produto");
  const form = document.getElementById("produto-form");
  const titulo = document.getElementById("produtoModalLabel");
  const erro = document.getElementById("produto-error");
  const sucesso = document.getElementById("produto-success");
  const ativoInput = document.getElementById("produto-ativo");

  if (!btnNovo || !form) return;

  btnNovo.addEventListener("click", () => {
    form.reset();
    const idInput = document.getElementById("produto-id");
    if (idInput) idInput.value = "";
    if (titulo) titulo.textContent = "Novo produto";
    if (erro) erro.textContent = "";
    if (sucesso) sucesso.textContent = "";
    if (ativoInput) ativoInput.checked = true;
  });
}

function setupFormProduto(token) {
  const form = document.getElementById("produto-form");
  const errorBox = document.getElementById("produto-error");
  const successBox = document.getElementById("produto-success");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.textContent = "";
    if (successBox) successBox.textContent = "";

    const idInput = document.getElementById("produto-id");

    const nome = document.getElementById("produto-nome")?.value.trim() || "";
    const descricao =
      document.getElementById("produto-descricao")?.value.trim() || "";
    const precoStr =
      document.getElementById("produto-preco")?.value.trim() || "";
    const estoqueStr =
      document.getElementById("produto-estoque")?.value.trim() || "";
    const categoriaSelect =
      document.getElementById("produto-categoria") || null;
    const imagemUrl =
      document.getElementById("produto-imagem")?.value.trim() || "";
    const ativoInput = document.getElementById("produto-ativo");

    if (!nome) {
      if (errorBox) errorBox.textContent = "Informe o nome do produto.";
      return;
    }

    const preco = Number(precoStr.replace(",", "."));
    if (!preco || Number.isNaN(preco) || preco <= 0) {
      if (errorBox) errorBox.textContent = "Informe um preço válido.";
      return;
    }

    const estoque = parseInt(estoqueStr, 10);
    if (Number.isNaN(estoque) || estoque < 0) {
      if (errorBox)
        errorBox.textContent = "Informe um estoque válido (zero ou maior).";
      return;
    }

    const idCategoria = categoriaSelect ? categoriaSelect.value || null : null;
    const ativo = ativoInput ? !!ativoInput.checked : true;

    const payload = {
      nome,
      descricao: descricao || undefined,
      preco,
      estoque,
      // nomes compatíveis com o que você já tinha no back
      imagemUrl: imagemUrl || undefined,
      idCategoria: idCategoria || undefined,
      ativo,
    };

    const produtoId = idInput ? idInput.value.trim() : "";
    const isEdicao = !!produtoId;

    try {
      const url = isEdicao
        ? `${API_URL}/produtos/${produtoId}`
        : `${API_URL}/produtos`;

      const resp = await fetch(url, {
        method: isEdicao ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (errorBox) {
          errorBox.textContent =
            data.message ||
            (isEdicao
              ? "Erro ao atualizar produto."
              : "Erro ao cadastrar produto.");
        } else {
          alert(
            data.message ||
              (isEdicao
                ? "Erro ao atualizar produto."
                : "Erro ao cadastrar produto.")
          );
        }
        return;
      }

      if (successBox) {
        successBox.textContent = isEdicao
          ? "Produto atualizado com sucesso!"
          : "Produto cadastrado com sucesso!";
      }

      // fecha o modal depois de um pequeno delay visual
      setTimeout(() => {
        const modalEl = document.getElementById("produtoModal");
        if (
          modalEl &&
          typeof bootstrap !== "undefined" &&
          bootstrap.Modal
        ) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
        }
      }, 300);

      // recarrega lista
      carregarProdutos(token);
    } catch (err) {
      console.error(err);
      if (errorBox) {
        errorBox.textContent = "Erro de conexão com o servidor.";
      } else {
        alert("Erro de conexão com o servidor.");
      }
    }
  });
}

/* ------------------------------------------------------------------
   CARREGAR PRODUTOS E PREPARAR LISTA / FILTROS
   ------------------------------------------------------------------ */

async function carregarProdutos(token) {
  const list = document.getElementById("produtos-vendedor-list");
  const empty = document.getElementById("produtos-vendedor-empty");
  const countSpan = document.getElementById("produtos-vendedor-count");

  if (!list) return;

  list.innerHTML = "";
  if (empty) empty.classList.add("d-none");
  if (countSpan) countSpan.textContent = "";

  try {
    const resp = await fetch(`${API_URL}/produtos/minha-loja`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await resp.json();

    if (!resp.ok) {
      const msg = data.message || "Erro ao carregar produtos.";
      const alertBox = document.getElementById("produtos-vendedor-alert");
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
      } else {
        alert(msg);
      }
      return;
    }

    const { loja, produtos } = data;

    PRODUTOS_VENDEDOR = Array.isArray(produtos) ? produtos : [];

    if (countSpan) {
      countSpan.textContent = PRODUTOS_VENDEDOR.length
        ? `(${PRODUTOS_VENDEDOR.length} produto(s))`
        : "(nenhum produto cadastrado ainda)";
    }

    // Preenche select de categorias com base nos produtos carregados (se houver)
    preencherCategoriasFiltroEForm(PRODUTOS_VENDEDOR);

    if (!PRODUTOS_VENDEDOR.length) {
      if (empty) empty.classList.remove("d-none");
      return;
    }

    // renderiza a lista considerando filtros atuais
    aplicarFiltrosEListagem(loja);
  } catch (err) {
    console.error(err);
    const alertBox = document.getElementById("produtos-vendedor-alert");
    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert alert-danger">
          Erro de conexão ao carregar produtos.
        </div>
      `;
    } else {
      alert("Erro de conexão ao carregar produtos.");
    }
  }
}

function preencherCategoriasFiltroEForm(produtos) {
  const filtroSelect = document.getElementById("filtro-categoria-produto");
  const formSelect = document.getElementById("produto-categoria");

  if (!filtroSelect && !formSelect) return;

  const categoriasMap = new Map();

  produtos.forEach((p) => {
    const idCat =
      p.idCategoria ?? p.id_categoria ?? p.categoriaId ?? null;
    const nomeCat =
      (p.categoria && p.categoria.nome) ||
      p.categoriaNome ||
      p.nomeCategoria ||
      null;

    if (idCat && !categoriasMap.has(idCat)) {
      categoriasMap.set(idCat, nomeCat || `Categoria ${idCat}`);
    }
  });

  const opcoes = Array.from(categoriasMap.entries());

  const preencher = (select, incluirTodas) => {
    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = "";

    if (incluirTodas) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Todas as categorias";
      select.appendChild(opt);
    } else {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Selecione uma categoria";
      select.appendChild(opt);
    }

    opcoes.forEach(([id, nome]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = nome;
      select.appendChild(opt);
    });

    // tenta manter seleção anterior, se ainda existir
    if (valorAtual && select.querySelector(`option[value="${valorAtual}"]`)) {
      select.value = valorAtual;
    }
  };

  preencher(filtroSelect, true);
  preencher(formSelect, false);
}

/* ------------------------------------------------------------------
   LISTAGEM + FILTROS
   ------------------------------------------------------------------ */

function setupFiltros() {
  const buscaInput = document.getElementById("filtro-busca-produto");
  const categoriaSelect = document.getElementById("filtro-categoria-produto");
  const statusSelect = document.getElementById("filtro-status-produto");
  const btnLimpar = document.getElementById("btn-limpar-filtros-produto");
  const list = document.getElementById("produtos-vendedor-list");

  if (buscaInput) {
    buscaInput.addEventListener("input", () => aplicarFiltrosEListagem());
  }
  if (categoriaSelect) {
    categoriaSelect.addEventListener("change", () =>
      aplicarFiltrosEListagem()
    );
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", () => aplicarFiltrosEListagem());
  }
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      if (buscaInput) buscaInput.value = "";
      if (categoriaSelect) categoriaSelect.value = "";
      if (statusSelect) statusSelect.value = "";
      aplicarFiltrosEListagem();
    });
  }

  // Delegação de eventos para Editar / Remover
  if (list) {
    list.addEventListener("click", (ev) => {
      const editarBtn = ev.target.closest(".produto-editar-btn");
      const removerBtn = ev.target.closest(".produto-remover-btn");

      if (editarBtn) {
        const id = editarBtn.getAttribute("data-id");
        abrirEdicaoProduto(id);
      } else if (removerBtn) {
        const id = removerBtn.getAttribute("data-id");
        removerProduto(id);
      }
    });
  }
}

function aplicarFiltrosEListagem(lojaFromFetch = null) {
  const list = document.getElementById("produtos-vendedor-list");
  const empty = document.getElementById("produtos-vendedor-empty");
  const buscaInput = document.getElementById("filtro-busca-produto");
  const categoriaSelect = document.getElementById("filtro-categoria-produto");
  const statusSelect = document.getElementById("filtro-status-produto");

  if (!list) return;

  // esconde empty state de "nenhum produto" na listagem filtrada,
  // ele só aparece quando realmente não existe produto algum.
  if (empty && PRODUTOS_VENDEDOR.length) {
    empty.classList.add("d-none");
  }

  const textoBusca = (buscaInput?.value || "").trim().toLowerCase();
  const categoriaFiltro = categoriaSelect?.value || "";
  const statusFiltro = statusSelect?.value || "";

  const loja = lojaFromFetch || null; // apenas para label "Loja" se quiser usar

  const filtrados = PRODUTOS_VENDEDOR.filter((p) => {
    // busca por nome / descrição
    if (textoBusca) {
      const nome = (p.nome || "").toLowerCase();
      const desc = (p.descricao || "").toLowerCase();
      if (!nome.includes(textoBusca) && !desc.includes(textoBusca)) {
        return false;
      }
    }

    // filtro de categoria
    if (categoriaFiltro) {
      const idCat =
        p.idCategoria ?? p.id_categoria ?? p.categoriaId ?? "";
      if (String(idCat) !== String(categoriaFiltro)) return false;
    }

    // filtro de status
    if (statusFiltro) {
      const ativo = !!p.ativo;
      if (statusFiltro === "ativo" && !ativo) return false;
      if (statusFiltro === "inativo" && ativo) return false;
    }

    return true;
  });

  if (!filtrados.length) {
    list.innerHTML = `
      <div class="list-group-item small text-muted">
        Nenhum produto encontrado com os filtros atuais.
      </div>
    `;
    return;
  }

  list.innerHTML = filtrados
    .map((p) => {
      const precoNumber = Number(p.preco || 0);
      const precoFmt = precoNumber
        .toFixed(2)
        .replace(".", ",");

      const estoque = p.estoque ?? 0;

      const categoriaNome =
        (p.categoria && p.categoria.nome) ||
        p.categoriaNome ||
        p.nomeCategoria ||
        "";

      const idCat =
        p.idCategoria ?? p.id_categoria ?? p.categoriaId ?? "";

      const imagemUrl = p.imagemUrl || p.imagem_principal || "";

      const ativo = !!p.ativo;

      const statusBadgeClass = ativo
        ? "bg-success-subtle text-success"
        : "bg-secondary-subtle text-secondary";
      const statusText = ativo ? "Ativo" : "Inativo";

      return `
        <div class="list-group-item produto-item d-flex align-items-center justify-content-between gap-3" data-id="${
          p.id
        }">
          <div class="d-flex align-items-center gap-3 flex-grow-1">
            <div class="produto-thumb rounded flex-shrink-0">
              ${
                imagemUrl
                  ? `<img src="${imagemUrl}" alt="${escapeHtml(
                      p.nome || ""
                    )}">`
                  : `<i class="bi bi-box-seam text-muted"></i>`
              }
            </div>
            <div class="produto-info-texto">
              <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                <strong class="produto-nome">${escapeHtml(
                  p.nome || ""
                )}</strong>
                ${
                  categoriaNome
                    ? `<span class="badge bg-light text-muted produto-categoria-badge" data-categoria-id="${idCat}">
                         ${escapeHtml(categoriaNome)}
                       </span>`
                    : ""
                }
              </div>
              ${
                p.descricao
                  ? `<div class="small text-muted produto-descricao">
                       ${escapeHtml(p.descricao)}
                     </div>`
                  : ""
              }
            </div>
          </div>
          <div class="text-end small produto-info-acoes">
            <div>
              <span class="text-muted d-block">Preço</span>
              <div class="fw-semibold produto-preco">R$ ${precoFmt}</div>
            </div>
            <div class="mt-1">
              <span class="text-muted d-block">Estoque</span>
              <div class="fw-semibold produto-estoque">${estoque} unid.</div>
            </div>
            <div class="mt-1">
              <span class="badge rounded-pill produto-status-badge ${statusBadgeClass}">
                ${statusText}
              </span>
            </div>
            <div class="mt-2 d-flex justify-content-end gap-1">
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm produto-editar-btn"
                data-id="${p.id}"
              >
                Editar
              </button>
              <button
                type="button"
                class="btn btn-outline-danger btn-sm produto-remover-btn"
                data-id="${p.id}"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ------------------------------------------------------------------
   EDIÇÃO E REMOÇÃO
   ------------------------------------------------------------------ */

function abrirEdicaoProduto(id) {
  if (!id) return;
  const produto = PRODUTOS_VENDEDOR.find(
    (p) => String(p.id) === String(id)
  );
  if (!produto) return;

  const titulo = document.getElementById("produtoModalLabel");
  const idInput = document.getElementById("produto-id");
  const nomeInput = document.getElementById("produto-nome");
  const descInput = document.getElementById("produto-descricao");
  const precoInput = document.getElementById("produto-preco");
  const estoqueInput = document.getElementById("produto-estoque");
  const categoriaSelect = document.getElementById("produto-categoria");
  const imagemInput = document.getElementById("produto-imagem");
  const ativoInput = document.getElementById("produto-ativo");
  const errorBox = document.getElementById("produto-error");
  const successBox = document.getElementById("produto-success");

  if (errorBox) errorBox.textContent = "";
  if (successBox) successBox.textContent = "";

  if (titulo) titulo.textContent = "Editar produto";
  if (idInput) idInput.value = produto.id;
  if (nomeInput) nomeInput.value = produto.nome || "";
  if (descInput) descInput.value = produto.descricao || "";

  if (precoInput) {
    const precoNumber = Number(produto.preco || 0);
    precoInput.value = precoNumber.toString().replace(".", ",");
  }

  if (estoqueInput) {
    estoqueInput.value =
      produto.estoque != null ? String(produto.estoque) : "0";
  }

  const idCat =
    produto.idCategoria ??
    produto.id_categoria ??
    produto.categoriaId ??
    "";
  if (categoriaSelect) {
    categoriaSelect.value = idCat || "";
  }

  const imagemUrl = produto.imagemUrl || produto.imagem_principal || "";
  if (imagemInput) imagemInput.value = imagemUrl;

  if (ativoInput) ativoInput.checked = !!produto.ativo;

  // atualiza preview da imagem se o script inline estiver carregado
  const evt = new Event("change");
  if (imagemInput) imagemInput.dispatchEvent(evt);

  const modalEl = document.getElementById("produtoModal");
  if (modalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    instance.show();
  }
}

async function removerProduto(id) {
  if (!id) return;
  if (!window.confirm("Tem certeza que deseja remover este produto?")) return;

  try {
    const resp = await fetch(`${API_URL}/produtos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${TOKEN_ATUAL}`,
      },
    });

    // como o back retorna 204, normalmente não há JSON
    let data = null;
    if (resp.status !== 204) {
      try {
        data = await resp.json();
      } catch (e) {
        // se não tiver corpo, só ignora
        data = null;
      }
    }

    if (!resp.ok) {
      const msg = (data && data.message) || "Erro ao remover produto.";
      alert(msg);
      return;
    }

    // sucesso: remove do cache local
    PRODUTOS_VENDEDOR = PRODUTOS_VENDEDOR.filter(
      (p) => String(p.id) !== String(id)
    );

    // re-renderiza listagem com filtros atuais
    aplicarFiltrosEListagem();
  } catch (err) {
    console.error(err);
    alert("Erro de conexão ao remover produto.");
  }
}

/* ------------------------------------------------------------------
   UTIL
   ------------------------------------------------------------------ */

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
