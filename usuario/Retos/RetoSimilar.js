document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const descripcionRetoIngresado = urlParams.get('descripcionRetoIngresado');
    const idRetoSimilar = urlParams.get('idRetoSimilar');

    if (descripcionRetoIngresado) {
        document.getElementById('descripcionRetoIngresado').textContent = decodeURIComponent(descripcionRetoIngresado);
    } else {
        console.error("Descripción del reto ingresado no especificada en la URL.");
        document.getElementById('descripcionRetoIngresado').textContent = "Descripción no disponible.";
    }

    if (idRetoSimilar) {
        obtenerDescripcionReto(idRetoSimilar, 'descripcionRetoSimilar');
    } else {
        console.error("ID del reto similar no especificado en la URL.");
        document.getElementById('descripcionRetoSimilar').textContent = "Descripción no disponible.";
    }
});

async function obtenerDescripcionReto(idReto, elementoId) {
    try {
        console.log(`Obteniendo descripción para el reto con ID: ${idReto}`);
        const response = await fetch(`/api/retos/detalle/${idReto}`);
        
        if (!response.ok) {
            throw new Error(`No se pudo obtener la descripción del reto. Status: ${response.status}`);
        }

        const reto = await response.json();
        console.log("Respuesta del servidor:", reto);

        if (reto.descripcion) {
            document.getElementById(elementoId).textContent = reto.descripcion;
        } else {
            document.getElementById(elementoId).textContent = 'Sin descripción disponible';
            console.warn("El reto no tiene una descripción.");
        }
    } catch (error) {
        console.error('Error al obtener la descripción del reto:', error);
        document.getElementById(elementoId).textContent = 'Error al cargar la descripción.';
    }
}

function volver() {
    window.location.href = 'crearRetoConSolucion.html';
}
