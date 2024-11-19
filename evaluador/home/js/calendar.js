document.addEventListener('DOMContentLoaded', () => {
    inicializarCalendario(); // Llamada a la función para cargar el calendario
});

// Función para inicializar el calendario
function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar'); // Contenedor del calendario

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Vista inicial del calendario
        locale: 'es', // Idioma en español
        headerToolbar: {
            left: 'prev,next today', // Botones de navegación
            center: 'title', // Título del calendario (mes/año)
            right: 'dayGridMonth,timeGridWeek,timeGridDay' // Cambiar entre vistas
        },
        events: [
            { title: 'Reto de Innovación', start: '2024-10-20' },
            { title: 'Reunión General', start: '2024-10-22' },
            { title: 'Hackathon', start: '2024-11-01', end: '2024-11-03' }
        ],
        selectable: true, // Permitir selección de fechas
        select: function (info) {
            alert(`Fecha seleccionada: ${info.startStr}`);
        },
        eventClick: function (info) {
            alert(`Evento: ${info.event.title}`);
        },
    });

    calendar.render(); // Renderizar el calendario
}
