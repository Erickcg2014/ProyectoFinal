const form = document.getElementById('login-form');

form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evitar que recargue la página

    const usuario = form.usuario.value;
    const password = form.password.value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = '/dashboard'; 
    } else {
        alert('Credenciales incorrectas');
    }
});
