// Seleccionar los elementos
const usuarioSegment = document.querySelector('.usuario');
const promotorSegment = document.querySelector('.promotor');
const otroSegment = document.querySelector('.otro');
const iniciarSesionButton = document.querySelector('.button-base');

// Seleccionar los campos de entrada
const usuarioInput = document.querySelector('.name input');
const passwordInput = document.querySelector('.mobile-number input');

// Seleccionar sub-segmentos de roles adicionales
const otrosRolesContainer = document.getElementById('otros-roles');
const clienteInternoSegment = document.querySelector('.cliente-interno');
const evaluadorSegment = document.querySelector('.evaluador');
const volverSegment = document.querySelector('.volver');

// Estado para el rol seleccionado
let selectedRole = 'usuario';

// Evento para mostrar el placeholder dinámico
usuarioInput.addEventListener('focus', () => {
  usuarioInput.placeholder = '';
});
usuarioInput.addEventListener('blur', () => {
  if (usuarioInput.value === '') {
    usuarioInput.placeholder = 'Usuario';
  }
});

passwordInput.addEventListener('focus', () => {
  passwordInput.placeholder = '';
});
passwordInput.addEventListener('blur', () => {
  if (passwordInput.value === '') {
    passwordInput.placeholder = 'Contraseña';
  }
});

// Función para manejar la selección de roles principales
function handleRoleSelection(role) {
  // Restablecer el estilo de todos los segmentos
  usuarioSegment.classList.remove('selected');
  promotorSegment.classList.remove('selected');
  otroSegment.classList.remove('selected');

  // Aplicar el estilo al segmento seleccionado
  if (role === 'otro') {
    usuarioSegment.style.display = 'none';
    promotorSegment.style.display = 'none';
    otroSegment.style.display = 'none';
    otrosRolesContainer.style.display = 'flex'; // Mostrar sub-segmentos
  } else {
    usuarioSegment.classList.add('selected');
    otrosRolesContainer.style.display = 'none';
  }

  selectedRole = role;
}

// Función para manejar la selección de sub-roles en "Otro"
function handleSubRoleSelection(subRole) {
  // Restablecer el estilo de todos los sub-segmentos
  clienteInternoSegment.classList.remove('selected');
  evaluadorSegment.classList.remove('selected');
  volverSegment.classList.remove('selected');

  // Aplicar el estilo al sub-segmento seleccionado
  if (subRole === 'cliente_interno') {
    clienteInternoSegment.classList.add('selected');
  } else if (subRole === 'evaluador') {
    evaluadorSegment.classList.add('selected');
  } else if (subRole === 'volver') {
    // Volver a la vista de roles principales
    usuarioSegment.style.display = '';
    promotorSegment.style.display = '';
    otroSegment.style.display = '';
    otrosRolesContainer.style.display = 'none';
  }

  selectedRole = subRole;
}

// Eventos para seleccionar roles principales
usuarioSegment.addEventListener('click', () => handleRoleSelection('usuario'));
promotorSegment.addEventListener('click', () => handleRoleSelection('promotor'));
otroSegment.addEventListener('click', () => handleRoleSelection('otro'));

// Eventos para seleccionar sub-roles en "Otro"
clienteInternoSegment.addEventListener('click', () => handleSubRoleSelection('cliente_interno'));
evaluadorSegment.addEventListener('click', () => handleSubRoleSelection('evaluador'));
volverSegment.addEventListener('click', () => handleSubRoleSelection('volver'));

// Agregar efecto hover en "Usuario"
usuarioSegment.addEventListener('mouseenter', () => {
  usuarioSegment.style.backgroundColor = '#d1c4e9';
  usuarioSegment.style.color = '#4a148c';
});
usuarioSegment.addEventListener('mouseleave', () => {
  usuarioSegment.style.backgroundColor = '';
  usuarioSegment.style.color = '';
});

// Agregar efecto hover en "Promotor"
promotorSegment.addEventListener('mouseenter', () => {
  promotorSegment.style.backgroundColor = '#d1c4e9';
  promotorSegment.style.color = '#4a148c';
});
promotorSegment.addEventListener('mouseleave', () => {
  promotorSegment.style.backgroundColor = '';
  promotorSegment.style.color = '';
});

// Agregar efecto hover en "Otro"
otroSegment.addEventListener('mouseenter', () => {
  otroSegment.style.backgroundColor = '#d1c4e9';
  otroSegment.style.color = '#4a148c';
});
otroSegment.addEventListener('mouseleave', () => {
  otroSegment.style.backgroundColor = '';
  otroSegment.style.color = '';
});

// Agregar efecto hover en "Iniciar Sesión"
iniciarSesionButton.addEventListener('mouseenter', () => {
  iniciarSesionButton.style.backgroundColor = '#4a148c';
  iniciarSesionButton.style.transform = 'scale(1.05)';
});
iniciarSesionButton.addEventListener('mouseleave', () => {
  iniciarSesionButton.style.backgroundColor = '#6a1b9a';
  iniciarSesionButton.style.transform = 'scale(1)';
});
