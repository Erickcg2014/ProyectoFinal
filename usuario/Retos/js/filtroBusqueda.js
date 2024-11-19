document.getElementById('search-button').addEventListener('click', () => {
    // Ejemplo de redirección corregida
    const searchTerm = document.querySelector('.search-bar').value.trim();
    if (searchTerm) {
        // Redirige a la URL correcta
        const encodedTerm = encodeURIComponent(searchTerm);
        window.location.href = `/usuario/Retos/verMisRetos-Dashboard.html?search=${encodedTerm}`;
    }

});

// Opcional: Manejo del evento "Enter" en el campo de texto
document.getElementById('search-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('search-button').click();
    }
});
