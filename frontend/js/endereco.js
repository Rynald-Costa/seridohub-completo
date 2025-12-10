// frontend/js/endereco.js

const ADDRESS_KEY = 'addresses';
const SELECTED_ADDRESS_KEY = 'selectedAddress';

// Utilitários básicos de endereço
function getAddresses() {
  const raw = localStorage.getItem(ADDRESS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAddresses(addresses) {
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses));
}

function saveSelectedAddress(address) {
  localStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(address));
}

function renderAddressList() {
  const list = document.getElementById('address-list');
  const empty = document.getElementById('address-empty');

  if (!list || !empty) return;

  const addresses = getAddresses();

  if (!addresses.length) {
    list.innerHTML = '';
    empty.classList.remove('d-none');
    return;
  }

  empty.classList.add('d-none');

  const selectedRaw = localStorage.getItem(SELECTED_ADDRESS_KEY);
  let selectedId = null;
  if (selectedRaw) {
    try {
      const sel = JSON.parse(selectedRaw);
      selectedId = sel.id ?? null;
    } catch {
      selectedId = null;
    }
  }

  list.innerHTML = addresses
    .map((addr) => {
      const isSelected = addr.id === selectedId;

      const linha1 = [
        addr.logradouro || '',
        addr.numero || '',
        addr.bairro || '',
      ]
        .filter(Boolean)
        .join(', ');

      const linha2 = [
        addr.cidade || '',
        addr.estado || '',
        addr.cep || '',
      ]
        .filter(Boolean)
        .join(' - ');

      return `
        <label class="border rounded-3 p-3 d-flex gap-3 align-items-start address-item">
          <input
            type="radio"
            name="enderecoSelecionado"
            class="form-check-input mt-1"
            value="${addr.id}"
            ${isSelected ? 'checked' : ''}
          />
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <div>
                <strong>${addr.apelido || 'Endereço'}</strong>
                ${
                  addr.nome
                    ? `<span class="small text-muted ms-2">${addr.nome}</span>`
                    : ''
                }
              </div>
              <button
                type="button"
                class="btn btn-link btn-sm text-danger p-0 address-delete-btn"
                data-id="${addr.id}"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <div class="small">
              ${linha1 || ''}
            </div>
            <div class="small text-muted">
              ${linha2 || ''}
              ${
                addr.complemento
                  ? `<br /><span>${addr.complemento}</span>`
                  : ''
              }
            </div>
          </div>
        </label>
      `;
    })
    .join('');

  // Eventos de delete
  list.querySelectorAll('.address-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      if (!id) return;
      if (!confirm('Deseja remover este endereço?')) return;

      const current = getAddresses().filter((a) => a.id !== id);
      saveAddresses(current);

      // se o selecionado foi removido, limpa
      const selRaw = localStorage.getItem(SELECTED_ADDRESS_KEY);
      if (selRaw) {
        try {
          const sel = JSON.parse(selRaw);
          if (sel.id === id) {
            localStorage.removeItem(SELECTED_ADDRESS_KEY);
          }
        } catch {
          // ignore
        }
      }

      renderAddressList();
    });
  });
}

function handleAddressForm() {
  const form = document.getElementById('address-form');
  const errorBox = document.getElementById('address-form-error');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errorBox) errorBox.textContent = '';

    const apelido = document.getElementById('endereco-apelido').value.trim();
    const nome = document.getElementById('endereco-nome').value.trim();
    const telefone = document
      .getElementById('endereco-telefone')
      .value.trim();
    const cep = document.getElementById('endereco-cep').value.trim();
    const logradouro = document
      .getElementById('endereco-logradouro')
      .value.trim();
    const numero = document.getElementById('endereco-numero').value.trim();
    const bairro = document.getElementById('endereco-bairro').value.trim();
    const cidade = document.getElementById('endereco-cidade').value.trim();
    const estado = document.getElementById('endereco-estado').value.trim();
    const complemento = document
      .getElementById('endereco-complemento')
      .value.trim();

    if (!apelido || !nome || !logradouro) {
      if (errorBox) {
        errorBox.textContent =
          'Preencha pelo menos apelido, nome e rua/avenida.';
      }
      return;
    }

    const addresses = getAddresses();
    const newId =
      addresses.length > 0
        ? Math.max(...addresses.map((a) => a.id || 0)) + 1
        : 1;

    const newAddress = {
      id: newId,
      apelido,
      nome,
      telefone,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      complemento,
    };

    addresses.push(newAddress);
    saveAddresses(addresses);
    saveSelectedAddress(newAddress);

    form.reset();
    renderAddressList();
  });
}

function handleContinueButton() {
  const btn = document.getElementById('address-continue-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const addresses = getAddresses();
    if (!addresses.length) {
      alert('Cadastre e selecione um endereço antes de continuar.');
      return;
    }

    const selectedRadio = document.querySelector(
      'input[name="enderecoSelecionado"]:checked'
    );

    if (!selectedRadio) {
      alert('Selecione um endereço antes de continuar.');
      return;
    }

    const selectedId = Number(selectedRadio.value);
    const address = addresses.find((a) => a.id === selectedId);
    if (!address) {
      alert('Endereço selecionado não encontrado.');
      return;
    }

    saveSelectedAddress(address);

    // Próxima etapa do fluxo: pagamento
    window.location.href = 'pagamento.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderAddressList();
  handleAddressForm();
  handleContinueButton();
});
