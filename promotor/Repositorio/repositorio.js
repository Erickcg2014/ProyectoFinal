// Inicializa flatpickr en los inputs de fecha
flatpickr("#fecha-entrada", {
    dateFormat: "d-m-Y", // Formato deseado (día-mes-año)
    placeholder: "Fecha de entrada", // Texto de previsualización
});

flatpickr("#fecha-salida", {
    dateFormat: "d-m-Y", // Formato deseado
    placeholder: "Fecha de salida", // Texto de previsualización
});

// Datos de ejemplo para la tabla (ajusta según tu estructura real)
let tableData = [
    { status: "COMPLETADO", entryDate: "21-03-2024", endDate: "23-03-2024", id: 1596, description: "Nuevo Helado", classificationDate: "23-03-2024", area: "INNOVACIÓN" },
    { status: "INCOMPLETO", entryDate: "23-03-2024", endDate: "23-03-2024", id: 1595, description: "Nueva plataforma", classificationDate: "03-03-2024", area: "FINANZAS" },
    // Agrega más datos si es necesario
];

function updateTable() {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = ""; // Limpiar contenido actual
    tableData.forEach(item => {
        const row = `
            <tr>
                <td class="status ${item.status.toLowerCase()}">${item.status}</td>
                <td>${item.entryDate}</td>
                <td>${item.endDate}</td>
                <td>${item.id}</td>
                <td>${item.description}</td>
                <td>${item.classificationDate}</td>
                <td>${item.area}</td>
                <td><button class="review-btn" onclick="toggleSubTable(this)">Revisar</button></td>
                <td><button class="delete-btn">🗑️</button></td>
                <td><button class="options-btn">⋮</button></td>
            </tr>
            <tr class="sub-table" style="display: none;">
                <td colspan="10">
                    <!-- Subtabla con encabezados específicos -->
                    <table>
                        <thead>
                            <tr>
                                <th>Proceso</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Código Proceso</th>
                                <th>Reducción Tiempos</th>
                                <th>Reducción Costos</th>
                                <th>Aumento Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Proceso 1</td>
                                <td>Descripción del proceso 1</td>
                                <td>Estado 1</td>
                                <td>Código 1</td>
                                <td>10%</td>
                                <td>5%</td>
                                <td>15%</td>
                            </tr>
                            <tr>
                                <td>Proceso 2</td>
                                <td>Descripción del proceso 2</td>
                                <td>Estado 2</td>
                                <td>Código 2</td>
                                <td>20%</td>
                                <td>10%</td>
                                <td>30%</td>
                            </tr>
                        </tbody>
                    </table>
                    <button class="generate-report-btn" onclick="generateReport()">📄 Generar informe</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Función para generar el informe
function generateReport() {
    // Lógica para generar el informe
    console.log('Informe generado');
    // Aquí puedes agregar más lógica para manejar la generación del informe
}




// Función para ordenar la tabla por Fecha de entrada
function sortByEntryDate() {
    tableData.sort((a, b) => {
        const dateA = new Date(a.entryDate.split('-').reverse().join('-')); // Convierte a formato YYYY-MM-DD
        const dateB = new Date(b.entryDate.split('-').reverse().join('-'));
        return dateA - dateB; // Ordenar ascendente
    });
    updateTable(); // Actualiza la tabla después de ordenar
}

// Función para ordenar la tabla por Fecha de finalización
function sortByEndDate() {
    tableData.sort((a, b) => {
        const dateA = new Date(a.endDate.split('-').reverse().join('-'));
        const dateB = new Date(b.endDate.split('-').reverse().join('-'));
        return dateA - dateB;
    });
    updateTable();
}

// Función para ordenar la tabla por Fecha de clasificación
function sortByClassificationDate() {
    tableData.sort((a, b) => {
        const dateA = new Date(a.classificationDate.split('-').reverse().join('-'));
        const dateB = new Date(b.classificationDate.split('-').reverse().join('-'));
        return dateA - dateB;
    });
    updateTable();
}

// Llamar a updateTable cuando el documento esté listo
document.addEventListener("DOMContentLoaded", updateTable);

function toggleSubTable(button) {
    // Encuentra la fila padre
    const row = button.closest("tr");
    // Encuentra la fila de subtabla que sigue a la fila padre
    const subTableRow = row.nextElementSibling;

    // Alterna la visibilidad de la subtabla
    if (subTableRow.style.display === "none" || subTableRow.style.display === "") {
        subTableRow.style.display = "table-row"; // Muestra la subtabla
        row.classList.add("selected"); // Añadir clase seleccionada
    } else {
        subTableRow.style.display = "none"; // Oculta la subtabla
        row.classList.remove("selected"); // Remover clase seleccionada
    }
}


