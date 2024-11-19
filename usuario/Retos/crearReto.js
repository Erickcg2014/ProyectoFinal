document.addEventListener('DOMContentLoaded', () => {
    configurarFormulario();
    document.getElementById('descripcion').addEventListener('blur', () => {
        const descripcion = document.getElementById('descripcion').value.trim();
        verificarSimilitud(descripcion);
    });
    cargarListaCargos();
    /*document.getElementById('descripcion').addEventListener('blur', () => {
        const descripcion = document.getElementById('descripcion').value.trim();
        const solucion = document.getElementById('solucion').value.trim();
        analizarPalabrasClave(descripcion, solucion); // Llama a la nueva función para analizar palabras clave
    });*/
    document.getElementById('solucion').addEventListener('blur', verificarCamposYAnalizar);
});

let promotorAsignado = null; // Guardar el promotor asignado
let pdfUrl = ''; // Almacenar la URL del PDF cargado
let isSubmitting = false; // Controlar envío para evitar duplicados
let similarityPercentage = 0; // Variable global para almacenar el porcentaje de similitud

const sedeMap = {
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
    'Ibagué': 14,
};

// Asignar promotor según la gerencia seleccionada
async function asignarPromotor() {
    const idRol = parseInt(document.getElementById('gerencia-select').value);

    if (isNaN(idRol)) {
        console.error('ID de rol no válido:', idRol);
        alert('Seleccione una gerencia válida.');
        return;
    }

    try {
        console.log(`Buscando promotor para el idRol: ${idRol}`);
        const response = await fetch(`/api/promotor-disponible/${idRol}`);

        if (!response.ok) {
            throw new Error('No se pudo obtener el promotor');
        }

        promotorAsignado = await response.json();
        console.log('Promotor asignado:', promotorAsignado);

        const promotorNombre = document.getElementById('nombre-promotor');
        if (promotorNombre) {
            promotorNombre.innerHTML = `
                <strong>Tu promotor sería:</strong> ${promotorAsignado.nombre_apellido}
                <br><strong>Encargado de:</strong> ${promotorAsignado.cargo}
            `;
        } else {
            console.error('Elemento con ID "nombre-promotor" no encontrado en el DOM.');
        }
    } catch (error) {
        console.error('Error al asignar el promotor:', error);
        alert('No se pudo asignar un promotor. Intente nuevamente.');
    }
}

// Incrementar la carga del promotor seleccionado
async function incrementarCargaPromotor(promotorId) {
    try {
        const response = await fetch(`/api/incrementar-carga/${promotorId}`, {
            method: 'PUT',
        });

        if (!response.ok) {
            throw new Error('No se pudo incrementar la carga del promotor');
        }

        console.log(`Carga incrementada para el promotor ${promotorId}`);
    } catch (error) {
        console.error('Error al incrementar la carga del promotor:', error);
    }
}

// Configurar el formulario y los eventos
function configurarFormulario() {
    document.getElementById('tipo-solucion').addEventListener('change', mostrarSeccionSolucion);
    document.getElementById('archivo-pdf').addEventListener('change', mostrarArchivoCargado);

    const form = document.getElementById('crear-reto-form');
    form.addEventListener('submit', enviarFormulario); // Llama a enviarFormulario al hacer submit
}

function validarTitulo() {
    const tituloInput = document.getElementById('titulo-reto');
    const errorText = document.getElementById('titulo-error');
    const palabras = tituloInput.value.trim().split(' ');

    if (palabras.length > 3) {
        errorText.textContent = 'El título no debe exceder las 3 palabras.';
        errorText.style.display = 'block';
    } else {
        errorText.style.display = 'none';
    }
}

// Mostrar información del archivo PDF cargado
function mostrarArchivoCargado() {
    const archivoInput = document.getElementById('archivo-pdf');
    const archivoInfo = document.getElementById('archivo-info');
    const archivoNombre = document.getElementById('archivo-nombre');
    const btnCargar = document.getElementById('btn-cargar');

    if (archivoInput.files.length > 0) {
        const archivo = archivoInput.files[0];
        archivoNombre.textContent = `Archivo cargado: ${archivo.name}`;
        archivoInfo.style.display = 'flex';
        btnCargar.textContent = 'Cambia tu presentación';
        pdfUrl = URL.createObjectURL(archivo);
    } else {
        archivoInfo.style.display = 'none';
        btnCargar.textContent = 'Cargar aquí tu presentación';
        pdfUrl = '';
    }
}

// Abrir el PDF cargado en una nueva pestaña
function abrirPDF() {
    if (pdfUrl) {
        window.open(pdfUrl, '_blank');
    } else {
        alert('No hay PDF cargado.');
    }
}

// Verificar similitud y actualizar la barra de progreso sin redirigir
async function verificarSimilitud(descripcion) {
    if (typeof descripcion !== "string") {
        console.error("Descripción no es una cadena de texto válida:", descripcion);
        return { percentage: 0, idSimilarReto: null };
    }

    try {
        const response = await fetch('http://localhost:3000/api/verificar-similitud', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descripcion }) // Enviar `descripcion` como texto
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta de similitud');
        }

        const data = await response.json();
        const similarityPercentage = data.most_similar_reto && data.most_similar_reto.similarity !== undefined 
            ? parseFloat(data.most_similar_reto.similarity).toFixed(2) 
            : 0;

        actualizarBarraProgreso(similarityPercentage);

        return {
            percentage: similarityPercentage,
            idSimilarReto: data.most_similar_reto ? data.most_similar_reto.id : null
        };
    } catch (error) {
        console.error(`[Frontend Log] Error al verificar similitud: ${error}`);
        return { percentage: 0, idSimilarReto: null };
    }
}

function actualizarBarraProgreso(similarity) {
    const progressBar = document.getElementById('barra-progreso');
    const progressText = document.getElementById('porcentaje-coincidencia');
    const mensajeCoincidencia = document.getElementById('mensaje-coincidencia');

    if (progressBar && progressText && mensajeCoincidencia) {
        progressBar.style.width = `${similarity}%`;
        progressText.textContent = `${similarity}%`;

        if (similarity <= 50) {
            progressBar.className = 'filled green';
            mensajeCoincidencia.style.color = 'green';
            mensajeCoincidencia.textContent = "Bien, tu reto parece ser uno nuevo, ¡puedes continuar!";
        } else if (similarity > 50 && similarity <= 74) {
            progressBar.className = 'filled orange';
            mensajeCoincidencia.style.color = 'orange';
            mensajeCoincidencia.textContent = "Uy, tú reto parece tener cierta similitud con alguno ya existente, pero no te preocupes, ¡puedes continuar!";
        } else if (similarity >= 75) {
            progressBar.className = 'filled red';
            mensajeCoincidencia.style.color = 'red';
            mensajeCoincidencia.textContent = "Ups, ¡tú reto tiene mucha coincidencia con uno ya existente, dale en enviar para revisarlo!";
        }

        console.log(`[Frontend Log] Barra de progreso actualizada a ${similarity}% con color y mensaje correspondientes.`);
    } else {
        console.error("[Frontend Log] Los elementos de la barra de progreso o el mensaje no se encontraron en el DOM.");
    }
}


// Mostrar sección de solución propuesta y alternar visibilidad de contenedores de promotores y cargos
function mostrarSeccionSolucion() {
    const tipoSolucion = document.getElementById('tipo-solucion').value;
    const seccionSolucion = document.getElementById('seccion-solucion');
    const contenedorPromotores = document.getElementById('gerencia-select');
    const contenedorNombrePromotor = document.getElementById('nombre-promotor');
    const contenedorCargos = document.getElementById('contenedor-cargos-sugeridos');

    // Mostrar u ocultar las secciones basadas en la opción seleccionada
    if (tipoSolucion === 'conSolucion') {
        seccionSolucion.style.display = 'block';           // Mostrar el contenedor de solución
        contenedorPromotores.style.display = 'none';       // Ocultar el contenedor de promotores
        contenedorNombrePromotor.style.display = 'none';   // Ocultar el contenedor de nombre del promotor
        contenedorCargos.style.display = 'block';          // Mostrar el contenedor de cargos
    } else {
        seccionSolucion.style.display = 'none';            // Ocultar el contenedor de solución
        contenedorPromotores.style.display = 'block';      // Mostrar el contenedor de promotores
        contenedorNombrePromotor.style.display = 'block';  // Mostrar el contenedor de nombre del promotor
        contenedorCargos.style.display = 'none';           // Ocultar el contenedor de cargos
    }
}


// Función para analizar palabras clave y obtener cargos sugeridos
function verificarCamposYAnalizar() {
    const descripcion = document.getElementById('descripcion').value.trim();
    const solucion = document.getElementById('solucion').value.trim();
    const contenedorCargos = document.getElementById('contenedor-cargos-sugeridos');
    const tituloCargos = document.getElementById('titulo-cargos');
    const mensajeCargos = document.getElementById('mensaje-cargos');
    
    if (descripcion && solucion) {
        analizarPalabrasClave(descripcion, solucion);
    } else {
        // Estado inicial
        tituloCargos.textContent = "Ve digitando la información y te ayudaremos a escoger el cliente interno más adecuado para ti";
        mensajeCargos.textContent = "";
        contenedorCargos.style.display = "block";
        document.getElementById('buscar-otro-cargo').style.display = "none";
        document.getElementById('cargos-sugeridos-lista').innerHTML = ""; 
    }
}

async function analizarPalabrasClave(descripcion, solucion) {
    try {
        const response = await fetch('http://localhost:8000/api/analizar_reto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descripcion, solucion })
        });

        if (!response.ok) throw new Error('Error en la respuesta del servidor para análisis de palabras clave');

        const data = await response.json();
        mostrarCargosSugeridos(data.resultado_descripcion, data.resultado_solucion);
    } catch (error) {
        console.error("Error al analizar palabras clave:", error);
    }
}

// Mostrar los cargos sugeridos en el DOM
function mostrarCargosSugeridos(resultadoDescripcion, resultadoSolucion) {
    const contenedorCargos = document.getElementById('contenedor-cargos-sugeridos');
    const cargosSugeridosLista = document.getElementById('cargos-sugeridos-lista');
    const buscarOtroCargo = document.getElementById('buscar-otro-cargo');
    const tituloCargos = document.getElementById('titulo-cargos');
    const mensajeCargos = document.getElementById('mensaje-cargos');
    
    cargosSugeridosLista.innerHTML = "";
    contenedorCargos.style.display = "block";

    if (resultadoDescripcion.length > 0 || resultadoSolucion.length > 0) {
        const resultados = resultadoDescripcion.length ? resultadoDescripcion : resultadoSolucion;

        tituloCargos.textContent = "Cargos - Cliente Interno";
        mensajeCargos.textContent = "Estos son algunos de los cargos que te sugerimos para continuar proceso de Ideas Innovadoras. Selecciona para ver su descripción";

        resultados.forEach((resultado, index) => {
            const cargoCard = document.createElement('div');
            cargoCard.className = 'cargo-card';
            
            // Crear el contenido de la tarjeta
            const cargoHeader = document.createElement('div');
            cargoHeader.className = 'cargo-header';
            
            const cargoNumero = document.createElement('span');
            cargoNumero.className = 'cargo-numero';
            cargoNumero.textContent = `${index + 1}`;
            
            const cargoTitulo = document.createElement('h4');
            cargoTitulo.className = 'cargo-titulo';
            cargoTitulo.textContent = resultado[0];
            
            cargoHeader.appendChild(cargoNumero);
            cargoHeader.appendChild(cargoTitulo);
            
            const cargoCercania = document.createElement('div');
            cargoCercania.className = 'cargo-cercania';
            
            const cercaniaValor = document.createElement('span');
            cercaniaValor.className = 'cercania-valor';
            cercaniaValor.textContent = `${resultado[1].toFixed(2)}%`;
            
            cargoCercania.appendChild(cercaniaValor); 
            
            const cargoButton = document.createElement('button');
            cargoButton.className = 'cargo-action-btn';
            cargoButton.textContent = 'Seleccionar';
            cargoButton.type = 'button'; 
            cargoButton.addEventListener('click', (event) => {
                event.stopPropagation(); 
                event.preventDefault(); 
                mostrarOverlayCargo(resultado[0]); 
            });
            
            
            // Ensamblar la tarjeta
            cargoCard.appendChild(cargoHeader);
            cargoCard.appendChild(cargoCercania);
            cargoCard.appendChild(cargoButton);
            
            cargosSugeridosLista.appendChild(cargoCard);
        });

        buscarOtroCargo.style.display = "block";
    } else {
        tituloCargos.textContent = "Parece que no podemos asistirte en encontrar un cliente interno especial para ti";
        mensajeCargos.textContent = "Por favor, selecciona uno de los cargos que mejor corresponda a tu reto";
        buscarOtroCargo.style.display = "block";
    }
}

async function cargarListaCargos() {
    try {
        const response = await fetch('http://localhost:8000/api/cargos');
        if (!response.ok) throw new Error('Error al obtener los cargos');

        const data = await response.json();
        const buscarOtroCargo = document.getElementById('buscar-otro-cargo');

        // Limpiar opciones existentes y agregar nuevas opciones
        buscarOtroCargo.innerHTML = '<option value="">Seleccionar otro cliente interno</option>';
        data.cargos.forEach(cargo => {
            const option = document.createElement('option');
            option.value = cargo;
            option.textContent = cargo;
            buscarOtroCargo.appendChild(option);
        });

        // Agregar evento onchange para mostrar el overlay al seleccionar un cargo
        buscarOtroCargo.addEventListener('change', () => {
            const cargoSeleccionado = buscarOtroCargo.value;
            if (cargoSeleccionado) {
                mostrarOverlayCargo(cargoSeleccionado);
            }
        });

    } catch (error) {
        console.error("Error al cargar la lista de cargos:", error);
    }
}


// Función para mostrar el overlay con la descripción del cargo
function mostrarOverlayCargo(cargoSeleccionado) {
    obtenerDescripcionCargo(cargoSeleccionado)
        .then(descripcionCargo => {
            // Asignar título y descripción al overlay
            document.getElementById('overlay-titulo-cargo').textContent = cargoSeleccionado;
            document.getElementById('overlay-descripcion-cargo').textContent = descripcionCargo;

            // Mostrar el overlay
            document.getElementById('overlay-cargo').style.display = 'flex';
        })
        .catch(error => console.error("Error al obtener la descripción del cargo:", error));
}


function cerrarOverlayCargo() {
    document.getElementById('overlay-cargo').style.display = 'none';
}

async function obtenerDescripcionCargo(cargo) {
    try {
        const response = await fetch(`http://localhost:8000/api/descripcion-cargo?cargo=${encodeURIComponent(cargo)}`);
        if (!response.ok) throw new Error('Error al obtener la descripción del cargo');
        const data = await response.json();
        return data.descripcion || "Descripción no disponible."; 
    } catch (error) {
        console.error("Error en obtenerDescripcionCargo:", error);
        return "Descripción no disponible.";
    }
}

// Función para seleccionar un cliente interno y mostrar la selección final
function seleccionarCliente(nombre, sede, correo) {
    const contenedorSeleccionFinal = document.getElementById('contenedor-seleccion-final');
    contenedorSeleccionFinal.innerHTML = `
        <div class="cliente-seleccionado">
            <h4>Cliente Interno Seleccionado</h4>
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Sede:</strong> ${sede}</p>
            <p><strong>Correo:</strong> ${correo}</p>
        </div>
    `;
    contenedorSeleccionFinal.style.display = "block"; 
}


// Función para escoger el cargo seleccionado en el overlay
function escogerCargo(event) {
    if (event) {
        event.stopPropagation(); 
        event.preventDefault();
    }

    const cargoSeleccionado = document.getElementById('overlay-titulo-cargo').textContent;

    // Lógica para mostrar clientes internos asociados al cargo seleccionado
    mostrarClientesInternos(cargoSeleccionado);

    cerrarOverlayCargo(); 
}

// Mostrar clientes internos asociados a un cargo
async function mostrarClientesInternos(cargo) {
    console.log(`Iniciando la obtención de clientes internos para el cargo: ${cargo}`);
    try {
        const response = await fetch(`http://localhost:8000/api/clientes-internos-por-cargo?cargo=${encodeURIComponent(cargo)}`);
        if (!response.ok) throw new Error("Error al obtener los clientes internos para el cargo");

        const clientesInternos = await response.json();
        console.log("Clientes internos obtenidos:", clientesInternos);

        if (clientesInternos.length > 0) {
            const cliente = clientesInternos[0]; // Seleccionar el primer cliente por defecto
            console.log("Cliente seleccionado:", cliente);

            // Actualizar el contenedor con la selección final
            document.getElementById('seleccion-titulo-cargo').textContent = cargo;
            document.getElementById('seleccion-nombre-cliente').textContent = cliente.nombre_completo;
            document.getElementById('seleccion-sede-cliente').textContent = cliente.sede;
            document.getElementById('seleccion-correo-cliente').textContent = cliente.correo;

            // Guardar el ID del cliente interno en un atributo oculto para el formulario
            document.getElementById('id-cliente-interno').value = cliente.id_cliente;
            console.log(`ID del cliente interno almacenado: ${cliente.id_cliente}`);

            // Mostrar el contenedor de selección final
            document.getElementById('contenedor-seleccion-final').style.display = 'block';
        } else {
            console.warn("No se encontraron clientes internos para este cargo.");
            alert("No se encontraron clientes internos para este cargo.");
        }
    } catch (error) {
        console.error("Error al obtener los clientes internos:", error);
    }
}

// Enviar el formulario con la lógica ajustada
async function enviarFormulario(event) {
    event.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    const descripcion = document.getElementById('descripcion').value.trim();

    try {
        // Verificar similitud antes de enviar
        const { percentage, idSimilarReto } = await verificarSimilitud(descripcion);

        if (percentage > 75) {
            alert('El reto tiene una alta similitud con otro existente. Será redirigido a la pestaña de reto similar.');
            const descripcionRetoIngresado = encodeURIComponent(descripcion); // Codificar para URL
            window.location.href = `/usuario/Retos/retoSimilar.html?descripcionRetoIngresado=${descripcionRetoIngresado}&idRetoSimilar=${idSimilarReto}`;
            isSubmitting = false;
            return;
        }

        // Preparar los datos para el envío
        const titulo = document.getElementById('titulo-reto').value.trim();
        const beneficios = document.getElementById('beneficios').value.trim();
        const archivoPDF = document.getElementById('archivo-pdf').files[0];
        const enlaceCanva = document.getElementById('enlace-canva').value.trim();
        const tipoSolucion = document.getElementById('tipo-solucion').value; // conSolucion o sinSolucion

        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const nombreSede = usuario ? usuario.sede : null;
        const idSede = sedeMap[nombreSede];
        const idUsuario = usuario ? usuario.id : null;

        if (!idUsuario) {
            alert('ID de usuario no disponible. Por favor, inicie sesión nuevamente.');
            isSubmitting = false;
            return;
        }

        if (!idSede) {
            alert('Sede no disponible. Por favor, verifique la información de usuario.');
            isSubmitting = false;
            return;
        }

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);
        formData.append('beneficios', beneficios);
        formData.append('enlaceCanva', enlaceCanva || '');
        formData.append('idSede', idSede);
        formData.append('idUsuario', idUsuario);
        if (archivoPDF) formData.append('archivo_pdf', archivoPDF);

        let url;

        if (tipoSolucion === 'conSolucion') {
            // Caso: Con solución
            const solucion = document.getElementById('solucion').value.trim();
            const idClienteInterno = document.getElementById('id-cliente-interno').value;

            if (!idClienteInterno) {
                alert('Debe seleccionar un cliente interno para continuar.');
                isSubmitting = false;
                return;
            }

            formData.append('solucion', solucion || 'Sin solución');
            formData.append('idClienteInterno', idClienteInterno);
            url = 'http://localhost:8000/api/crear-reto'; // Endpoint Python
        } else if (tipoSolucion === 'sinSolucion') {
            // Caso: Sin solución
            const idPromotor = promotorAsignado ? promotorAsignado.id : null;

            if (!idPromotor) {
                alert('Debe asignar un promotor para un reto sin solución.');
                isSubmitting = false;
                return;
            }

            formData.append('idPromotor', idPromotor);
            formData.append('solucion', 'Sin solución');
            url = 'http://localhost:3000/api/crear-reto'; // Endpoint Node.js
        } else {
            alert('Tipo de solución no válido. Verifique su selección.');
            isSubmitting = false;
            return;
        }

        console.log(`Enviando datos al endpoint: ${url}`); // Log del endpoint seleccionado

        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Error al crear el reto.');
        }

        const result = await response.json();
        console.log('Reto creado:', result);
        alert('Reto enviado exitosamente.');

        // Incrementar la carga del promotor si aplica
        if (tipoSolucion === 'sinSolucion' && promotorAsignado) {
            await incrementarCargaPromotor(promotorAsignado.id);
        }

        // Redirigir al dashboard
        window.location.href = '/usuario/Retos/verMisRetos-Dashboard.html';
    } catch (error) {
        console.error('Error al enviar el reto:', error);
        alert('Hubo un problema al enviar el reto. Intente nuevamente.');
    } finally {
        isSubmitting = false;
    }
}
