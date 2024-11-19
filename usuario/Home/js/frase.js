document.addEventListener('DOMContentLoaded', async () => {
  // Obtén el usuario desde el almacenamiento local y establece el nombre
  const user = JSON.parse(localStorage.getItem('usuario'));
  document.getElementById('nombre-usuario').textContent = `Hola 👋🏼, ${user.nombre}`;

  // Establece el saludo personalizado en la tarjeta de bienvenida
  document.getElementById('bienvenida-evaluador').textContent = `Hola usuario ${user.nombre}, Bienvenido a Imagix`;

  // Llama al endpoint para obtener una frase motivacional
  try {
      const response = await fetch('/api/frase-motivacional');
      if (!response.ok) throw new Error('Error al obtener frase motivacional.');

      const data = await response.json();
      document.getElementById('frase-motivacional').textContent = data.frase;
  } catch (error) {
      console.error('Error al cargar la frase motivacional:', error);
      document.getElementById('frase-motivacional').textContent = 'Bienvenido, esperamos tengas un excelente día en Imagix.';
  }
});
