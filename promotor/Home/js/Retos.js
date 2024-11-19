document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

// Inicializar Swiper
function inicializarCarrusel(selector) {
    return new Swiper(selector, {
        loop: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: `${selector} .swiper-button-next`,
            prevEl: `${selector} .swiper-button-prev`,
            hideOnClick: false,
            hiddenClass: 'swiper-button-hidden',
            disabledClass: 'swiper-button-disabled',
        },
        slidesPerView: 1,
        spaceBetween: 30,
        centeredSlides: true,
        effect: 'fade',
        fadeEffect: {
            crossFade: true,
        },
        speed: 600,
        watchSlidesProgress: true,
        on: {
            init: function () {
                setTimeout(() => {
                    this.update();
                }, 100);
            },
        },
    });
}

// Cargar los datos de Retos e Ideas desde el servidor
async function cargarDatos() {
    try {
        const [retosRes, ideasRes] = await Promise.all([
            fetch('/api/retos?limite=10'),
            fetch('/api/ideas?limite=10'),
        ]);

        if (!retosRes.ok || !ideasRes.ok) throw new Error('Error al cargar los datos');

        const retos = await retosRes.json();
        const ideas = await ideasRes.json();

        console.log('Retos obtenidos:', retos);
        console.log('Ideas obtenidas:', ideas);

        agregarTarjetas('#retos-container', retos, 'retos');
        agregarTarjetas('#ideas-container', ideas, 'ideas');

        // Inicializar ambos carruseles después de cargar los datos
        inicializarCarrusel('.retos-swiper');
        inicializarCarrusel('.ideas-swiper');
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

// Función para agregar tarjetas a los contenedores
function agregarTarjetas(contenedor, datos, tipo) {
    const containerElement = document.querySelector(contenedor);
    containerElement.innerHTML = ''; // Limpia el contenedor

    if (datos.length === 0) {
        containerElement.innerHTML = `
            <div class="swiper-slide">
                <div class="tarjeta">
                    <h3>No hay datos disponibles</h3>
                    <p>Actualmente no hay información para mostrar.</p>
                </div>
            </div>`;
    } else {
        datos.forEach(item => {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');

            slide.innerHTML = `
                <div class="tarjeta">
                    <img src="https://media.istockphoto.com/id/1364917563/es/foto/hombre-de-negocios-sonriendo-con-los-brazos-cruzados-sobre-fondo-blanco.jpg?s=612x612&w=0&k=20&c=NqMHLF8T4RzPaBE_WMnflSGB_1-kZZTQgAkekUxumZg=" 
                         alt="${item.titulo}" />
                    <h3>${item.titulo}</h3>
                    <p class="descripcion">${item.descripcion}</p>
                    <p class="cargo">Creador: ${item.nombrecreador || 'Sin nombre'} - ${item.area || 'Sin área'}</p>
                    ${tipo === 'ideas' ? `<div class="estrellas">★★★★★</div>` : ''}
                </div>`;
            
            containerElement.appendChild(slide);
        });

        // Duplicar los elementos si hay menos de 3 para que funcione el loop
        if (datos.length < 3) {
            const itemsToClone = 3 - datos.length;
            for (let i = 0; i < itemsToClone; i++) {
                const clone = containerElement.children[i].cloneNode(true);
                containerElement.appendChild(clone);
            }
        }
    }
}
