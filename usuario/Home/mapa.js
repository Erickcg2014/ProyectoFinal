(async () => {
    // Obtener las sedes del backend
    const response = await fetch('/api/sedes');
    const sedes = await response.json();

    console.log('Sedes cargadas:', sedes);

    // Definir la función inicializarMapa y exponerla globalmente
    window.inicializarMapa = (sedeUsuario) => {
        // Buscar la sede del usuario en la lista de sedes
        const sedeEncontrada = sedes.find(sede => sede.nombre.toLowerCase() === sedeUsuario.toLowerCase());

        let coordenadasIniciales = [4.5709, -74.2973]; // Coordenadas por defecto (Colombia)
        let zoomInicial = 5; // Zoom por defecto

        if (sedeEncontrada) {
            coordenadasIniciales = [sedeEncontrada.latitud, sedeEncontrada.longitud];
            zoomInicial = 12; // Zoom más cercano si la sede es encontrada
        }

        // Inicializar el mapa con las coordenadas iniciales
        const map = L.map('map').setView(coordenadasIniciales, zoomInicial);

        // Agregar tiles al mapa
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Agregar marcadores para cada sede
        sedes.forEach((sede) => {
            L.marker([sede.latitud, sede.longitud])
                .addTo(map)
                .bindPopup(`<b>${sede.nombre}</b>`);
        });

        console.log('Mapa inicializado y centrado en la sede:', sedeUsuario);
    };
})();
