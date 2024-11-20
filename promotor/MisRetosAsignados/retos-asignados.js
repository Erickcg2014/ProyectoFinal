document.addEventListener("DOMContentLoaded", () => {
    cargarRetos();
  });
  
  // Ejemplo de datos dinámicos (puedes sustituir esto por datos de tu API)
  const retos = [
    {
      id: 1,
      titulo: "Rediseño de Página",
      area: "Marketing",
      importancia: "Alta",
      fecha_asignacion: "2023-11-19",
      estado: "Activo",
    },
    {
      id: 2,
      titulo: "Mejora de Producto",
      area: "Producción",
      importancia: "Media",
      fecha_asignacion: "2023-11-17",
      estado: "Pendiente",
    },
    {
      id: 3,
      titulo: "Estrategia Nueva",
      area: "Ventas",
      importancia: "Baja",
      fecha_asignacion: "2023-11-15",
      estado: "Completado",
    },
  ];
  
  // Función para cargar y mostrar los retos
  function cargarRetos() {
    const tableBody = document.getElementById("retos-body");
    tableBody.innerHTML = "";
  
    if (retos.length === 0) {
      const noRetosRow = document.createElement("tr");
      noRetosRow.innerHTML = `<td colspan="6" class="no-retos">No tienes retos asignados actualmente.</td>`;
      tableBody.appendChild(noRetosRow);
      return;
    }
  
    retos.forEach((reto) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${reto.titulo || "Sin título"}</td>
        <td>${reto.area || "Área no definida"}</td>
        <td>${reto.importancia || "No definida"}</td>
        <td>${reto.fecha_asignacion || "Sin fecha"}</td>
        <td>${reto.estado || "Sin estado"}</td>
        <td>
          <button class="ver-btn" onclick="verReto(${reto.id})">Ver</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  // Función para manejar el botón "Ver"
  function verReto(idReto) {
    // Aquí puedes redirigir al usuario a una página con más detalles o mostrar un modal
    alert(`Ver detalles del reto con ID: ${idReto}`);
    // Ejemplo: Redirigir a una página de detalle
    // window.location.href = `/detalle-reto.html?id=${idReto}`;
  }
  