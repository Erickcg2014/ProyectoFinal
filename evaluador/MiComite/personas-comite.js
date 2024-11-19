// Datos de ejemplo para la tabla
const data = [
    {
      name: "Luis Carlos",
      area: "Innovación",
      date: "10/09/2024",
      rating: "⭐⭐⭐⭐⭐",
      img: "../img/perfil-3.png",
    },
    {
      name: "Luz Marina",
      area: "Producción",
      date: "07/09/2024",
      rating: "⭐⭐⭐⭐",
      img: "../img/perfil-4.png",
    },
    {
      name: "Maria del Carmen",
      area: "Finanzas",
      date: "11/08/2024",
      rating: "⭐⭐⭐⭐⭐",
      img: "../img/perfil-5.png",
    },
    {
      name: "Sandra Milena",
      area: "Producción",
      date: "05/07/2024",
      rating: "⭐⭐⭐⭐",
      img: "../img/perfil-6.png",
    },
    {
      name: "Carlos Alberto",
      area: "Innovación",
      date: "10/06/2024",
      rating: "⭐⭐⭐⭐⭐",
      img: "../img/perfil.png",
    },
  ];
  
  // Función para generar las filas de la tabla
  function generateTableRows() {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Limpiar el contenido existente
  
    data.forEach(item => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td><img src="${item.img}" alt="Perfil de ${item.name}" class="profile-img"></td>
        <td>${item.name}</td>
        <td>${item.area}</td>
        <td>${item.date}</td>
        <td>${item.rating}</td>
      `;
      
      tableBody.appendChild(row); // Agregar la fila al cuerpo de la tabla
    });
  }
  
  // Llamar a la función para generar las filas al cargar la página
  document.addEventListener('DOMContentLoaded', generateTableRows);
  