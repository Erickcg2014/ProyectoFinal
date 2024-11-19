document.addEventListener('DOMContentLoaded', () => {
    cargarRetos();
});

let retosGlobal = []; // Almacena los retos obtenidos del servidor

// Función para cargar retos desde el servidor
async function cargarRetos() {
    try {
        console.log('Iniciando la carga de retos...');
        const response = await fetch('/api/retos');

        if (!response.ok) {
            throw new Error('Error al obtener los retos.');
        }

        const retos = await response.json();
        console.log('Retos obtenidos:', retos);

        if (retos.length === 0) {
            alert('No hay retos disponibles.');
        } else {
            retosGlobal = retos; // Guardar los retos globalmente
            mostrarRetos(retosGlobal); // Llamar a la función para mostrar los retos en la tabla
        }
    } catch (error) {
        console.error('Error al cargar los retos:', error);
        alert('Hubo un problema al cargar los retos. Intente nuevamente.');
    }
}

// Función para mostrar los retos en la tabla
function mostrarRetos(retos) {
    const retosBody = document.getElementById('retos-body');
    retosBody.innerHTML = ''; // Limpiar contenido anterior

    retos.forEach((reto) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reto.titulo || 'Sin título'}</td>
            <td>${reto.area || 'Área no definida'}</td>
            <td>${reto.importancia || 'No definida'}</td>
            <td>${reto.estado || 'Sin estado'}</td>
            <td>${new Date(reto.fecha_inicio).toLocaleDateString()}</td>
            <td><button onclick="verDetalleReto(${reto.id})">Ver</button></td>
        `;
        retosBody.appendChild(row);
    });
}

// Función para exportar los retos a un archivo Excel
async function exportarAExcel() {
    try {
        console.log('Iniciando exportación a Excel...');
        const response = await fetch('/api/retos/exportar-excel', {
            method: 'GET'
        });

        console.log('Respuesta recibida de exportación:', response);

        if (!response.ok) {
            console.error('Error en la respuesta al exportar a Excel:', response.status, response.statusText);
            throw new Error('Error al exportar a Excel');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'retos.xlsx'; // Nombre del archivo para la descarga
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url); // Libera la memoria usada por el blob
        console.log('Exportación a Excel completada.');
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Hubo un problema al exportar los retos a Excel.');
    }
}

