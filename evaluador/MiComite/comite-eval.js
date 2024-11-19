// Datos de ejemplo para la tabla
const data = [
    {
      name: "Luis Carlos",
      area: "Innovación",
      importance: "Importante",
      email: "luiscarlos@gmail.com",
      location: "Cúcuta",
    },
    {
      name: "Luz Marina",
      area: "Producción",
      importance: "Alta",
      email: "luzma@gmail.com",
      location: "Bogotá",
    },
    {
      name: "Maria del Carmen",
      area: "Finanzas",
      importance: "Alta",
      email: "mariacrm@gmail.com",
      location: "Manizales",
    },
  ];
  
  // Función para generar las filas de la tabla
  function generateTableRows() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Limpiar el contenido existente
  
    data.forEach(item => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.area}</td>
        <td>${item.importance}</td>
        <td>${item.email}</td>
        <td>${item.location}</td>
        <td><button class="evaluate-btn">Evaluar</button></td>
      `;
      
      tableBody.appendChild(row); // Agregar la fila al cuerpo de la tabla
    });
  }
  
  // Llamar a la función para generar las filas al cargar la página
  document.addEventListener('DOMContentLoaded', generateTableRows);
  