let map; // Variable global para el mapa
let marker; // Variable global para el marcador actual
let sedes = []; // Variable para almacenar las sedes cargadas

document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Asegurar que el DOM esté listo
    const user = JSON.parse(localStorage.getItem('usuario'));

    if (!user) {
        // Redirigir al login si no hay usuario
        window.location.href = '../../login/html/loginSinGuardar.html';
        return;
    }

    // Mostrar los datos del usuario en el dashboard
    document.getElementById('nombre-usuario').textContent = `Hola 👋🏼, ${user.nombre}`;
    document.querySelector('.profile-pic').src = '../img/ProfilePicture.png';

    try {
        const response = await fetch('/api/sedes'); // Obtener sedes desde el backend
        if (!response.ok) throw new Error('Error al obtener las sedes');

        sedes = await response.json();
        console.log('Sedes cargadas:', sedes);

        llenarDropdownSedes(sedes, user.sede); // Llenar el dropdown con las sedes
        inicializarMapa(user.sede, sedes); // Inicializar el mapa en la sede del usuario

        const sedeSeleccionada = obtenerSedeIdPorNombre(user.sede);
        await cargarRetosPorSede(sedeSeleccionada); // Cargar los retos de la sede del usuario

        // Evento de cambio en el dropdown de sedes
        document.getElementById('sede-select').addEventListener('change', async (event) => {
            const nuevaSedeId = parseInt(event.target.value, 10);
            console.log('Nueva sede seleccionada ID:', nuevaSedeId);

            if (isNaN(nuevaSedeId)) {
                console.warn('ID seleccionado no es válido:', event.target.value);
                return;
            }

            const nuevaSede = sedes.find(s => s.id === nuevaSedeId);
            if (nuevaSede) {
                console.log(`Sede seleccionada: ${nuevaSede.nombre} (${nuevaSede.latitud}, ${nuevaSede.longitud})`);

                // Actualizar localStorage con la nueva sede seleccionada
                user.sedeActual = nuevaSede.nombre;
                localStorage.setItem('usuario', JSON.stringify(user));

                actualizarMapa(nuevaSede); // Actualizar el mapa a la nueva sede
                manejarBotonVolver(user.sede, nuevaSede.nombre); // Mostrar u ocultar el botón "Volver a mi sede"
                await cargarRetosPorSede(nuevaSede.id); // Cargar los retos de la nueva sede seleccionada
            }
        });

        document.getElementById('volver-sede').addEventListener('click', async () => {
            user.sedeActual = user.sede; // Volver a la sede original
            localStorage.setItem('usuario', JSON.stringify(user));
            window.location.reload(); // Recargar la página
        });

    } catch (error) {
        console.error('Error al cargar las sedes:', error);
    }
});

// Llenar el dropdown con las sedes disponibles
function llenarDropdownSedes(sedes, sedeUsuario) {
    const dropdown = document.getElementById('sede-select');
    dropdown.innerHTML = ''; // Limpiar opciones

    sedes.forEach((sede) => {
        const option = document.createElement('option');
        option.value = sede.id; // Usar el ID de la sede como valor
        option.textContent = sede.nombre;

        if (sede.nombre.toLowerCase() === sedeUsuario.toLowerCase()) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });

    console.log('Dropdown de sedes inicializado');
}

// Función para cargar los retos de la sede seleccionada
async function cargarRetosPorSede(idSede) {
    try {
        console.log(`Cargando retos para la sede con ID: ${idSede}`);
        const response = await fetch(`/api/retos-sede/${idSede}?limit=10`);

        if (response.status === 404) {
            console.warn('No existen actualmente retos activos para esta sede.');
            mostrarMensajeNoRetos(); // Mostrar mensaje si no hay retos activos
            return; // Terminar la ejecución aquí
        }

        if (!response.ok) {
            const errorText = await response.text(); // Capturar cualquier otro error
            throw new Error(`Error al obtener los retos: ${errorText}`);
        }

        const { retos } = await response.json();
        console.log('Retos obtenidos:', retos);

        mostrarRetos(retos); // Mostrar los retos si los hay
    } catch (error) {
        console.error('Error al cargar los retos:', error.message);
        alert('Hubo un problema al cargar los retos. Revisa la consola para más detalles.');
    }
}

// Mostrar los retos en el carrusel
function mostrarRetos(retos) {
    const retosContainer = document.getElementById('retos-container');
    retosContainer.innerHTML = ''; // Limpiar contenido anterior

    if (retos.length === 0) {
        mostrarMensajeNoRetos(); // Mostrar mensaje si no hay retos activos
        return;
    }

    retos.forEach((reto) => {
        const titulo = reto.titulo || 'Sin título';
        const area = reto.area || 'Sin área';
        const nombreCreador = reto.nombrecreador || 'Sin nombre';

        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');

        slide.innerHTML = `
            <div class="tarjeta">
                <h3>${titulo}</h3>
                <p>Área: ${area}</p>
                <p><strong>Creador:</strong> ${nombreCreador}</p>
            </div>`;

        retosContainer.appendChild(slide);
    });

    inicializarCarrusel('.retos-swiper'); // Inicializar carrusel si hay retos
}

function mostrarMensajeNoRetos() {
    const retosContainer = document.getElementById('retos-container');
    retosContainer.innerHTML = `
        <div class="swiper-slide">
            <div class="tarjeta">
                <h3>No hay retos disponibles para esta sede.</h3>
                <p>Intenta seleccionar otra sede o vuelve más tarde.</p>
            </div>
        </div>`;
    console.log('Mensaje de no retos mostrado.');
}

// Inicializar el carrusel de Swiper
function inicializarCarrusel(selector) {
    new Swiper(selector, {
        loop: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: `${selector} .swiper-button-next`,
            prevEl: `${selector} .swiper-button-prev`,
        },
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: true,
        effect: 'slide',
        speed: 800,
    });
}

// Obtener el ID de la sede según su nombre
function obtenerSedeIdPorNombre(nombreSede) {
    const sede = sedes.find(s => s.nombre.toLowerCase() === nombreSede.toLowerCase());
    return sede ? sede.id : null;
}

// Inicializar el mapa con la sede del usuario
function inicializarMapa(sedeUsuario, sedes) {
    if (!map) {
        map = L.map('map'); // Inicializar el mapa
    }

    let coordenadasIniciales = [4.5709, -74.2973]; // Coordenadas por defecto
    let zoomInicial = 5;

    const sedeEncontrada = sedes.find(sede => sede.nombre.toLowerCase() === sedeUsuario.toLowerCase());
    if (sedeEncontrada) {
        coordenadasIniciales = [parseFloat(sedeEncontrada.latitud), parseFloat(sedeEncontrada.longitud)];
        zoomInicial = 12;
    }

    map.setView(coordenadasIniciales, zoomInicial);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    sedes.forEach(sede => {
        L.marker([parseFloat(sede.latitud), parseFloat(sede.longitud)])
            .addTo(map)
            .bindPopup(`<b>${sede.nombre}</b>`);
    });

    marker = L.marker(coordenadasIniciales).addTo(map).bindPopup(`<b>${sedeUsuario}</b>`);
    console.log('Mapa inicializado en la sede:', sedeUsuario);
}

// Actualizar el mapa al cambiar de sede
function actualizarMapa(nuevaSede) {
    if (marker) {
        map.removeLayer(marker); // Eliminar el marcador anterior
    }

    const lat = parseFloat(nuevaSede.latitud);
    const lng = parseFloat(nuevaSede.longitud);

    marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${nuevaSede.nombre}</b>`)
        .openPopup();

    map.setView([lat, lng], 12); // Centrar el mapa
    console.log('Mapa actualizado a la sede:', nuevaSede.nombre);
}

// Mostrar u ocultar el botón "Volver a mi sede"
function manejarBotonVolver(sedeOriginal, sedeActual) {
    const botonVolver = document.getElementById('volver-sede');
    if (!botonVolver) {
        console.warn('El botón "Volver a mi sede" no se encontró en el DOM');
        return;
    }

    if (sedeOriginal !== sedeActual) {
        botonVolver.classList.remove('oculto');
    } else {
        botonVolver.classList.add('oculto');
    }
}
