const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); 
const multer = require('multer');
const path = require('path'); 
const app = express();
const axios = require('axios');
const ExcelJS = require('exceljs');
const router = express.Router();


// Configuración del puerto
const PORT = 3000;
const JWT_SECRET = '#ProyectoInnovación123';

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',            
  host: 'localhost',            
  database: 'Innovacion',       
  password: 'nueva_contraseña', 
  port: 5432,                   
});
module.exports = pool;

// Middleware para interpretar JSON
app.use(express.json());

//FUNCIÓN PROPIA PARA CALCULAR LA SIMILITUD

app.use('/api', router); 

// Servir archivos estáticos desde la carpeta "login"
app.use('/login', express.static(path.join(__dirname, 'login')));
app.use('/usuario', express.static(path.join(__dirname, 'usuario')));
app.use('/promotor', express.static(path.join(__dirname, 'promotor')));
app.use('/clienteInterno', express.static(path.join(__dirname, 'clienteInterno')));
app.use('/evaluador', express.static(path.join(__dirname, 'evaluador')));



// Redirigir a la página de login en la raíz
app.get('/', (req, res) => {
  res.redirect('/login/html/loginSinGuardar.html');
});


app.post('/registro', async (req, res) => {
  console.log('Solicitud de registro recibida:', req.body);

  const { nombre, username, correo, contraseña, id_rol, id_sede, cargo, nivel } = req.body;

  try {
      // Verificar si el correo o el username ya existen en la tabla `usuarios`
      console.log('Verificando existencia de correo y username...');
      const correoExistente = await pool.query(
          'SELECT correo FROM usuarios WHERE correo = $1',
          [correo]
      );
      const usernameExistente = await pool.query(
          'SELECT username FROM usuarios WHERE username = $1',
          [username]
      );

      if (correoExistente.rows.length > 0) {
          console.log('El correo ya está registrado.');
          return res.status(400).json({ message: 'El correo ya está registrado.' });
      }

      if (usernameExistente.rows.length > 0) {
          console.log('El username ya está en uso.');
          return res.status(400).json({ message: 'El username ya está en uso.' });
      }

      // Insertar en la tabla `usuarios`
      const usuarioResult = await pool.query(
          'INSERT INTO usuarios (nombre, username, correo, contraseña, id_rol, id_sede) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [nombre, username, correo, contraseña, id_rol, id_sede]
      );
      const usuarioId = usuarioResult.rows[0].id;
      console.log('Usuario insertado en la tabla general con ID:', usuarioId);

      // Dependiendo del rol, insertar en las tablas de información específicas
      if (id_rol === 1) {
          // Usuario general
          await pool.query(
              'INSERT INTO información_usuario (id_usuario, nombre_completo, correo, sede) VALUES ($1, $2, $3, $4)',
              [usuarioId, nombre, correo, id_sede]
          );
          console.log('Usuario registrado exitosamente en información_usuario.');
      } else if (id_rol === 2) {
          // Promotor
          await pool.query(
              'INSERT INTO promotores (id, nombre_apellido, id_rol, id_sede, cargo, correo, nivel) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [usuarioId, nombre, id_rol, id_sede, cargo, correo, nivel]
          );
          console.log('Promotor registrado exitosamente en la tabla promotores.');
      } else if (id_rol === 3) {
          // Cliente Interno
          await pool.query(
              'INSERT INTO información_clientes_internos (id_cliente, nombre_completo, sede, correo, id_cargo) VALUES ($1, $2, $3, $4, $5)',
              [usuarioId, nombre, id_sede, correo, cargo]
          );
          console.log('Cliente Interno registrado exitosamente en la tabla información_clientes_internos.');
      } else if (id_rol === 4) {
          // Evaluador
          await pool.query(
              'INSERT INTO informacion_evaluador (id_evaluador, nombre_completo, sede, correo) VALUES ($1, $2, $3, $4)',
              [usuarioId, nombre, id_sede, correo]
          );
          console.log('Evaluador registrado exitosamente en la tabla informacion_evaluador.');
      } else {
          console.log('Rol inválido:', id_rol);
          return res.status(400).json({ message: 'Rol inválido.' });
      }

      res.status(201).json({ message: 'Registro exitoso.' });
  } catch (error) {
      console.error('Error en el registro:', error);
      res.status(500).json({ message: 'Error en el servidor.' });
  }
});

  // Ruta de login (ahora usando username en lugar de nombre)
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Solicitud de login recibida:', { username });

    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.contraseña, u.nombre, s.nombre AS sede, 
                    s.latitud, s.longitud, u.id_rol 
             FROM usuarios u 
             JOIN sedes s ON u.id_sede = s.id 
             WHERE u.username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            console.warn('Usuario no encontrado:', username);
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        console.log('Datos del usuario recuperado:', user);

        if (password !== user.contraseña) {
            console.warn('Contraseña incorrecta para el usuario:', username);
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                nombre: user.nombre, 
                sede: user.sede, 
                latitud: user.latitud, 
                longitud: user.longitud, 
                role: user.id_rol 
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Token JWT generado:', token);

        let redirectUrl;
        if (user.id_rol === 1) {
            redirectUrl = '/usuario/home/usuario-dashboard.html';
        } else if (user.id_rol === 2) {
            redirectUrl = '/promotor/home/dashboard-promotor.html';
        } else if (user.id_rol === 3) {
            redirectUrl = '/clienteInterno/home/cliente-dashboard.html';
        } else if (user.id_rol === 4) {
            redirectUrl = '/evaluador/home/evaluador_dashboard.html';
        } else {
            return res.status(403).json({ message: 'Rol no autorizado' });
        }

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            redirectUrl,
            user: {
                id: user.id,
                nombre: user.nombre,
                sede: user.sede,
                latitud: user.latitud,
                longitud: user.longitud,
                username: user.username,
                role: user.id_rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

  
  // Verificar si el username ya existe
  app.get('/registro/username/:username', async (req, res) => {
    const { username } = req.params;
  
    try {
      console.log('Verificando existencia de username:', username);
      const result = await pool.query(
        'SELECT 1 FROM usuarios WHERE username = $1 UNION SELECT 1 FROM clientes_internos WHERE username = $1 UNION SELECT 1 FROM evaluadores WHERE username = $1',
        [username]
      );
  
      console.log('Resultado de verificación de username:', result.rows);
      res.json({ exists: result.rows.length > 0 });
    } catch (error) {
      console.error('Error al verificar el username:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  });
  
//----------FRASE MOTIVACIONAL
app.get('/api/frase-motivacional', async (req, res) => {
  try {
    const result = await pool.query('SELECT frase FROM frases ORDER BY RANDOM() LIMIT 1');
    if (result.rows.length > 0) {
      res.json({ frase: result.rows[0].frase });
    } else {
      res.status(404).json({ error: 'No hay frases disponibles.' });
    }
  } catch (error) {
    console.error('Error al obtener frase motivacional:', error);
    res.status(500).json({ error: 'Error al obtener frase motivacional.' });
  }
});


//-------------------------SEDES
app.get('/api/sedes', async (req, res) => {
  try {
      console.log('Obteniendo sedes...');
      const { rows } = await pool.query('SELECT id, nombre, latitud, longitud FROM sedes');

      if (rows.length === 0) {
          console.warn('No se encontraron sedes.');
          return res.status(404).json({ message: 'No se encontraron sedes.' });
      }

      console.log('Sedes obtenidas:', rows);
      res.status(200).json(rows);
  } catch (error) {
      console.error('Error al obtener las sedes:', error);
      res.status(500).json({ error: 'Error al obtener las sedes.' });
  }
});


app.get('/api/sedes/:id/retos-ideas', async (req, res) => {
  const { id } = req.params;
  
  try {
    const retos = await pool.query(
      'SELECT * FROM retos WHERE id_sede = $1', [id]
    );

    const ideas = await pool.query(
      'SELECT * FROM ideas_innovadoras WHERE id_sede = $1', [id]
    );

    res.json({
      retos: retos.rows,
      ideas: ideas.rows,
    });
  } catch (error) {
    console.error('Error al obtener retos e ideas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});



// Middleware para verificar JWT
function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
    }
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token no válido' });
      }
      req.user = user;
      next();
    });
  }

app.get('/api/retos', async (req, res) => {
    const limit = parseInt(req.query.limite) || 10; // Por defecto 10 retos por página
    const page = parseInt(req.query.page) || 1; // Página actual, por defecto 1
    const offset = (page - 1) * limit; // Cálculo del offset

    try {
        console.log('Obteniendo los retos desde la base de datos...');
        const { rows } = await pool.query(
            `SELECT 
                r.id, 
                r.titulo, 
                r.descripcion, 
                r.importancia, 
                r.estado, 
                rp.nombre AS area, 
                u.nombre AS nombreCreador, 
                p.nombre_apellido AS nombrePromotor, 
                p.cargo AS cargoPromotor, 
                p.correo AS correoPromotor
            FROM retos r
            JOIN roles_promotor rp ON r.id_rol_promotor = rp.id
            JOIN usuarios u ON r.id_usuario = u.id
            LEFT JOIN promotores p ON r.id_promotor = p.id
            ORDER BY r.fecha_inicio DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        console.log('Retos obtenidos:', rows);
        res.status(200).json(rows); // Devolver los retos obtenidos
    } catch (error) {
        console.error('Error al obtener los retos:', error);
        res.status(500).json({ error: 'Error al obtener los retos. Inténtalo más tarde.' });
    }
});


app.get('/api/retos-usuario/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    const { tieneSolucion } = req.query;

    try {
        console.log(`[LOG] Iniciando endpoint GET /api/retos-usuario/:idUsuario`);
        console.log(`[LOG] Parámetros recibidos: ID Usuario = ${idUsuario}, tieneSolucion = ${tieneSolucion}`);

        let query = `
            SELECT
                r.id,
                r.titulo,
                CASE
                    WHEN r.tiene_solucion THEN 
                        (SELECT nombre FROM roles_promotor WHERE id = ci.id_area)
                    ELSE rp.nombre
                END AS area,
                COALESCE(r.importancia, 'No definida') AS importancia,
                r.estado,
                p.correo AS promotor_correo,
                p.nombre_apellido AS promotor_nombre,
                ci.nombre_completo AS cliente_interno_nombre,
                ci.correo AS cliente_interno_correo,
                ci.id_area AS cliente_interno_area,
                r.tiene_solucion
            FROM retos r
            LEFT JOIN promotores p ON r.id_promotor = p.id
            LEFT JOIN roles_promotor rp ON r.id_rol_promotor = rp.id
            LEFT JOIN información_clientes_internos ci ON r.id_cliente_interno = ci.id_cliente
            WHERE r.id_usuario = $1
        `;

        const values = [idUsuario];

        if (tieneSolucion !== undefined) {
            const filtroTieneSolucion = tieneSolucion === 'true';
            query += ` AND r.tiene_solucion = $2`;
            values.push(filtroTieneSolucion);
        }

        query += ` ORDER BY r.fecha_inicio DESC`;

        console.log('[LOG] Consulta SQL construida:', query);
        console.log('[LOG] Valores para la consulta:', values);

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            console.log(`[LOG] No se encontraron retos para el usuario con ID: ${idUsuario}, tieneSolucion: ${tieneSolucion}`);
            return res.status(200).json({ retos: [] });
        }

        console.log('[LOG] Retos obtenidos:', rows);
        res.status(200).json({ retos: rows });
    } catch (error) {
        console.error('[ERROR] Error al obtener los retos del usuario:', error);
        res.status(500).json({ error: 'Error al obtener los retos del usuario.' });
    }
});


  //------------------------------------ENDPOINTS ESTADÍSTICAS------------------------------------------------------

  // Endpoint para obtener retos activos por sede

  app.get('/api/retos-sede/:idSede', async (req, res) => {
    const { idSede } = req.params;
    const limit = parseInt(req.query.limit) || 10; // Límite por defecto de 10

    try {
        console.log(`Obteniendo los últimos ${limit} retos activos de la sede con ID: ${idSede}`);

        const query = `
            SELECT 
                r.id, 
                r.titulo, 
                r.descripcion, 
                r.importancia, 
                r.estado, 
                rp.nombre AS area, 
                u.nombre AS nombrecreador
            FROM retos r
            JOIN usuarios u ON r.id_usuario = u.id
            LEFT JOIN roles_promotor rp ON r.id_rol_promotor = rp.id
            WHERE r.id_sede = $1 AND r.estado = 'activo'
            ORDER BY r.fecha_inicio DESC
            LIMIT $2;
        `;

        const { rows } = await pool.query(query, [idSede, limit]);

        console.log('Retos obtenidos:', rows);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No existen actualmente retos activos para esta sede.' });
        }

        res.status(200).json({ retos: rows });
    } catch (error) {
        console.error('Error al obtener los retos de la sede:', error);
        res.status(500).json({ error: 'Error al obtener los retos de la sede.' });
    }
});

  app.get('/api/retos/activos', async (req, res) => {
    const { sede } = req.query;
    if (!sede) {
        return res.status(400).json({ error: 'Falta el parámetro de sede.' });
    }

    try {
        const resultado = await pool.query(
            'SELECT COUNT(*) AS activos FROM retos WHERE id_sede = $1 AND estado = $2',
            [sede, 'activo']
        );
        res.json(resultado.rows[0]); // Devuelve la cantidad de retos activos
    } catch (error) {
        console.error('Error al obtener retos activos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/crear-reto', upload.single('archivo_pdf'), async (req, res) => {
    console.log('Solicitud recibida para crear un reto');

    try {
        // Verificar los datos recibidos del cuerpo de la solicitud
        console.log('Datos recibidos:', req.body);

        const {
            titulo,
            descripcion,
            beneficios,
            solucion,
            enlaceCanva,
            idSede,
            idUsuario,
            idPromotor,
        } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!titulo || !descripcion || !beneficios || !idSede || !idUsuario) {
            throw new Error('Datos incompletos. Asegúrate de enviar todos los campos requeridos.');
        }

        const archivoPDF = req.file ? req.file.buffer : null;
        console.log('Archivo PDF recibido:', archivoPDF ? 'Sí' : 'No');

        // Determinar si el reto tiene solución (evitar que "Sin solución" marque como true)
        const tieneSolucion = solucion && solucion.trim() !== '' && solucion !== 'Sin solución';

        // Valor por defecto para 'importancia'
        const importancia = 'no definido';

        // Recuperar 'id_rol_promotor' a partir del ID del promotor
        let idRolPromotor = null;
        if (idPromotor) {
            const promotorQuery = `SELECT id_rol FROM promotores WHERE id = $1`;
            const promotorResult = await pool.query(promotorQuery, [idPromotor]);

            if (promotorResult.rows.length === 0) {
                throw new Error('Promotor no encontrado.');
            }

            idRolPromotor = promotorResult.rows[0].id_rol;
        }

        // Establecer 'fecha_inicio' como ahora y 'fecha_fin' un mes después
        const fechaInicio = new Date();
        const fechaFin = new Date(fechaInicio);
        fechaFin.setMonth(fechaInicio.getMonth() + 1);

        // Inserción del reto en la base de datos
        const query = `
            INSERT INTO retos (
                titulo, descripcion, beneficios, solucion_propuesta, enlace_canva,
                archivo_pdf, id_promotor, tiene_solucion, fecha_inicio, fecha_fin, 
                estado, id_sede, id_usuario, id_rol_promotor, importancia
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'activo', $11, $12, $13, $14)
            RETURNING id;
        `;

        const values = [
            titulo,
            descripcion,
            beneficios,
            tieneSolucion ? solucion : null, // Guardar solución solo si tieneSolucion es true
            enlaceCanva || null,
            archivoPDF,
            idPromotor ? parseInt(idPromotor) : null,
            tieneSolucion, // Asigna true o false correctamente
            fechaInicio,
            fechaFin,
            parseInt(idSede),
            parseInt(idUsuario),
            idRolPromotor, // Puede ser null si no hay promotor
            importancia,
        ];

        console.log('Valores para la consulta:', values);

        // Ejecutar la consulta en la base de datos
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            throw new Error('No se pudo crear el reto.');
        }

        const retoId = rows[0].id;
        console.log(`Reto creado exitosamente con ID: ${retoId}`);

        res.status(201).json({ message: 'Reto creado exitosamente', id: retoId });
    } catch (error) {
        console.error('Error al crear el reto:', error.message);
        res.status(500).json({ error: error.message });
    }
});


  // Endpoint para obtener la cantidad de retos por mes
  app.get('/api/retos/mes', async (req, res) => {
    const { sede, anio } = req.query;

    if (!sede || !anio) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
    }

    try {
        const resultado = await pool.query(
            `SELECT EXTRACT(MONTH FROM fecha_inicio) AS mes, COUNT(*) AS cantidad_retos 
             FROM retos 
             WHERE id_sede = $1 AND EXTRACT(YEAR FROM fecha_inicio) = $2
             GROUP BY mes 
             ORDER BY mes`,
            [sede, anio]
        );
        res.json(resultado.rows); // Devuelve la cantidad de retos por mes
    } catch (error) {
        console.error('Error al obtener retos por mes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


 // Endpoint para obtener la cantidad de ideas innovadoras por sede
  app.get('/api/ideas', async (req, res) => {
  const { sedeId } = req.query;  // Asegurar que sedeId proviene de la query

  try {
      // Realizar la consulta utilizando id_sede
      const result = await pool.query(
          'SELECT id, titulo, descripcion, fecha_creacion FROM ideas WHERE id_sede = $1',
          [sedeId]
      );

      res.json(result.rows);  // Devolver todas las ideas de la sede seleccionada
  } catch (error) {
      console.error('Error al obtener ideas innovadoras:', error);
      res.status(500).send('Error al obtener ideas innovadoras');
  }
});

/**--------------CARGAS-------- */

app.get('/api/promotor-disponible/:idRol', async (req, res) => {
  const { idRol } = req.params;

  try {
      console.log(`Buscando promotor para la gerencia con idRol: ${idRol}`);
      
      const query = `
          SELECT 
              p.id, 
              p.nombre_apellido, 
              p.cargo, 
              pc.total_retos
          FROM promotores p
          JOIN promotor_cargas pc ON p.id = pc.id_promotor
          WHERE p.id_rol = $1
          ORDER BY pc.total_retos ASC
          LIMIT 1
      `;

      const { rows } = await pool.query(query, [parseInt(idRol)]);

      if (rows.length > 0) {
          console.log('Promotor encontrado:', rows[0]);
          res.status(200).json(rows[0]); // Retorna el promotor con menor carga
      } else {
          console.warn('No se encontraron promotores para esta gerencia.');
          res.status(404).json({ error: 'No se encontraron promotores para esta gerencia.' });
      }
  } catch (error) {
      console.error('Error al obtener el promotor:', error);
      res.status(500).json({ error: 'Error al obtener el promotor.' });
  }
});

// Obtener detalles de un reto específico junto con la información del promotor
/*app.get('/api/retos/:id', async (req, res) => {
  const retoId = parseInt(req.params.id);

  if (isNaN(retoId)) {
      return res.status(400).json({ error: 'ID de reto inválido.' });
  }

  try {
      console.log(`Obteniendo detalles del reto con ID: ${retoId}`);

      const queryReto = `
          SELECT 
              r.id, r.titulo, r.descripcion, r.beneficios, r.solucion_propuesta AS solucion, 
              r.fecha_inicio, r.id_sede, s.nombre AS sede, p.nombre_apellido AS promotor_nombre,
              p.cargo AS promotor_cargo, p.email AS promotor_email, p.telefono AS promotor_telefono
          FROM retos r
          JOIN sedes s ON r.id_sede = s.id
          LEFT JOIN promotores p ON r.id_promotor = p.id
          WHERE r.id = $1;
      `;

      const { rows } = await pool.query(queryReto, [retoId]);

      if (rows.length === 0) {
          return res.status(404).json({ error: 'Reto no encontrado.' });
      }

      const reto = rows[0];
      console.log('Detalles del reto:', reto);

      res.status(200).json(reto);
  } catch (error) {
      console.error('Error al obtener el reto:', error);
      res.status(500).json({ error: 'Error al obtener el reto. Inténtalo más tarde.' });
  }
});*/


//OJO CON ESTE 
app.get('/api/retos/detalle/:id', async (req, res) => {
  const retoId = parseInt(req.params.id);

  if (isNaN(retoId)) {
      return res.status(400).json({ error: 'ID de reto inválido.' });
  }

  try {
      console.log(`Obteniendo detalles del reto con ID: ${retoId}`);

      const queryReto = `
          SELECT 
              r.id, r.titulo, r.descripcion, r.beneficios, r.solucion_propuesta AS solucion, 
              r.fecha_inicio, r.id_sede, s.nombre AS sede, 
              p.nombre_apellido AS promotor_nombre,
              p.cargo AS promotor_cargo
          FROM retos r
          JOIN sedes s ON r.id_sede = s.id
          LEFT JOIN promotores p ON r.id_promotor = p.id
          WHERE r.id = $1;
      `;

      const { rows } = await pool.query(queryReto, [retoId]);

      if (rows.length === 0) {
          return res.status(404).json({ error: 'Reto no encontrado.' });
      }

      const reto = rows[0];
      console.log('Detalles del reto:', reto);

      res.status(200).json(reto);
  } catch (error) {
      console.error('Error al obtener el reto:', error);
      res.status(500).json({ error: 'Error al obtener el reto. Inténtalo más tarde.' });
  }
});


// Endpoint para incrementar la carga del promotor
app.put('/api/incrementar-carga/:idPromotor', async (req, res) => {
  const idPromotor = parseInt(req.params.idPromotor);

  if (isNaN(idPromotor)) {
      return res.status(400).json({ error: 'ID de promotor no válido.' });
  }

  try {
      const query = `
          UPDATE promotor_cargas 
          SET total_retos = total_retos + 1 
          WHERE id_promotor = $1
          RETURNING *;
      `;
      const { rows } = await pool.query(query, [idPromotor]);

      if (rows.length > 0) {
          res.status(200).json({ message: 'Carga incrementada exitosamente.' });
      } else {
          res.status(404).json({ error: 'Promotor no encontrado.' });
      }
  } catch (error) {
      console.error('Error al incrementar la carga del promotor:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

//ENDPOINT VERIFICAR SOLICITUD
app.post('/api/verificar-similitud', async (req, res) => {
  const { descripcion } = req.body;
  
  // Log para verificar la descripción recibida
  console.log(`[Node Log] Descripción recibida para verificar similitud: ${descripcion}`);

  try {
      const response = await axios.post('http://localhost:5001/similarity-check', { descripcion });
      const { similarity, most_similar_reto } = response.data;

      // Log para verificar la respuesta recibida del servicio de Python
      console.log(`[Node Log] Respuesta del servicio de similitud: Similarity=${similarity}, Most Similar Reto=${JSON.stringify(most_similar_reto)}`);

      if (similarity > 75) {
          res.json({ redirect: true, most_similar_reto });
      } else {
          res.json({ redirect: false, similarity });
      }
  } catch (error) {
      console.error('[Node Log] Error en la verificación de similitud:', error);
      res.status(500).json({ error: 'Error en la verificación de similitud' });
  }
});


//EXPORTAR LOS RETOS PARA EL EXCEL
app.get('/api/retos/exportar-excel', async (req, res) => {
  console.log('Solicitud recibida en /api/retos/exportar-excel');

  try {
      // Consulta SQL actualizada para obtener los nombres en lugar de los IDs
      const query = `
          SELECT 
              s.nombre AS sede,
              r.nombre AS area,
              p.nombre_apellido AS promotor,
              u.nombre AS usuario,
              retos.titulo,
              retos.descripcion,
              retos.fecha_inicio,
              retos.fecha_fin
          FROM retos
          JOIN sedes s ON retos.id_sede = s.id
          JOIN roles r ON retos.id_rol_promotor = r.id
          JOIN promotores p ON retos.id_promotor = p.id
          JOIN usuarios u ON retos.id_usuario = u.id
          ORDER BY retos.fecha_inicio DESC
      `;

      const result = await pool.query(query);
      console.log(`Número de retos obtenidos: ${result.rows.length}`);

      if (result.rows.length === 0) {
          console.warn('No se encontraron datos en la tabla retos.');
          return res.status(400).json({ error: 'No hay datos disponibles para exportar' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Retos');

      // Definición de las columnas
      worksheet.columns = [
          { header: 'Sede', key: 'sede', width: 20 },
          { header: 'Área', key: 'area', width: 20 },
          { header: 'Promotor', key: 'promotor', width: 25 },
          { header: 'Usuario', key: 'usuario', width: 25 },
          { header: 'Título', key: 'titulo', width: 30 },
          { header: 'Descripción', key: 'descripcion', width: 50 },
          { header: 'Fecha Inicio', key: 'fecha_inicio', width: 20 },
          { header: 'Fecha Fin', key: 'fecha_fin', width: 20 }
      ];

      // Estilo de la cabecera
      worksheet.getRow(1).eachCell((cell) => {
          cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF00' }
          };
          cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
          };
          cell.font = { bold: true };
      });

      // Añadir filas de datos
      result.rows.forEach((row, index) => {
          console.log(`Añadiendo fila ${index + 1} para el reto con título: ${row.titulo}`);
          worksheet.addRow(row);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=retos.xlsx');

      await workbook.xlsx.write(res);
      console.log('Archivo Excel generado y enviado al cliente.');
      res.end();
  } catch (error) {
      console.error('Error al exportar datos a Excel:', error);
      res.status(500).json({ error: 'Error en el servidor' });
  }
});


module.exports = router;


// Rutas protegidas
app.get('/usuario', authenticateToken, (req, res) => {
  res.json({ message: `Bienvenido Usuario ${req.user.username}!` });
});

app.get('/promotor', authenticateToken, (req, res) => {
  res.json({ message: `Bienvenido Promotor ${req.user.username}!` });
});

// -------------------- INICIO DEL SERVIDOR --------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
