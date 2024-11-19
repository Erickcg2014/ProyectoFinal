// Archivo JavaScript para manejar la lógica de dashboard_retos.html
document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
    inicializarGrafica();
    cargarTablaRetos();
    configurarBuscador();
});

// Función para cargar las estadísticas principales
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/retos/estadisticas'); // Endpoint para estadísticas
        if (!response.ok) throw new Error('Error al obtener estadísticas.');

        const { totalRetos, usuariosParticipando, retosActivos, cambioTotalRetos, cambioUsuarios } = await response.json();

        document.getElementById('total-retos').textContent = totalRetos;
        document.getElementById('cambio-total-retos').textContent = `${cambioTotalRetos}% este mes`;
        document.getElementById('usuarios-participando').textContent = usuariosParticipando;
        document.getElementById('cambio-usuarios').textContent = `${cambioUsuarios}% este mes`;
        document.getElementById('retos-activos').textContent = retosActivos;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Función para inicializar la gráfica de progreso del mes
function inicializarGrafica() {
    const ctx = document.getElementById('grafica-progreso').getContext('2d');

    fetch('/api/retos/progreso-mes') // Endpoint para datos de la gráfica
        .then(response => {
            if (!response.ok) throw new Error('Error al obtener datos de la gráfica.');
            return response.json();
        })
        .then(data => {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels, // Fechas del mes
                    datasets: [
                        {
                            label: 'Retos pendientes',
                            data: data.pendientes,
                            borderColor: '#aaa',
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderWidth: 2,
                        },
                        {
                            label: 'Retos resueltos',
                            data: data.resueltos,
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                            borderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: context => `${context.raw} retos`,
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
            });
        })
        .catch(error => console.error('Error al inicializar gráfica:', error));
}

// Función para cargar datos en la tabla de retos
async function cargarTablaRetos() {
    try {
        const response = await fetch('/api/retos'); // Endpoint para retos
        if (!response.ok) throw new Error('Error al obtener retos.');

        const retos = await response.json();
        const tbody = document.getElementById('retos-body');
        tbody.innerHTML = '';

        retos.forEach(reto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reto.nombre || 'Sin nombre'}</td>
                <td>${reto.area || 'Sin área'}</td>
                <td>${reto.importancia || 'No definida'}</td>
                <td>${reto.fecha || 'No definida'}</td>
                <td>${reto.sede || 'No asignada'}</td>
                <td><div class="status ${reto.estado.toLowerCase()}">${reto.estado}</div></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar la tabla de retos:', error);
    }
}

// Configuración del buscador
function configurarBuscador() {
    const input = document.querySelector('.search-bar');
    input.addEventListener('input', () => {
        const filtro = input.value.toLowerCase();
        const filas = document.querySelectorAll('#retos-body tr');

        filas.forEach(fila => {
            const textoFila = fila.textContent.toLowerCase();
            fila.style.display = textoFila.includes(filtro) ? '' : 'none';
        });
    });
}
