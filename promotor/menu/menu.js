// Seleccionamos los elementos del DOM
const menuToggle = document.getElementById('menu-toggle');
const sideMenu = document.getElementById('side-menu');
const closeMenu = document.getElementById('close-menu');
const overlay = document.getElementById('overlay');
const menuItems = document.querySelectorAll('.menu-item');
const logoutItem = document.querySelector('.logout-item');

// Abrir el menú lateral
menuToggle.addEventListener('click', () => {
  sideMenu.classList.add('open');
  overlay.classList.add('active');
});

// Cerrar el menú lateral
closeMenu.addEventListener('click', () => {
  sideMenu.classList.remove('open');
  overlay.classList.remove('active');
});

// Cerrar el menú al hacer clic en el fondo oscuro
overlay.addEventListener('click', () => {
  sideMenu.classList.remove('open');
  overlay.classList.remove('active');
});

// Agregar eventos para redirigir a las opciones del menú
menuItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault(); // Prevenir comportamiento predeterminado del enlace
    const href = item.getAttribute('href'); // Obtener la ruta del enlace
    console.log(`Redirigiendo a: ${href}`); // Log para depuración

    // Remover clase 'active' de las opciones previamente seleccionadas
    menuItems.forEach((i) => i.classList.remove('active'));
    item.classList.add('active'); // Añadir clase 'active' a la opción seleccionada

    // Redirigir a la página correspondiente
    window.location.href = href;
  });
});

// Evento para logout
if (logoutItem) {
  logoutItem.addEventListener('click', () => {
    console.log('Cerrando sesión...');
    // Redirigir al login después del logout
    window.location.href = '/login/html/loginSinGuardar.html';
  });
}
