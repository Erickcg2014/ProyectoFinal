// Inicializar el carrusel Swiper para las gráficas
const swiper = new Swiper('.swiper-container', {
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    loop: true, // Carrusel en bucle
});

// Mapeo de nombres de ciudades a sus respectivos ID de sede
const ciudadesToId = {
    'Bogotá': 1,
    'Villavicencio': 2,
    'Medellín': 3,
    'Barranquilla': 4,
    'Cartagena': 5,
    'Cali': 6,
    'Pasto': 7,
    'Bucaramanga': 8,
    'Cúcuta': 9,
    'Pereira': 10,
    'Manizales': 11,
    'Armenia': 12,
    'Neiva': 13,
    'Ibagué': 14
};

// Función para convertir nombre de ciudad a ID de sede
function obtenerIdSede(nombreSede) {
    const idSede = ciudadesToId[nombreSede];
    if (!idSede) {
        console.error(`No se encontró el ID para la sede: ${nombreSede}`);
        return null;
    }
    return idSede;
}

// Función para cargar las estadísticas desde los endpoints del servidor
async function cargarEstadisticas(nombreSede, anio) {
    const idSede = obtenerIdSede(nombreSede); // Convertir nombre de sede a ID
    if (!idSede) return; // Detener si no se encuentra el ID

    try {
        const [retosActivosRes, retosMesRes, ideasRes] = await Promise.all([
            fetch(`/api/retos/activos?sede=${idSede}`),
            fetch(`/api/retos/mes?sede=${idSede}&anio=${anio}`),
            fetch(`/api/ideas?sede=${idSede}`)
        ]);

        if (!retosActivosRes.ok || !retosMesRes.ok || !ideasRes.ok) {
            throw new Error('Error al obtener las estadísticas');
        }

        const retosActivos = await retosActivosRes.json();
        const retosMes = await retosMesRes.json();
        const ideas = await ideasRes.json();

        console.log('Retos Activos:', retosActivos);
        console.log('Retos por Mes:', retosMes);
        console.log('Ideas Innovadoras:', ideas);

        // Validar si los datos son insuficientes
        if (retosMes.length === 0 || ideas.length === 0) {
            console.warn('Datos insuficientes para mostrar algunas gráficas.');
        }

        actualizarGraficas(retosActivos, retosMes, ideas);
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Función para actualizar las gráficas con los datos obtenidos
function actualizarGraficas(retosActivos, retosMes, ideas) {
    // Verificar si hay datos para cada gráfica
    const datosRetosActivos = retosActivos.activos ? retosActivos : { activos: 0, total: 0 };
    const datosRetosMes = retosMes.length > 0 ? retosMes : [{ mes: 'Sin Datos', cantidad_retos: 0 }];
    const datosIdeas = ideas.cantidad ? ideas : { cantidad: 0 };

    // Gráfica de Donut para Retos Activos
    new Chart(document.getElementById('graficaRetosActivos'), {
        type: 'doughnut',
        data: {
            labels: ['Activos', 'Inactivos'],
            datasets: [{
                data: [datosRetosActivos.activos, datosRetosActivos.total - datosRetosActivos.activos],
                backgroundColor: ['#4A148C', '#FFC107'],
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
            },
        },
    });

    // Gráfica Lineal para Retos por Mes
    new Chart(document.getElementById('graficaRetosPorMes'), {
        type: 'line',
        data: {
            labels: datosRetosMes.map(r => `Mes ${r.mes}`),
            datasets: [{
                label: 'Retos por Mes',
                data: datosRetosMes.map(r => r.cantidad_retos),
                borderColor: '#4A148C',
                tension: 0.4,
                fill: false,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
            },
        },
    });

    // Gráfica de Barras para Ideas Innovadoras
    new Chart(document.getElementById('graficaIdeasInnovadoras'), {
        type: 'bar',
        data: {
            labels: ['Ideas Innovadoras'],
            datasets: [{
                label: 'Cantidad',
                data: [datosIdeas.cantidad],
                backgroundColor: '#4A148C',
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
            },
        },
    });
}

// Evento DOMContentLoaded para cargar las estadísticas al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    const anioActual = new Date().getFullYear();

    if (user && user.sede) {
        cargarEstadisticas(user.sede, anioActual); // Llamada con nombre de sede
    }
});
