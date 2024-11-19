// retoService.js
const pool = require('./db');

// Obtener todos los retos de la base de datos
async function obtenerRetosExistentes() {
    try {
        const query = 'SELECT titulo, descripcion FROM retos';
        const { rows } = await pool.query(query);
        return rows;
    } catch (error) {
        console.error('Error al obtener retos:', error);
        throw error;
    }
}

module.exports = {
    obtenerRetosExistentes,
};
