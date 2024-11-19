document.addEventListener('DOMContentLoaded', () => {
    cargarRetos(null); // Por defecto cargar todos los retos

    configurarFiltros();
    // Ejemplo de cómo llamar a cargarRetos
    document.getElementById('btn-con-solucion').addEventListener('click', () => cargarRetos(true));
    document.getElementById('btn-sin-solucion').addEventListener('click', () => cargarRetos(false));
    document.getElementById('btn-todos').addEventListener('click', () => cargarRetos(null));
    const btnTodos = document.getElementById('btn-todos');
    const btnConSolucion = document.getElementById('btn-con-solucion');
    const btnSinSolucion = document.getElementById('btn-sin-solucion');

    // Marcar el botón "Con Solución" como activo por defecto

    btnTodos.addEventListener('click', () => {
        cargarRetos(null);
        actualizarEstadoBotones(btnTodos, [btnConSolucion, btnSinSolucion]);
    });

    btnConSolucion.addEventListener('click', () => {
        cargarRetos(true);
        actualizarEstadoBotones(btnConSolucion, [btnTodos, btnSinSolucion]);
    });

    btnSinSolucion.addEventListener('click', () => {
        cargarRetos(false);
        actualizarEstadoBotones(btnSinSolucion, [btnTodos, btnConSolucion]);
    });

    //PARA BARRA DE BÚSQUEDA GENERAL
    const searchParam = new URLSearchParams(window.location.search).get('search');

    if (searchParam) {
        const inputSearch = document.getElementById('search-input');
        inputSearch.value = decodeURIComponent(searchParam.trim());
        filtrarRetos(searchParam); // Llama a filtrarRetos con el término de búsqueda
    }
});

let retosGlobal = []; // Almacena los retos obtenidos del servidor
let paginaActual = 1; // Página inicial
const elementosPorPagina = 10; // Retos por página

function actualizarEstadoBotones(activar, desactivarArray) {
    desactivarArray.forEach((boton) => boton.classList.remove('active'));
    activar.classList.add('active');
}
// Función para cargar retos desde el servidor
async function cargarRetos(tieneSolucion = null) {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const idUsuario = usuario?.id;

    if (!idUsuario) {
        alert('No se encontró el usuario. Inicie sesión nuevamente.');
        return;
    }

    try {
        let url = `/api/retos-usuario/${idUsuario}`;
        if (tieneSolucion !== null) {
            url += `?tieneSolucion=${tieneSolucion}`;
        }

        console.log(`Iniciando la carga de retos para el usuario con ID: ${idUsuario}, URL: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Error al obtener los retos.');
        }

        const { retos } = await response.json();
        console.log('Retos obtenidos:', retos);

        if (retos.length === 0) {
            mostrarMensajeSinRetos(tieneSolucion); // Mostrar mensaje si no hay retos
        } else {
            ocultarMensajeSinRetos(); // Ocultar mensaje si hay retos
            retosGlobal = retos; // Guardar los retos globalmente
            actualizarEncabezado(tieneSolucion); // Actualizar encabezado según el tipo de reto
            mostrarRetos(retosGlobal, tieneSolucion);
        }
    } catch (error) {
        console.error('Error al cargar los retos:', error);
        alert('Hubo un problema al cargar los retos. Intente nuevamente.');
    }
}

// Función para actualizar el encabezado de la tabla
function actualizarEncabezado(tieneSolucion) {
    const header = document.getElementById('retos-header');
    header.innerHTML = ''; // Limpiar encabezado anterior

    if (tieneSolucion === null) {
        // Encabezado para todos los retos
        header.innerHTML = `
            <tr>
                <th>Título del Reto</th>
                <th>Gerencia</th>
                <th>Solución</th>
                <th>Email Promotor / Cliente Interno</th>
                <th>Nombre Promotor / Cliente Interno</th>
                <th>Importancia</th>
                <th>Status</th>
                <th>Acciones</th>
            </tr>
        `;
    } else if (tieneSolucion) {
        // Encabezado para retos con solución
        header.innerHTML = `
            <tr>
                <th>Título del Reto</th>
                <th>Gerencia</th>
                <th>Email Cliente Interno</th>
                <th>Nombre del Cliente Interno</th>
                <th>Importancia</th>
                <th>Status</th>
                <th>Acciones</th>
            </tr>
        `;
    } else {
        // Encabezado para retos sin solución
        header.innerHTML = `
            <tr>
                <th>Título del Reto</th>
                <th>Gerencia</th>
                <th>Email Promotor Asignado</th>
                <th>Nombre del Promotor</th>
                <th>Importancia</th>
                <th>Status</th>
                <th>Acciones</th>
            </tr>
        `;
    }
}
function ocultarMensajeSinRetos() {
    const container = document.querySelector('.retos-container');
    const mensaje = container.querySelector('.mensaje-sin-retos');
    const tablaRetos = document.querySelector('.retos-table');
    const paginacion = document.querySelector('.pagination');

    // Eliminar el mensaje si existe
    if (mensaje) {
        container.removeChild(mensaje);
    }

    // Mostrar tabla y paginación nuevamente
    if (tablaRetos) tablaRetos.style.display = '';
    if (paginacion) paginacion.style.display = '';
}


function mostrarMensajeSinRetos(tieneSolucion) {
    const container = document.querySelector('.retos-container');
    const tablaRetos = document.querySelector('.retos-table');
    const paginacion = document.querySelector('.pagination');

    // Ocultar tabla y paginación si no hay retos
    if (tablaRetos) tablaRetos.style.display = 'none';
    if (paginacion) paginacion.style.display = 'none';

    // Mostrar el mensaje de que no hay retos
    const mensaje = document.querySelector('.mensaje-sin-retos');
    if (!mensaje) {
        const nuevoMensaje = document.createElement('div');
        nuevoMensaje.className = 'mensaje-sin-retos';
        nuevoMensaje.textContent = tieneSolucion
            ? 'Aún no tienes retos con solución.'
            : 'Aún no tienes retos sin solución.';
        container.appendChild(nuevoMensaje);
    }
}

// Función para mostrar los retos en la tabla
function mostrarRetos(retos, tieneSolucion) {
    const retosBody = document.getElementById('retos-body');
    retosBody.innerHTML = ''; // Limpiar contenido anterior

    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const retosPagina = retos.slice(inicio, fin); // Retos de la página actual

    retosPagina.forEach((reto) => {
        const estado = reto.estado ? reto.estado.toLowerCase() : 'sin-estado';

        const row = document.createElement('tr');

        // Determinar el enlace de Gmail dinámico
        const correo = reto.promotor_correo || reto.cliente_interno_correo;
        const nombre = reto.promotor_nombre || reto.cliente_interno_nombre;
        const gmailLink = correo
            ? `<a href="https://mail.google.com/mail/?view=cm&fs=1&to=${correo}&su=[IMAGIX]%20/*COLOCA%20AQUÍ%20TU%20ASUNTO%20INCLUYENDO%20EL%20TAG*/&body=Cordial%20Saludo,%0D%0A%0D%0A${encodeURIComponent(
                  `Estimado(a) ${nombre || 'Usuario'},`
              )}%0D%0A%0D%0A/*Escribe aquí lo que vayas a querer decirle a la persona.*/%0D%0A%0D%0A/*No olvides agradecer antes de despedirte.%0A😊*/" 
               target="_blank" class="gmail-link">${correo}</a>`
            : 'Correo no disponible';

        if (tieneSolucion === null) {
            // Mostrar todos los retos con columna "Solución"
            row.innerHTML = `
                <td>${reto.titulo || 'Sin título'}</td>
                <td>${reto.area || 'Gerencia no definida'}</td>
                <td>${reto.tiene_solucion ? 'Con solución' : 'Sin solución'}</td>
                <td>${gmailLink}</td>
                <td>${nombre || 'No asignado'}</td>
                <td>${reto.importancia || 'No definida'}</td>
                <td><span class="status ${estado}">${reto.estado || 'Sin estado'}</span></td>
                <td>
                    <button class="edit-btn"><img src="../img/edit.png" alt="Editar" /></button>
                    <button class="delete-btn"><img src="../img/delete.png" alt="Eliminar" /></button>
                </td>
            `;
        } else if (tieneSolucion) {
            // Mostrar retos con solución
            row.innerHTML = `
                <td>${reto.titulo || 'Sin título'}</td>
                <td>${reto.area || 'Gerencia no definida'}</td>
                <td>${gmailLink}</td>
                <td>${nombre || 'Cliente interno no asignado'}</td>
                <td>${reto.importancia || 'No definida'}</td>
                <td><span class="status ${estado}">${reto.estado || 'Sin estado'}</span></td>
                <td>
                    <button class="edit-btn"><img src="../img/edit.png" alt="Editar" /></button>
                    <button class="delete-btn"><img src="../img/delete.png" alt="Eliminar" /></button>
                </td>
            `;
        } else {
            // Mostrar retos sin solución
            row.innerHTML = `
                <td>${reto.titulo || 'Sin título'}</td>
                <td>${reto.area || 'Gerencia no definida'}</td>
                <td>${gmailLink}</td>
                <td>${nombre || 'Promotor no asignado'}</td>
                <td>${reto.importancia || 'No definida'}</td>
                <td><span class="status ${estado}">${reto.estado || 'Sin estado'}</span></td>
                <td>
                    <button class="edit-btn"><img src="../img/edit.png" alt="Editar" /></button>
                    <button class="delete-btn"><img src="../img/delete.png" alt="Eliminar" /></button>
                </td>
            `;
        }

        retosBody.appendChild(row);
    });

    actualizarPaginacion(retos.length); // Actualiza la barra de paginación
}


function ordenarRetos() {
    const criterio = document.getElementById('sort-dropdown').value;

    // Ordenar retosGlobal basado en el criterio seleccionado
    retosGlobal.sort((a, b) => {
        const valorA = (a[criterio] || '').toString().toLowerCase();
        const valorB = (b[criterio] || '').toString().toLowerCase();

        if (valorA < valorB) return -1;
        if (valorA > valorB) return 1;
        return 0;
    });

    // Reiniciar la página actual a la primera y mostrar retos ordenados
    paginaActual = 1;
    mostrarRetos(retosGlobal, null);
}


function configurarFiltros() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            filterButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');

            const filterType = btn.id;

            switch (filterType) {
                case 'filter-solution':
                    cargarRetos(true); // Cargar retos con solución
                    break;
                case 'filter-no-solution':
                    cargarRetos(false); // Cargar retos sin solución
                    break;
                default:
                    cargarRetos(); // Cargar todos los retos
                    break;
            }
        });
    });
}

// Función para filtrar retos por búsqueda en campos específicos

function filtrarRetos(term = null) {
    const input = term || document.getElementById('search-input').value.toLowerCase();

    const retosFiltrados = retosGlobal.filter((reto) =>
        (reto.titulo && reto.titulo.toLowerCase().includes(input)) ||
        (reto.area && reto.area.toLowerCase().includes(input)) ||
        (reto.promotor_correo && reto.promotor_correo.toLowerCase().includes(input)) ||
        (reto.promotor_nombre && reto.promotor_nombre.toLowerCase().includes(input)) ||
        (reto.importancia && reto.importancia.toLowerCase().includes(input)) ||
        (reto.estado && reto.estado.toLowerCase().includes(input))
    );

    paginaActual = 1; // Reiniciar a la primera página al filtrar

    // Limpiar filtros y marcar "Todos" como activo
    const btnTodos = document.getElementById('btn-todos');
    const btnConSolucion = document.getElementById('btn-con-solucion');
    const btnSinSolucion = document.getElementById('btn-sin-solucion');
    actualizarEstadoBotones(btnTodos, [btnConSolucion, btnSinSolucion]);

    // Asegurar que el encabezado sea el de "Todos los retos"
    actualizarEncabezado(null);

    // Mostrar los retos filtrados con el formato de "Todos"
    mostrarRetos(retosFiltrados, null);
}


// Función para ordenar los retos por el criterio seleccionado
function ordenarRetosYMostrar() {
    const criterio = document.getElementById('sort-dropdown').value;
    const retosOrdenados = ordenarRetosPorCriterio(criterio, retosGlobal);

    paginaActual = 1; // Reiniciar a la primera página al ordenar
    mostrarRetos(retosOrdenados);
}

// Función para ordenar los retos según un criterio
function ordenarRetosPorCriterio(criterio, retos) {
    return [...retos].sort((a, b) => {
        const valorA = (a[criterio] || '').toString().toLowerCase();
        const valorB = (b[criterio] || '').toString().toLowerCase();
        return valorA.localeCompare(valorB);
    });
}

function crearNuevoReto() {
    window.location.href = './crearRetoConSolucion.html';
  }
  

// Función para actualizar la barra de paginación
function actualizarPaginacion(totalElementos) {
    const paginacion = document.querySelector('.pagination');
    paginacion.innerHTML = ''; // Limpiar paginación anterior

    const totalPaginas = Math.ceil(totalElementos / elementosPorPagina);

    // Botón de página anterior
    const prevButton = document.createElement('button');
    prevButton.textContent = '<';
    prevButton.disabled = paginaActual === 1;
    prevButton.addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarRetos(retosGlobal);
        }
    });
    paginacion.appendChild(prevButton);

    // Botones de páginas numeradas
    for (let i = 1; i <= totalPaginas; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === paginaActual);
        pageButton.addEventListener('click', () => {
            paginaActual = i;
            mostrarRetos(retosGlobal);
        });
        paginacion.appendChild(pageButton);
    }

    // Botón de página siguiente
    const nextButton = document.createElement('button');
    nextButton.textContent = '>';
    nextButton.disabled = paginaActual === totalPaginas;
    nextButton.addEventListener('click', () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarRetos(retosGlobal);
        }
    });
    paginacion.appendChild(nextButton);
}
