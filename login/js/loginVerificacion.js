document.addEventListener('DOMContentLoaded', () => {
    const btnLogin = document.querySelector('.iniciar-sesion'); // Botón de iniciar sesión
    const segments = document.querySelectorAll('.segment'); // Segmentos para seleccionar rol
    const usernameInput = document.getElementById('username'); // Campo de entrada de usuario
    const passwordInput = document.getElementById('password'); // Campo de entrada de contraseña

    let selectedRole = 'usuario'; // Rol por defecto

    // Verificar que los campos de entrada existan en el DOM
    if (!usernameInput || !passwordInput) {
        console.error('No se encontraron los campos de usuario o contraseña en el DOM.');
        return;
    }

    // Lógica para seleccionar entre "Usuario", "Promotor" y otros roles adicionales
    segments.forEach((segment) => {
        segment.addEventListener('click', () => {
            segments.forEach((seg) => seg.classList.remove('selected')); // Eliminar selección previa
            segment.classList.add('selected'); // Añadir clase seleccionada
            selectedRole = segment.getAttribute('data-role'); // Capturar rol seleccionado
            console.log(`Rol seleccionado: ${selectedRole}`);
        });
    });

    // Manejar el evento de clic en el botón de iniciar sesión
    if (btnLogin) {
        btnLogin.addEventListener('click', async (event) => {
            event.preventDefault(); // Evitar el envío predeterminado del formulario
            console.log('Intentando iniciar sesión...');

            // Capturar los valores de usuario y contraseña
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                alert('Por favor, ingresa tu usuario y contraseña.');
                console.warn('Campos incompletos');
                return;
            }

            // Incluir selectedRole en los datos enviados al backend
            const data = { username, password, role: selectedRole };
            console.log('Datos enviados al servidor:', data);

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();
                console.log('Respuesta del servidor:', result);

                if (response.ok) {
                    // Crear un objeto de usuario con los datos de la respuesta
                    const usuarioData = {
                        id: result.user.id,
                        nombre: result.user.nombre,
                        sede: result.user.sede,
                        latitud: result.user.latitud,
                        longitud: result.user.longitud,
                        username: result.user.username,
                        role: result.user.role,
                    };

                    // Guardar en localStorage
                    localStorage.setItem('usuario', JSON.stringify(usuarioData));
                    localStorage.setItem('token', result.token);

                    console.log('Usuario guardado en localStorage:', usuarioData);

                    // Redirigir utilizando el redirectUrl del backend
                    const redirectUrl = result.redirectUrl;
                    if (redirectUrl) {
                        console.log(`Redirigiendo a: ${redirectUrl}`);
                        window.location.href = redirectUrl; // Usar href para redirigir
                    } else {
                        console.error('URL de redirección no definida.');
                    }
                } else {
                    console.warn(`Error de autenticación: ${result.message}`);
                    alert(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Error en la solicitud de login:', error);
                alert('Ocurrió un error. Inténtalo de nuevo más tarde.');
            }
        });
    } else {
        console.error('No se encontró el botón de inicio de sesión en el DOM.');
    }
});
