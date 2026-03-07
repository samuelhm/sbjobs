import './style.css';

const form = document.querySelector('#user-form');
const statusEl = document.querySelector('#status');
const submitBtn = document.querySelector('#submit-btn');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!form || !statusEl || !submitBtn) {
  throw new Error('No se encontraron los elementos base del formulario.');
}

function clearErrors() {
  document.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
  });
}

function showErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = document.querySelector(`[data-error-for="${field}"]`);
    if (errorEl) {
      errorEl.textContent = message;
    }
  });
}

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.dataset.type = type;
}

function getFormValues() {
  return {
    email: form.email.value.trim(),
    password: form.password.value,
    first_name: form.first_name.value.trim(),
    last_name: form.last_name.value.trim(),
    phone: form.phone.value.trim(),
    avatar: form.avatar.value.trim(),
  };
}

function validate(values) {
  const errors = {};

  if (!values.email) {
    errors.email = 'El email es obligatorio.';
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = 'Introduce un email valido.';
  }

  if (!values.password) {
    errors.password = 'La password es obligatoria.';
  } else if (values.password.length < 8) {
    errors.password = 'La password debe tener al menos 8 caracteres.';
  }

  if (values.avatar) {
    try {
      const parsed = new URL(values.avatar);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.avatar = 'La URL del avatar debe usar http o https.';
      }
    } catch {
      errors.avatar = 'Introduce una URL valida para avatar.';
    }
  }

  return errors;
}

async function submitRegister(payload) {
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'No se pudo crear el usuario.';
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // noop
    }
    throw new Error(message);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();
  setStatus('', 'idle');

  const values = getFormValues();
  const errors = validate(values);

  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    setStatus('Revisa los campos marcados.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creando...';

  try {
    await submitRegister(values);
    setStatus('usuario creado', 'success');
    form.reset();
  } catch (error) {
    setStatus(error.message || 'No se pudo crear el usuario.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Crear usuario';
  }
});
