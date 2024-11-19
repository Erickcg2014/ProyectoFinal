document.addEventListener('DOMContentLoaded', () => {
  const btnRegistro = document.getElementById('btnRegistro');
  const idRolSelect = document.getElementById('id_rol');
  const promotorFields = document.getElementById('promotorFields');

  // Mostrar campos adicionales si se selecciona "Promotor" como rol
  idRolSelect.addEventListener('change', () => {
    const selectedRole = parseInt(idRolSelect.value);
    if (selectedRole === 2) { // 2 representa "Promotor"
      promotorFields.style.display = 'block';
    } else {
      promotorFields.style.display = 'none';
    }
  });

  if (btnRegistro) {
    btnRegistro.addEventListener('click', async () => {
      const nombre = document.querySelector('input[name="nombre"]').value.trim();
      const username = document.querySelector('input[name="username"]').value.trim();
      const correo = document.querySelector('input[name="correo"]').value.trim();
      const contraseña = document.querySelector('input[name="contraseña"]').value.trim();
      const id_sede = parseInt(document.querySelector('select[name="sede"]').value);
      const id_rol = parseInt(document.querySelector('select[name="id_rol"]').value);
      const cargo = document.querySelector('input[name="cargo"]').value.trim();
      const nivel = document.querySelector('select[name="nivel"]').value; // Obtener el valor del nivel

      // Validar campos básicos
      if (!nombre || !username || !correo || !contraseña || isNaN(id_sede) || isNaN(id_rol)) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
      }

      // Validar campos adicionales para "Promotor" solamente
      if (id_rol === 2 && (!cargo || !nivel)) {
        alert('Por favor, completa todos los campos adicionales para el rol de Promotor.');
        return;
      }

      // Preparar los datos para enviar en el registro
      const data = { nombre, username, correo, contraseña, id_rol, id_sede };

      // Agregar los campos de "Promotor" si el rol es Promotor
      if (id_rol === 2) {
        data.cargo = cargo;
        data.nivel = nivel;
      }

      try {
        // Verificar si el username ya existe
        const usernameCheck = await fetch(`/registro/username/${username}`);
        const usernameExists = await usernameCheck.json();

        if (usernameExists.exists) {
          alert('El username ya está en uso. Elige otro.');
          return;
        }

        // Enviar los datos de registro
        const response = await fetch('/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          alert('Registro exitoso. Ahora puedes iniciar sesión.');
          window.location.href = '/';
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error('Error en el registro:', error);
        alert('Ocurrió un error. Inténtalo más tarde.');
      }
    });
  }
});
