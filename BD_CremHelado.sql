-- Tabla de regionales
CREATE TABLE regionales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de sedes (ciudades) asociadas a regionales
CREATE TABLE sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_regional INT REFERENCES regionales(id) ON DELETE CASCADE,
    UNIQUE (nombre, id_regional) -- Evitar duplicados de sede dentro de una misma regional
);

ALTER TABLE sedes
ADD COLUMN latitud DECIMAL(9,6),
ADD COLUMN longitud DECIMAL(9,6);

-- Tabla de roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);
CREATE TABLE frases (
    id SERIAL PRIMARY KEY,
    frase VARCHAR(255) NOT NULL
);

-- Tabla de usuarios, asociados a una sede específica
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL CHECK (char_length(nombre) <= 100),
    username VARCHAR(50) UNIQUE NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contraseña TEXT NOT NULL,
    id_rol INT REFERENCES roles(id) ON DELETE SET NULL,
    id_sede INT REFERENCES sedes(id) ON DELETE SET NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS información_usuario (
    id_usuario INTEGER PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    sede INTEGER NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sede) REFERENCES sedes(id)
);

CREATE TABLE promotores (
    id SERIAL PRIMARY KEY,
    nombre_apellido VARCHAR(100) NOT NULL,
    id_rol INTEGER NOT NULL,
    id_sede INTEGER NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    nivel VARCHAR(20) NOT NULL,
    CONSTRAINT fk_roles FOREIGN KEY (id_rol) REFERENCES roles_promotor (id) ON DELETE CASCADE,
    CONSTRAINT fk_sedes FOREIGN KEY (id_sede) REFERENCES sedes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS información_clientes_internos (
    id_cliente SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    sede INTEGER NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    id_cargo INTEGER NOT NULL,
    id_area INTEGER NOT NULL,
    FOREIGN KEY (id_cargo) REFERENCES cargos(id) ON DELETE SET NULL,
    FOREIGN KEY (sede) REFERENCES sedes(id),
    FOREIGN KEY (id_area) REFERENCES roles_promotor(id)
);

CREATE TABLE informacion_evaluador (
    id_evaluador INTEGER PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    sede INTEGER NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    FOREIGN KEY (id_evaluador) REFERENCES evaluadores(id) ON DELETE CASCADE
);

-- Tabla de retos
CREATE TABLE retos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    tiene_solucion BOOLEAN NOT NULL DEFAULT FALSE, -- Indica si tiene solución o no
    solucion_propuesta TEXT, -- Solo se llena si tiene solución
    beneficios TEXT NOT NULL, -- Beneficios propuestos
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    estado VARCHAR(20) DEFAULT 'activo',
    importancia VARCHAR(50) DEFAULT 'no definido', -- Grado de importancia
    id_sede INTEGER NOT NULL, -- Clave foránea a la tabla sedes
    id_rol_promotor INTEGER, -- Clave foránea a la tabla roles_promotor
    id_promotor INTEGER, -- Clave foránea a la tabla promotores
    id_area INTEGER, -- Referencia al área del cliente interno
    archivo_pdf BYTEA, -- Archivo PDF almacenado en formato binario
    enlace_canva TEXT, -- Enlace a Canva
    id_usuario INT NOT NULL, -- Clave foránea a la tabla usuarios
    id_cliente_interno INTEGER, -- Clave foránea a la tabla información_clientes_internos

    -- Claves foráneas
    CONSTRAINT fk_sede FOREIGN KEY (id_sede) REFERENCES sedes (id) ON DELETE CASCADE,
    CONSTRAINT fk_rol_promotor FOREIGN KEY (id_rol_promotor) REFERENCES roles_promotor (id),
    CONSTRAINT fk_promotor FOREIGN KEY (id_promotor) REFERENCES promotores (id) ON DELETE SET NULL,
    CONSTRAINT fk_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_cliente_interno FOREIGN KEY (id_cliente_interno) REFERENCES información_clientes_internos (id_cliente) ON DELETE CASCADE,
    CONSTRAINT fk_area FOREIGN KEY (id_area) REFERENCES roles_promotor (id),

    -- Restricciones de validación
    CONSTRAINT chk_archivo_o_enlace CHECK (
        archivo_pdf IS NOT NULL OR enlace_canva IS NOT NULL -- Al menos uno debe estar presente
    ),
    CONSTRAINT chk_solucion_propuesta CHECK (
        (tiene_solucion = TRUE AND solucion_propuesta IS NOT NULL) OR 
        (tiene_solucion = FALSE AND solucion_propuesta IS NULL)
    )
);

-- Tabla de sesiones de ideación
CREATE TABLE sesiones_ideacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP NOT NULL,
    id_reto INT REFERENCES retos(id)
);

CREATE TABLE ideas_innovadoras (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    foto_url TEXT,
    id_sede INT NOT NULL,
    FOREIGN KEY (id_sede) REFERENCES sedes(id)
);
-- otra versión de ideas_innovadoras pero sin foto
CREATE TABLE ideas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    id_sede INTEGER NOT NULL,
    FOREIGN KEY (id_sede) REFERENCES sedes (id) ON DELETE CASCADE
);

--CARGOS PARA CLIENTES INTERNOS
CREATE TABLE cargos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion_cargo TEXT,         
    palabras_clave TEXT[]           
);

-- Tabla de notificaciones para los usuarios
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    id_usuario INT REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de calificaciones de retos
CREATE TABLE calificaciones_retos (
    id SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id),
    id_reto INT REFERENCES retos(id),
    calificacion NUMERIC(2,1) CHECK (calificacion BETWEEN 0 AND 5),
    comentario TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promotor_cargas (
    id_promotor INT PRIMARY KEY,
    total_retos INT DEFAULT 0,
    FOREIGN KEY (id_promotor) REFERENCES promotores(id)
);

CREATE TABLE roles_promotor (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO promotor_cargas (id_promotor, total_retos)
SELECT id, 0
FROM promotores
WHERE id NOT IN (SELECT id_promotor FROM promotor_cargas);


INSERT INTO roles_promotor (nombre) VALUES
('Ventas'),
('Financiera'),
('Cadena'),
('Mercadeo'),
('DHCO');


-- Insertar datos iniciales de regionales
INSERT INTO regionales (nombre) VALUES
('Central'),
('Antioquia'),
('Costa'),
('Occidental'),
('Santander'),
('Eje Cafetero'),
('Tolhuca');


INSERT INTO sedes (id, nombre, id_regional, latitud, longitud) VALUES
(1, 'Bogotá', 1, 4.695381, -74.078240),
(2, 'Villavicencio', 1, 4.142523, -73.624718),
(3, 'Medellín', 2, 6.234452, -75.600197),
(4, 'Barranquilla', 3, 10.950578, -74.837543),
(5, 'Cartagena', 3, 10.377466, -75.502541),
(6, 'Cali', 4, 3.517201, -76.500528),
(7, 'Pasto', 4, 1.206801, -77.264138),
(8, 'Bucaramanga', 5, 7.085446, -73.136168),
(9, 'Cúcuta', 5, 7.915705, -72.500200),
(10, 'Pereira', 6, 4.840627, -75.682749),
(11, 'Manizales', 6, 5.060039, -75.509855),
(12, 'Armenia', 6, 4.454114, -75.774112),
(13, 'Neiva', 7, 2.907994, -75.281023),
(14, 'Ibagué', 7, 4.426851, -75.176935);


--INSERT PARA LAS FRASES
INSERT INTO frases (frase) VALUES
('El éxito es la suma de pequeños esfuerzos repetidos día tras día.'),
('La creatividad es la inteligencia divirtiéndose.'),
('Confía en ti mismo, eres más capaz de lo que crees.'),
('Todo lo que necesitas ya está dentro de ti.'),
('La disciplina es el puente entre tus metas y tus logros.'),
('Nunca es demasiado tarde para ser quien podrías haber sido.'),
('El único límite a nuestros logros de mañana son nuestras dudas de hoy.'),
('Aprende a disfrutar el viaje, no solo la meta.'),
('La acción es la clave fundamental de todo éxito.'),
('Haz hoy lo que otros no quieren hacer y mañana harás lo que otros no pueden.'),
('La vida no se trata de encontrarse a uno mismo, sino de crearse a uno mismo.'),
('No cuentes los días, haz que los días cuenten.'),
('La única manera de hacer un gran trabajo es amar lo que haces.'),
('El cambio es el resultado final de todo verdadero aprendizaje.'),
('La única diferencia entre un buen día y un mal día es tu actitud.'),
('El tiempo es limitado, así que no lo desperdicies viviendo la vida de alguien más.'),
('La perseverancia no es una carrera larga; es muchas carreras cortas una tras otra.'),
('Las oportunidades no pasan, las creas.'),
('Esfuerzo continuo, no fuerza o inteligencia, es la clave para liberar nuestro potencial.'),
('La única persona en competencia eres tú mismo.'),
('No temas renunciar a lo bueno para ir por lo grandioso.'),
('Nunca te rindas, los grandes logros llevan tiempo.'),
('El fracaso es solo la oportunidad de comenzar de nuevo con más inteligencia.'),
('Si puedes soñarlo, puedes hacerlo.'),
('Esfuérzate en mejorar un 1% cada día. Al final del año, habrás mejorado un 365%.'),
('La grandeza es un montón de pequeñas cosas hechas bien día tras día.'),
('El éxito no está en lo que tienes, sino en quién eres.'),
('Una meta sin un plan es solo un deseo.'),
('Los retos son oportunidades disfrazadas.'),
('Rodéate de personas que eleven tu nivel de energía y creatividad.'),
('Cada logro comienza con la decisión de intentarlo.'),
('No te preocupes por los fracasos, preocúpate por las oportunidades que pierdes al no intentarlo.'),
('El esfuerzo es el padre de todos los logros.'),
('La única batalla que tienes que ganar es contra la versión anterior de ti mismo.'),
('Haz que cada día cuente, las pequeñas acciones suman.'),
('La motivación es lo que te pone en marcha, pero la disciplina es lo que te hace seguir.'),
('La constancia es la clave que abre la puerta al éxito.'),
('No se trata de ser el mejor, sino de ser mejor que ayer.'),
('La paciencia es amarga, pero sus frutos son dulces.'),
('El éxito es ir de fracaso en fracaso sin perder el entusiasmo.'),
('Todo logro comienza con la voluntad de intentarlo.'),
('Hoy es el primer día del resto de tu vida.'),
('No sueñes con el éxito, trabaja para lograrlo.'),
('El talento te puede dar una oportunidad, pero solo el esfuerzo constante te mantendrá ahí.'),
('El coraje no siempre ruge; a veces, es esa pequeña voz que dice "lo intentaré de nuevo mañana".');



INSERT INTO promotores (nombre_apellido, id_rol, id_sede, cargo, correo, nivel) VALUES
-- Nivel PRO
('Carlos Alberto Serrano Moreno', 1, 8, 'Soporte De Mantenimiento Activos Comerciales', 'caserrano@cremhelado.com.co', 'PRO'),
('Germán David Navas Mojica', 2, 1, 'Analista De Mejora Continua', 'gdnavas@cremhelado.com.co', 'PRO'),
('Juan Camilo Mahecha Rivas', 3, 1, 'Auxiliar De Educación Y Entrenamiento', 'jcmahecha@cremhelado.com.co', 'PRO'),
('Laura Rocío Moreno Mendoza', 1, 1, 'Analista Ventas', 'lrmoreno@cremhelado.com.co', 'PRO'),
('Geovanny Arias Garcia', 1, 4, 'Supervisor(A) De Ventas', 'garias@cremhelado.com.co', 'PRO'),
('David Julian Garcia Aristizabal', 3, 11, 'Coordinador De Operaciones', 'djgarcia@cremhelado.com.co', 'PRO'),

-- Nivel EXPERTO
('Alirio Ferney Parra Cigua', 3, 1, 'Coordinador De Operaciones', 'aparra@cremhelado.com.co', 'EXPERTO'),
('Álvaro Becerra', 1, 2, 'Supervisor(A) De Ventas', 'abecerra@cremhelado.com.co', 'EXPERTO'),
('Nathalia Andrea Rojas', 1, 2, 'Supervisor(A) De Ventas', 'narojas@cremhelado.com.co', 'EXPERTO'),
('Tatiana Luengas', 4, 1, 'Jefe De Investigación', 'tluengas@cremhelado.com.co', 'EXPERTO'),

-- Nivel MASTER
('Cristina Espinosa Cuéllar', 4, 1, 'Director De Nuevos Proyectos', 'cespinosa@cremhelado.com.co', 'MASTER'),
('Sara Lancheros Rojas', 4, 1, 'Analista de Innovación', 'slancheros@meals.com.co', 'MASTER'),
('Carlos Alberto Flórez', 4, 2, 'Director De Innovación', 'caflorez@meals.com.co', 'MASTER'),
('Camilo González Castro', 2, 1, 'Analista De Tecnología E Información', 'cgonzalez@meals.com.co', 'MASTER');

-- Inserción de más promotores para todas las sedes
INSERT INTO promotores (nombre_apellido, id_rol, id_sede, cargo, correo, nivel) VALUES
-- PRO Nivel
('Andrés Felipe Caro Ramírez', 1, 3, 'Analista de Ventas', 'acaroramirez@cremhelado.com.co', 'PRO'),
('Camila Pérez Londoño', 4, 4, 'Ejecutivo de Marca', 'clondono@cremhelado.com.co', 'PRO'),
('Luis Miguel Gutiérrez Salazar', 2, 5, 'Auxiliar Contable', 'lgutierrez@cremhelado.com.co', 'PRO'),
('Sofía Rodríguez Acosta', 3, 6, 'Coordinador de Planta', 'srodriguez@cremhelado.com.co', 'PRO'),
('Julián Vargas Nieto', 5, 7, 'Jefe de Comunicaciones', 'jvargas@cremhelado.com.co', 'PRO'),
('Daniela Parra Montoya', 4, 8, 'Ejecutivo de Marketing', 'dparramontoya@cremhelado.com.co', 'PRO'),

-- Nivel EXPERTO
('Marcela Peña Castaño', 2, 9, 'Jefe Financiero', 'mpena@cremhelado.com.co', 'EXPERTO'),
('Esteban Hernández Gómez', 3, 10, 'Coordinador de Logística', 'ehernandez@cremhelado.com.co', 'EXPERTO'),
('Catalina Ríos Torres', 4, 11, 'Ejecutivo de Marca', 'crios@cremhelado.com.co', 'EXPERTO'),
('Jorge Luis Rincón Ávila', 1, 12, 'Supervisor de Ventas', 'jrincon@cremhelado.com.co', 'EXPERTO'),
('Mariana Gómez Sierra', 5, 13, 'Directora de Proyectos', 'mgomez@cremhelado.com.co', 'EXPERTO'),
('Carlos Andrés Romero Suárez', 1, 14, 'Supervisor de Zona', 'cromero@cremhelado.com.co', 'EXPERTO'),

-- Nivel MASTER
('Fernando Lara Méndez', 3, 2, 'Gerente de Operaciones', 'flaramendez@cremhelado.com.co', 'MASTER'),
('Valentina Quintero Lozano', 2, 5, 'Analista Financiero', 'vquintero@cremhelado.com.co', 'MASTER'),
('Mateo Restrepo Arias', 4, 7, 'Director de Marca', 'mrestrepo@cremhelado.com.co', 'MASTER'),
('Laura Camila Soto Vega', 1, 9, 'Coordinadora de Ventas', 'lsotovega@cremhelado.com.co', 'MASTER'),
('Pablo Martínez Garzón', 3, 10, 'Jefe de Planta', 'pmartinez@cremhelado.com.co', 'MASTER'),
('Claudia Jiménez Vargas', 5, 13, 'Jefe de Innovación', 'cjimenez@cremhelado.com.co', 'MASTER'),
('Manuel Rodríguez Pérez', 2, 14, 'Analista Financiero', 'mrodriguezperez@cremhelado.com.co', 'MASTER');

-- Insertar datos iniciales de roles
INSERT INTO roles (id, nombre) VALUES 
(1, 'Usuario'),
(2, 'Promotor');
INSERT INTO roles (id, nombre) VALUES 
(3, 'Cliente Interno'),
(4, 'Evaluador');


-- VALORES PARA LA TABLA USUARIOS PARA PROMOTORES
INSERT INTO usuarios (nombre, username, correo, contraseña, id_rol, id_sede)
VALUES
-- Nivel PRO
('Carlos Alberto Serrano Moreno', 'Carlos1', 'caserrano@cremhelado.com.co', 'Colombia123', 2, 8),
('Germán David Navas Mojica', 'German2', 'gdnavas@cremhelado.com.co', 'Colombia123', 2, 1),
('Juan Camilo Mahecha Rivas', 'Juan3', 'jcmahecha@cremhelado.com.co', 'Colombia123', 2, 1),
('Laura Rocío Moreno Mendoza', 'Laura4', 'lrmoreno@cremhelado.com.co', 'Colombia123', 2, 1),
('Geovanny Arias Garcia', 'Geovanny5', 'garias@cremhelado.com.co', 'Colombia123', 2, 4),
('David Julian Garcia Aristizabal', 'David6', 'djgarcia@cremhelado.com.co', 'Colombia123', 2, 11),

-- Nivel EXPERTO
('Alirio Ferney Parra Cigua', 'Alirio7', 'aparra@cremhelado.com.co', 'Colombia123', 2, 1),
('Álvaro Becerra', 'Alvaro8', 'abecerra@cremhelado.com.co', 'Colombia123', 2, 2),
('Nathalia Andrea Rojas', 'Nathalia9', 'narojas@cremhelado.com.co', 'Colombia123', 2, 2),
('Tatiana Luengas', 'Tatiana10', 'tluengas@cremhelado.com.co', 'Colombia123', 2, 1),

-- Nivel MASTER
('Cristina Espinosa Cuéllar', 'Cristina13', 'cespinosa@cremhelado.com.co', 'Colombia123', 2, 1),
('Carlos Alberto Flórez', 'Carlos16', 'caflorez@meals.com.co', 'Colombia123', 2, 2),
('Camilo González Castro', 'Camilo17', 'cgonzalez@meals.com.co', 'Colombia123', 2, 1),

-- Más promotores
-- Nivel PRO
('Andrés Felipe Caro Ramírez', 'Andres18', 'acaroramirez@cremhelado.com.co', 'Colombia123', 2, 3),
('Camila Pérez Londoño', 'Camila19', 'clondono@cremhelado.com.co', 'Colombia123', 2, 4),
('Luis Miguel Gutiérrez Salazar', 'Luis20', 'lgutierrez@cremhelado.com.co', 'Colombia123', 2, 5),
('Sofía Rodríguez Acosta', 'Sofia21', 'srodriguez@cremhelado.com.co', 'Colombia123', 2, 6),
('Julián Vargas Nieto', 'Julian22', 'jvargas@cremhelado.com.co', 'Colombia123', 2, 7),
('Daniela Parra Montoya', 'Daniela23', 'dparramontoya@cremhelado.com.co', 'Colombia123', 2, 8),

-- Nivel EXPERTO
('Marcela Peña Castaño', 'Marcela24', 'mpena@cremhelado.com.co', 'Colombia123', 2, 9),
('Esteban Hernández Gómez', 'Esteban25', 'ehernandez@cremhelado.com.co', 'Colombia123', 2, 10),
('Catalina Ríos Torres', 'Catalina26', 'crios@cremhelado.com.co', 'Colombia123', 2, 11),
('Jorge Luis Rincón Ávila', 'Jorge27', 'jrincon@cremhelado.com.co', 'Colombia123', 2, 12),
('Mariana Gómez Sierra', 'Mariana28', 'mgomez@cremhelado.com.co', 'Colombia123', 2, 13),
('Carlos Andrés Romero Suárez', 'Carlos29', 'cromero@cremhelado.com.co', 'Colombia123', 2, 14),

-- Nivel MASTER
('Fernando Lara Méndez', 'Fernando30', 'flaramendez@cremhelado.com.co', 'Colombia123', 2, 2),
('Valentina Quintero Lozano', 'Valentina31', 'vquintero@cremhelado.com.co', 'Colombia123', 2, 5),
('Mateo Restrepo Arias', 'Mateo32', 'mrestrepo@cremhelado.com.co', 'Colombia123', 2, 7),
('Laura Camila Soto Vega', 'Laura33', 'lsotovega@cremhelado.com.co', 'Colombia123', 2, 9),
('Pablo Martínez Garzón', 'Pablo34', 'pmartinez@cremhelado.com.co', 'Colombia123', 2, 10),
('Claudia Jiménez Vargas', 'Claudia35', 'cjimenez@cremhelado.com.co', 'Colombia123', 2, 13),
('Manuel Rodríguez Pérez', 'Manuel36', 'mrodriguezperez@cremhelado.com.co', 'Colombia123', 2, 14);


--VALORES PARA INFORMACIÓN_CLIENTES_INTERNOS

INSERT INTO información_clientes_internos (nombre_completo, sede, correo, id_cargo, id_area) 
VALUES
    ('ANDRES DAVID ALFARO RODRIGUEZ', 1, 'aalfaro@cremhelado.com.co', 1, 3),
    ('DIANA ROCIO SANTACRUZ MORENO', 2, 'dsantacruz@cremhelado.com.co', 2, 3),
    ('LUZ ADDY ORTIZ GONZALEZ', 3, 'lortiz@cremhelado.com.co', 3, 3),
    ('PAOLA ANDREA MORALES RODRIGUEZ', 4, 'pmorales@cremhelado.com.co', 4, 3),
    ('SERGIO HERNANDO ALARCON ROJAS', 5, 'salarcon@cremhelado.com.co', 5, 3),
    ('HENRY ORTEGA MANTILLA', 6, 'hortega@cremhelado.com.co', 6, 3),
    ('CARLOS ALBERTO OSORNO ZAPATA', 7, 'cosorno@cremhelado.com.co', 7, 3),
    ('SEBASTIAN URIBE LONDOÑO', 8, 'suribe@cremhelado.com.co', 7, 3),
    ('OSCAR DANIEL PINEDA ACERO', 9, 'opineda@cremhelado.com.co', 8, 3),
    ('OSCAR ORLANDO GARCIA AGUDELO', 10, 'oogarcia@cremhelado.com.co', 24, 3),
    ('EDWARD YESID YEPES OCAMPO', 11, 'eyepes@cremhelado.com.co', 9, 3),
    ('OSCAR HERNANDO LOZANO LEYVA', 12, 'ohlozano@cremhelado.com.co', 9, 3),
    ('JAIR JOSE NARVAEZ VILLAMIL', 13, 'jjnarvaez@cremhelado.com.co', 10, 3),
    ('JOHN JAMES FIERRO RUBIO', 14, 'jjfierro@cremhelado.com.co', 10, 3),
    ('KEELYN SALDARRIAGA REYES', 1, 'ksaldarriaga@cremhelado.com.co', 10, 3),
    ('LEONARDO ENRIQUE ARDILA ARDILA', 2, 'leardila@cremhelado.com.co', 10, 3),
    ('SERGIO MAURICIO FUENTES MARTINEZ', 3, 'smfuentes@cremhelado.com.co', 10, 3),
    ('EDWIN HERNANDO CALDERON GARCIA', 4, 'ehcalderon@cremhelado.com.co', 11, 3),
    ('RODRIGO GOMEZ', 5, 'rgomez@cremhelado.com.co', 11, 3),
    ('FELIPE ALBERTO GOMEZ GUTIERREZ', 6, 'fgomez@cremhelado.com.co', 12, 3),
    ('JORGE ELIECER RODRIGUEZ ORDOÑEZ', 7, 'jrodriguez@cremhelado.com.co', 12, 3),
    ('MAURICIO MEJIA ROJAS', 8, 'mmejia@cremhelado.com.co', 12, 3),
    ('LUZ MYRIAM CLAVIJO RIOS', 9, 'lclavijo@cremhelado.com.co', 13, 3),
    ('MARIA JOSE VARELA DUQUE', 10, 'mvarela@cremhelado.com.co', 14, 5),
    ('GLORIA CAROLINA ABADIA OLIVA', 11, 'gcabadia@cremhelado.com.co', 23, 5),
    ('MARGARITA VALLEJO COMBARIZA', 12, 'mvallejo@cremhelado.com.co', 24, 5),
    ('CAROLINA ROJAS BOLIVAR', 13, 'crojas@cremhelado.com.co', 20, 5),
    ('PAOLA ANDREA TURRIAGO DUARTE', 14, 'pturriago@cremhelado.com.co', 20, 5),
    ('LILIANA VILLAMIZAR VILLAMIL', 1, 'Lvillamizar@cremhelado.com.co', 15, 5),
    ('FREDDY GIOVANNI VIVAS MORA', 2, 'fgvivas@cremhelado.com.co', 16, 2),
    ('JOHN EDISSON HERRERA GARCIA', 3, 'jeherrera@cremhelado.com.co', 17, 2),
    ('SONIA ELIZABETH BUITRAGO MATALLANA', 4, 'sbuitrago@cremhelado.com.co', 18, 2),
    ('JULIO GONZALO ZAPATA QUEVEDO', 5, 'jzapata@cremhelado.com.co', 19, 2),
    ('ANA MARIA POSADA RUIZ', 6, 'amposada@cremhelado.com.co', 20, 2),
    ('ADRIANA GUTIERREZ RAMIREZ', 7, 'agutierrez@cremhelado.com.co', 21, 4),
    ('ANDRES FELIPE ROBAYO TORRES', 8, 'afrobayo@cremhelado.com.co', 21, 4),
    ('ALEJANDRA MARIA BELTRAN URIBE', 9, 'ambeltran@cremhelado.com.co', 22, 4),
    ('LINA MARIA ARANGO GONZALEZ', 10, 'Lmarango@cremhelado.com.co', 23, 1),
    ('JUAN CARLOS RAMIREZ TARAZONA', 11, 'jcramirez@cremhelado.com.co', 24, 1),
    ('ANDRES ORLANDO GAMBA PALOMINO', 12, 'aogamba@cremhelado.com.co', 25, 1),
    ('ANDRES TORRES VALENCIA', 13, 'atvalencia@cremhelado.com.co', 25, 1),
    ('BEYBA DEYANIRA ROMERO GARZON', 14, 'bromero@cremhelado.com.co', 26, 1),
    ('JAIME ALBERTO MUÑOZ BUSTAMANTE', 1, 'jamunoz@cremhelado.com.co', 27, 1),
    ('JAIME ANDRES MENDEZ VILLAMIZAR', 2, 'jamendez@cremhelado.com.co', 28, 1),
    ('ANA MARIA RAMON TELLO', 3, 'amramon@cremhelado.com.co', 29, 1),
    ('MARY ALEXANDRA RAMIREZ GOMEZ', 4, 'maramirez@cremhelado.com.co', 30, 1),
    ('JOSE ANGEL SOLANO BRITO', 5, 'jasolano@cremhelado.com.co', 29, 1);

--CLIENTES INTERNOS PARA LA TABLA USUARIOS:
INSERT INTO usuarios (nombre, username, correo, contraseña, id_rol, id_sede) 
VALUES
    ('ANDRES DAVID ALFARO RODRIGUEZ', 'andres1', 'aalfaro@cremhelado.com.co', 'Colombia123', 3, 1),
    ('DIANA ROCIO SANTACRUZ MORENO', 'diana2', 'dsantacruz@cremhelado.com.co', 'Colombia123', 3, 2),
    ('LUZ ADDY ORTIZ GONZALEZ', 'luz3', 'lortiz@cremhelado.com.co', 'Colombia123', 3, 3),
    ('PAOLA ANDREA MORALES RODRIGUEZ', 'paola4', 'pmorales@cremhelado.com.co', 'Colombia123', 3, 4),
    ('SERGIO HERNANDO ALARCON ROJAS', 'sergio5', 'salarcon@cremhelado.com.co', 'Colombia123', 3, 5),
    ('HENRY ORTEGA MANTILLA', 'henry6', 'hortega@cremhelado.com.co', 'Colombia123', 3, 6),
    ('CARLOS ALBERTO OSORNO ZAPATA', 'carlos7', 'cosorno@cremhelado.com.co', 'Colombia123', 3, 7),
    ('SEBASTIAN URIBE LONDOÑO', 'sebastian8', 'suribe@cremhelado.com.co', 'Colombia123', 3, 8),
    ('OSCAR DANIEL PINEDA ACERO', 'oscar9', 'opineda@cremhelado.com.co', 'Colombia123', 3, 9),
    ('OSCAR ORLANDO GARCIA AGUDELO', 'oscar10', 'oogarcia@cremhelado.com.co', 'Colombia123', 3, 10),
    ('EDWARD YESID YEPES OCAMPO', 'edward11', 'eyepes@cremhelado.com.co', 'Colombia123', 3, 11),
    ('OSCAR HERNANDO LOZANO LEYVA', 'oscar12', 'ohlozano@cremhelado.com.co', 'Colombia123', 3, 12),
    ('JAIR JOSE NARVAEZ VILLAMIL', 'jair13', 'jjnarvaez@cremhelado.com.co', 'Colombia123', 3, 13),
    ('JOHN JAMES FIERRO RUBIO', 'john14', 'jjfierro@cremhelado.com.co', 'Colombia123', 3, 14),
    ('KEELYN SALDARRIAGA REYES', 'keelyn15', 'ksaldarriaga@cremhelado.com.co', 'Colombia123', 3, 1),
    ('LEONARDO ENRIQUE ARDILA ARDILA', 'leonardo16', 'leardila@cremhelado.com.co', 'Colombia123', 3, 2),
    ('SERGIO MAURICIO FUENTES MARTINEZ', 'sergio17', 'smfuentes@cremhelado.com.co', 'Colombia123', 3, 3),
    ('EDWIN HERNANDO CALDERON GARCIA', 'edwin18', 'ehcalderon@cremhelado.com.co', 'Colombia123', 3, 4),
    ('RODRIGO GOMEZ', 'rodrigo19', 'rgomez@cremhelado.com.co', 'Colombia123', 3, 5),
    ('FELIPE ALBERTO GOMEZ GUTIERREZ', 'felipe20', 'fgomez@cremhelado.com.co', 'Colombia123', 3, 6),
    ('JORGE ELIECER RODRIGUEZ ORDOÑEZ', 'jorge21', 'jrodriguez@cremhelado.com.co', 'Colombia123', 3, 7),
    ('MAURICIO MEJIA ROJAS', 'mauricio22', 'mmejia@cremhelado.com.co', 'Colombia123', 3, 8),
    ('LUZ MYRIAM CLAVIJO RIOS', 'luz23', 'lclavijo@cremhelado.com.co', 'Colombia123', 3, 9),
    ('MARIA JOSE VARELA DUQUE', 'maria24', 'mvarela@cremhelado.com.co', 'Colombia123', 5, 10),
    ('GLORIA CAROLINA ABADIA OLIVA', 'gloria25', 'gcabadia@cremhelado.com.co', 'Colombia123', 5, 11),
    ('MARGARITA VALLEJO COMBARIZA', 'margarita26', 'mvallejo@cremhelado.com.co', 'Colombia123', 5, 12),
    ('CAROLINA ROJAS BOLIVAR', 'carolina27', 'crojas@cremhelado.com.co', 'Colombia123', 5, 13),
    ('PAOLA ANDREA TURRIAGO DUARTE', 'paola28', 'pturriago@cremhelado.com.co', 'Colombia123', 5, 14),
    ('LILIANA VILLAMIZAR VILLAMIL', 'liliana29', 'Lvillamizar@cremhelado.com.co', 'Colombia123', 5, 1),
    ('FREDDY GIOVANNI VIVAS MORA', 'freddy30', 'fgvivas@cremhelado.com.co', 'Colombia123', 2, 2),
    ('JOHN EDISSON HERRERA GARCIA', 'john31', 'jeherrera@cremhelado.com.co', 'Colombia123', 2, 3),
    ('SONIA ELIZABETH BUITRAGO MATALLANA', 'sonia32', 'sbuitrago@cremhelado.com.co', 'Colombia123', 2, 4),
    ('JULIO GONZALO ZAPATA QUEVEDO', 'julio33', 'jzapata@cremhelado.com.co', 'Colombia123', 2, 5),
    ('ANA MARIA POSADA RUIZ', 'ana34', 'amposada@cremhelado.com.co', 'Colombia123', 2, 6),
    ('ADRIANA GUTIERREZ RAMIREZ', 'adriana35', 'agutierrez@cremhelado.com.co', 'Colombia123', 4, 7),
    ('ANDRES FELIPE ROBAYO TORRES', 'andres36', 'afrobayo@cremhelado.com.co', 'Colombia123', 4, 8),
    ('ALEJANDRA MARIA BELTRAN URIBE', 'alejandra37', 'ambeltran@cremhelado.com.co', 'Colombia123', 4, 9),
    ('LINA MARIA ARANGO GONZALEZ', 'lina38', 'Lmarango@cremhelado.com.co', 'Colombia123', 1, 10),
    ('JUAN CARLOS RAMIREZ TARAZONA', 'juan39', 'jcramirez@cremhelado.com.co', 'Colombia123', 1, 11),
    ('ANDRES ORLANDO GAMBA PALOMINO', 'andres40', 'aogamba@cremhelado.com.co', 'Colombia123', 1, 12),
    ('ANDRES TORRES VALENCIA', 'andres41', 'atvalencia@cremhelado.com.co', 'Colombia123', 1, 13),
    ('BEYBA DEYANIRA ROMERO GARZON', 'beyba42', 'bromero@cremhelado.com.co', 'Colombia123', 1, 14),
    ('JAIME ALBERTO MUÑOZ BUSTAMANTE', 'jaime43', 'jamunoz@cremhelado.com.co', 'Colombia123', 1, 1),
    ('JAIME ANDRES MENDEZ VILLAMIZAR', 'jaime44', 'jamendez@cremhelado.com.co', 'Colombia123', 1, 2),
    ('ANA MARIA RAMON TELLO', 'ana45', 'amramon@cremhelado.com.co', 'Colombia123', 1, 3),
    ('MARY ALEXANDRA RAMIREZ GOMEZ', 'mary46', 'maramirez@cremhelado.com.co', 'Colombia123', 1, 4),
    ('JOSE ANGEL SOLANO BRITO', 'jose47', 'jasolano@cremhelado.com.co', 'Colombia123', 1, 5);


INSERT INTO retos (titulo, descripcion, fecha_inicio, fecha_fin, estado, id_sede) VALUES
('Reto de Innovación en Marketing', 'Crear una estrategia de marketing innovadora para la región.', '2024-01-10 08:00:00', '2024-01-20 18:00:00', 'activo', 1),
('Reto de Sostenibilidad', 'Implementar medidas sostenibles en la planta de producción.', '2024-02-01 09:00:00', '2024-02-15 17:00:00', 'activo', 2),
('Optimización de Procesos', 'Reducir tiempos en la cadena logística.', '2024-03-05 08:00:00', '2024-03-25 17:00:00', 'inactivo', 3),
('Reto de Nuevos Productos', 'Desarrollar tres nuevos sabores de helados.', '2024-04-10 09:00:00', '2024-04-30 16:00:00', 'activo', 4),
('Reducción de Desperdicios', 'Propuesta para reducir los desperdicios en un 15%.', '2024-05-01 08:30:00', '2024-05-15 18:00:00', 'activo', 5),
('Mejora de Experiencia del Cliente', 'Implementar un nuevo canal de atención al cliente.', '2024-06-01 10:00:00', '2024-06-30 18:00:00', 'activo', 6),
('Automatización de Procesos', 'Automatizar tareas repetitivas en la planta.', '2024-07-01 09:00:00', '2024-07-15 17:00:00', 'inactivo', 7),
('Expansión Internacional', 'Abrir operaciones en nuevos mercados internacionales.', '2024-08-01 08:00:00', '2024-08-20 17:00:00', 'activo', 8),
('Integración Tecnológica', 'Implementar un sistema ERP en todas las sedes.', '2024-09-10 09:00:00', '2024-09-30 18:00:00', 'activo', 9),
('Innovación en Productos', 'Crear una nueva línea de productos veganos.', '2024-10-05 09:30:00', '2024-10-25 17:00:00', 'activo', 10),
('Optimización de Recursos', 'Reducir los costos de producción en un 10%.', '2024-11-01 08:00:00', '2024-11-15 17:00:00', 'activo', 11),
('Reto de Responsabilidad Social', 'Lanzar una campaña en colaboración con ONGs.', '2024-12-01 10:00:00', '2024-12-20 18:00:00', 'activo', 12),
('Transformación Digital', 'Digitalizar todos los procesos de ventas y logística.', '2024-01-05 08:00:00', '2024-01-25 17:00:00', 'activo', 13),
('Innovación en Mercadeo', 'Crear campañas de marketing basadas en inteligencia artificial.', '2024-02-01 09:00:00', '2024-02-28 17:00:00', 'activo', 14);


--INSERTAR VALORES A LOS CARGOS --PALABRAS CLAVE
INSERT INTO cargos (nombre, descripcion_cargo, palabras_clave)
VALUES 
-- Jefe de Almacenes
('Jefe de Almacenes', 
 'Responsable de gestionar y optimizar las operaciones de almacenamiento de productos helados y materias primas, garantizando condiciones óptimas de temperatura y manipulación. Supervisa el correcto funcionamiento de cámaras frigoríficas, gestiona el sistema de rotación de productos y coordina la organización eficiente de inventarios de helados y materiales.', 
 ARRAY['Inventario', 'Almacenamiento', 'Distribución', 'Logística', 'Control de stock', 'Abastecimiento', 'Cuartos fríos', 'Rotación de productos', 'Control de fechas', 'Congelación', 'Bodegaje', 'Entrada y salida', 'Carga y descarga', 'Recepción de productos', 'Despacho', 'Neveras', 'Conservación', 'Temperatura', 'Almacén frío', 'Organización de bodega', 'Control de vencimientos']),

-- Jefe de Sostenibilidad y Mejoramiento
('Jefe de Sostenibilidad y Mejoramiento', 
 'Lidera iniciativas para hacer más sostenible la producción y distribución de helados, implementando prácticas amigables con el medio ambiente y optimizando el uso de recursos. Desarrolla estrategias para reducir el consumo de energía en sistemas de refrigeración, gestiona proyectos de reducción de desperdicios y coordina iniciativas de reciclaje en la cadena de producción de helados.', 
 ARRAY['Sostenibilidad', 'Mejora continua', 'Eficiencia', 'Medio ambiente', 'Optimización', 'Reducción de residuos', 'Ahorro de energía', 'Reciclaje', 'Ahorro de agua', 'Desperdicios', 'Energía limpia', 'Cuidado ambiental', 'Reutilización', 'Consumo responsable', 'Impacto ambiental', 'Aprovechamiento', 'Mejoras', 'Limpieza', 'Orden', 'Desarrollo sostenible', 'Gestión ambiental']),

-- Jefe de Aseguramiento de la Calidad
('Jefe de Aseguramiento de la Calidad', 
 'Garantiza que todos los productos helados cumplan con los estándares de calidad e higiene alimentaria. Supervisa los análisis de laboratorio, verifica la calidad de materias primas, y asegura el cumplimiento de normas sanitarias en toda la cadena de producción. Implementa y mantiene sistemas de seguridad alimentaria específicos para la industria de helados.', 
 ARRAY['Calidad', 'Inspección', 'Control de calidad', 'Normativa', 'Procesos', 'Estandarización', 'Auditoría', 'Higiene', 'Limpieza', 'Seguridad alimentaria', 'Análisis de muestras', 'Control de sabor', 'Fechas de vencimiento', 'Normas de calidad', 'Laboratorio', 'Pruebas', 'Muestras', 'Control de materiales', 'Revisión', 'Verificación', 'Sanidad', 'Control de temperatura']),

-- Jefe de Gestión de Calidad
('Jefe de Gestión de Calidad', 
 'Desarrolla e implementa el sistema general de calidad para la producción de helados. Establece normas y procedimientos para asegurar la consistencia del producto, maneja la documentación de calidad y lidera proyectos de mejora continua en los procesos de fabricación de helados.', 
 ARRAY['Calidad', 'Gestión de procesos', 'Control de calidad', 'Mejora de calidad', 'Estándares', 'Cumplimiento', 'Documentación', 'Procedimientos', 'Normas', 'Mejoras', 'Supervisión', 'Control de procesos', 'Registros', 'Medición', 'Seguimiento', 'Evaluación', 'Revisión', 'Capacitación', 'Instrucciones', 'Manuales', 'Reportes']),

-- Jefe de Ingeniería Industrial
('Jefe de Ingeniería Industrial', 
 'Optimiza los procesos de producción de helados mediante la aplicación de principios de ingeniería. Diseña y mejora las líneas de producción, implementa sistemas automáticos, y desarrolla soluciones para aumentar la eficiencia en la fabricación de diferentes variedades de helados.', 
 ARRAY['Ingeniería', 'Optimización', 'Eficiencia', 'Procesos', 'Productividad', 'Automatización', 'Innovación', 'Mejora de procesos', 'Producción', 'Tiempos y movimientos', 'Línea de producción', 'Maquinaria', 'Rendimiento', 'Medición', 'Control de producción', 'Velocidad', 'Capacidad', 'Distribución de planta', 'Mejoras técnicas', 'Desperdicios', 'Métodos de trabajo', 'Control de operaciones']),

-- Director de Logística
('Director de Logística', 
 'Dirige la estrategia de distribución y transporte de la empresa de helados, asegurando la eficiente entrega de productos congelados. Gestiona la cadena de frío, optimiza rutas de reparto y coordina la red de distribución para garantizar la calidad del producto hasta el punto de venta.', 
 ARRAY['Logística', 'Transporte', 'Distribución', 'Cadena de suministro', 'Planificación', 'Abastecimiento', 'Inventario', 'Reparto', 'Rutas', 'Entregas', 'Camiones refrigerados', 'Cadena de frío', 'Almacenes', 'Bodegas', 'Despachos', 'Pedidos', 'Programación', 'Control de envíos', 'Recepción', 'Distribución local', 'Carga', 'Descarga']),

-- Jefe de Mantenimiento Industrial
('Jefe de Mantenimiento Industrial', 
 'Asegura el funcionamiento óptimo de equipos y maquinaria especializada en la producción de helados. Gestiona el mantenimiento de sistemas de refrigeración, pasteurización y congelación, implementando programas de mantenimiento preventivo y correctivo para garantizar la continuidad operativa.', 
 ARRAY['Mantenimiento', 'Maquinaria', 'Reparación', 'Industrial', 'Operatividad', 'Preventivo', 'Correctivo', 'Equipos', 'Reparaciones', 'Revisiones', 'Refrigeración', 'Máquinas', 'Herramientas', 'Repuestos', 'Ajustes', 'Instalaciones', 'Sistemas eléctricos', 'Programación', 'Mecánica', 'Fallas', 'Revisión técnica', 'Funcionamiento']),

-- Director(a) de Ingeniería y Mantenimiento Red de Frío
('Director(a) de Ingeniería y Mantenimiento Red de Frío', 
 'Lidera la gestión técnica de los sistemas de refrigeración para garantizar la conservación óptima de los helados en toda la cadena de distribución. Diseña e implementa soluciones técnicas para sistemas de frío, supervisa el mantenimiento de equipos de refrigeración y desarrolla estrategias para optimizar el consumo de energía.', 
 ARRAY['Refrigeración', 'Mantenimiento', 'Ingeniería', 'Red de frío', 'Temperatura controlada', 'Eficiencia', 'Congelación', 'Neveras', 'Cuartos fríos', 'Control de frío', 'Equipos de refrigeración', 'Temperatura', 'Cadena de frío', 'Sistemas de frío', 'Mantenimiento preventivo', 'Consumo de energía', 'Reparaciones', 'Instalaciones', 'Congeladores', 'Enfriamiento', 'Conservación']),

-- Jefe de Operaciones
('Jefe de Operaciones', 
 'Supervisa y coordina todas las operaciones de producción de helados, desde la recepción de materias primas hasta el producto terminado. Gestiona los procesos de fabricación, coordina equipos de trabajo y asegura el cumplimiento de metas de producción manteniendo los estándares de calidad.', 
 ARRAY['Operaciones', 'Eficiencia', 'Producción', 'Optimización', 'Gestión de recursos', 'Planificación', 'Ejecución', 'Fabricación', 'Control de producción', 'Supervisión', 'Metas', 'Personal', 'Turnos', 'Materiales', 'Desperdicios', 'Rendimiento', 'Productividad', 'Coordinación', 'Organización', 'Procesos', 'Control', 'Resultados']),

-- Jefe de Operaciones Logísticas
('Jefe de Operaciones Logísticas', 
 'Gestiona las operaciones diarias de distribución y almacenamiento de la empresa de helados, asegurando la correcta entrega y almacenaje de productos congelados. Supervisa la cadena de frío, coordina las operaciones de bodega y optimiza los procesos de reparto para mantener la calidad del producto.', 
 ARRAY['Logística', 'Distribución', 'Transporte', 'Cadena de suministro', 'Gestión de inventarios', 'Eficiencia', 'Entregas', 'Almacenamiento', 'Bodega', 'Despacho', 'Control de envíos', 'Rutas de reparto', 'Transporte refrigerado', 'Control de temperatura', 'Recepción', 'Inventarios', 'Pedidos', 'Devoluciones', 'Carga', 'Descarga', 'Programación']);


INSERT INTO cargos (nombre, descripcion_cargo, palabras_clave)
VALUES 
-- Jefe de Planeación y Abastecimiento
('Jefe de Planeación y Abastecimiento', 
 'Responsable de planificar y asegurar el suministro continuo de materias primas y materiales necesarios para la producción de helados. Coordina con proveedores, gestiona inventarios y programa la producción según la demanda, asegurando que no falten insumos como leche, frutas, azúcares, empaques y demás materiales necesarios para la fabricación.', 
 ARRAY['Planeación', 'Abastecimiento', 'Inventario', 'Demanda', 'Programación', 'Logística', 'Control de stock', 'Compras', 'Proveedores', 'Suministros', 'Materias primas', 'Existencias', 'Pedidos', 'Almacén', 'Insumos', 'Materiales', 'Requerimientos', 'Entregas', 'Cantidades', 'Stock', 'Necesidades', 'Previsión']),

-- Director de Planta
('Director de Planta', 
 'Dirige y coordina todas las operaciones de la planta de producción de helados, asegurando el cumplimiento de metas de fabricación, calidad y eficiencia. Supervisa los procesos de elaboración, desde la preparación de mezclas hasta el empaque final, garantizando el uso óptimo de recursos y el cumplimiento de estándares de calidad.', 
 ARRAY['Planta', 'Producción', 'Eficiencia', 'Supervisión', 'Operaciones', 'Gestión', 'Rendimiento', 'Fábrica', 'Elaboración', 'Personal', 'Maquinaria', 'Manufactura', 'Control', 'Calidad', 'Procesos', 'Resultados', 'Productividad', 'Coordinación', 'Metas', 'Organización', 'Dirección', 'Supervisión']),

-- Jefe de Producción
('Jefe de Producción', 
 'Supervisa directamente la elaboración de helados, controlando los procesos de mezclado, pasteurización, congelación y empaque. Asegura que la producción cumpla con las recetas establecidas, los estándares de calidad y las metas de producción diarias.', 
 ARRAY['Producción', 'Eficiencia', 'Gestión de procesos', 'Optimización', 'Calidad', 'Supervisión', 'Fabricación', 'Elaboración', 'Mezclas', 'Sabores', 'Recetas', 'Control', 'Turnos', 'Líneas', 'Empaque', 'Rendimiento', 'Proceso', 'Metas', 'Cantidades', 'Operarios', 'Maquinaria']),

-- Director Servicios Integrales al Colaborador
('Director Servicios Integrales al Colaborador', 
 'Gestiona los programas de bienestar y desarrollo para los empleados de la empresa de helados, asegurando un ambiente laboral positivo. Coordina servicios de apoyo, programas de capacitación y actividades que mejoren la calidad de vida laboral, considerando las necesidades específicas del trabajo en ambientes fríos y turnos de producción.', 
 ARRAY['Bienestar', 'Servicios al empleado', 'Soporte', 'Satisfacción', 'Capacitación', 'Desarrollo personal', 'Personal', 'Trabajadores', 'Apoyo', 'Beneficios', 'Ayudas', 'Formación', 'Clima laboral', 'Motivación', 'Atención', 'Desarrollo', 'Crecimiento', 'Aprendizaje', 'Ambiente laboral', 'Necesidades', 'Recursos humanos']),

-- Jefe de Seguridad y Salud en el Trabajo
('Jefe de Seguridad y Salud en el Trabajo', 
 'Asegura la seguridad y salud de los trabajadores en la planta de helados, con especial atención a los riesgos asociados con trabajo en frío, manipulación de alimentos y operación de maquinaria de congelación. Desarrolla protocolos de seguridad y programas de prevención específicos para la industria.', 
 ARRAY['Seguridad', 'Salud', 'Prevención', 'Riesgos', 'Protocolos', 'Bienestar', 'Protección', 'Cumplimiento', 'Accidentes', 'Emergencias', 'Elementos de protección', 'Seguridad industrial', 'Normas', 'Cuidado', 'Prevención', 'Salud ocupacional', 'Brigadas', 'Capacitación', 'Señalización', 'Primeros auxilios', 'Simulacros', 'Inspecciones', 'Peligros']),

-- Jefe de Costos
('Jefe de Costos', 
 'Analiza y controla los costos de producción de helados, desde materias primas hasta empaque final. Determina los costos por producto, evalúa la rentabilidad de diferentes líneas de helados y busca oportunidades de optimización de gastos en la producción y distribución.', 
 ARRAY['Costos', 'Análisis financiero', 'Presupuesto', 'Control de gastos', 'Rentabilidad', 'Optimización financiera', 'Gastos', 'Precios', 'Materiales', 'Producción', 'Consumos', 'Pérdidas', 'Ganancias', 'Informes', 'Ahorros', 'Cálculos', 'Medición', 'Valores', 'Eficiencia', 'Resultados', 'Inversión']),

-- Jefe de Planeación Financiera
('Jefe de Planeación Financiera', 
 'Desarrolla y supervisa la planificación financiera de la empresa de helados, realizando proyecciones de ventas, costos y rentabilidad. Analiza tendencias estacionales en el consumo de helados, planifica inversiones y establece presupuestos para diferentes áreas de la compañía.', 
 ARRAY['Planeación', 'Finanzas', 'Proyecciones', 'Presupuesto', 'Análisis financiero', 'Inversión', 'Control', 'Dinero', 'Recursos', 'Estimaciones', 'Flujo de caja', 'Predicciones', 'Ingresos', 'Gastos', 'Resultados', 'Rentabilidad', 'Números', 'Cuentas', 'Indicadores', 'Metas', 'Crecimiento', 'Planificación']),

-- Jefe de Servicios Financieros
('Jefe de Servicios Financieros', 
 'Gestiona los servicios financieros de la empresa, incluyendo facturación a clientes, manejo de créditos para distribuidores de helados y relaciones con entidades financieras. Supervisa los procesos de cobro y establece políticas de crédito para la red de distribución.', 
 ARRAY['Servicios financieros', 'Crédito', 'Financiamiento', 'Facturación', 'Gestión financiera', 'Análisis', 'Cobros', 'Pagos', 'Cuentas', 'Bancos', 'Deudas', 'Cartera', 'Clientes', 'Facturas', 'Ventas', 'Ingresos', 'Contabilidad', 'Documentos', 'Transacciones', 'Movimientos', 'Control']),

-- Jefe de Tecnología de Información
('Jefe de Tecnología de Información', 
 'Gestiona los sistemas y tecnologías de información que apoyan la producción y distribución de helados. Supervisa sistemas de control de temperatura, seguimiento de inventarios, aplicaciones de ventas y programas de gestión, asegurando su correcto funcionamiento y actualización.', 
 ARRAY['Tecnología', 'Sistemas', 'Infraestructura', 'Soporte técnico', 'Innovación', 'Digitalización', 'Seguridad', 'Computadores', 'Programas', 'Redes', 'Internet', 'Aplicaciones', 'Equipos', 'Mantenimiento', 'Software', 'Base de datos', 'Usuarios', 'Conexiones', 'Respaldos', 'Actualizaciones', 'Comunicaciones', 'Soporte']),

-- Jefe(a) de Gestión de Proyectos
('Jefe(a) de Gestión de Proyectos', 
 'Lidera y coordina los proyectos de mejora y expansión en la empresa de helados, desde la implementación de nuevas líneas de producción hasta proyectos de innovación en productos y procesos. Gestiona tiempos, recursos y equipos para alcanzar los objetivos establecidos.', 
 ARRAY['Proyectos', 'Gestión', 'Planificación', 'Coordinación', 'Recursos', 'Ejecución', 'Monitoreo', 'Mejoras', 'Desarrollo', 'Implementación', 'Seguimiento', 'Planeación', 'Organización', 'Avances', 'Resultados', 'Control', 'Tiempos', 'Actividades', 'Tareas', 'Cronograma', 'Equipo', 'Objetivos']);

INSERT INTO cargos (nombre, descripcion_cargo, palabras_clave)
VALUES 
-- Director de Categoría
('Director de Categoría', 
 'Responsable de gestionar y desarrollar las diferentes líneas de helados de la empresa, desde helados premium hasta básicos. Analiza tendencias del mercado de helados, define estrategias de posicionamiento por categoría, y toma decisiones sobre el portafolio de productos. Supervisa el rendimiento de cada categoría y propone mejoras para maximizar la rentabilidad.', 
 ARRAY['Categoría', 'Producto', 'Mercado', 'Estrategia', 'Análisis de mercado', 'Desarrollo de producto', 'Ventas', 'Portafolio', 'Sabores', 'Consumo', 'Tendencias', 'Rentabilidad', 'Precios', 'Competencia', 'Temporada', 'Impulso', 'Neveras', 'Congeladores']),

-- Jefe de Desarrollo Nuevos Productos
('Jefe de Desarrollo Nuevos Productos', 
 'Lidera el proceso de creación y desarrollo de nuevos helados y postres congelados. Coordina la investigación de sabores, texturas y presentaciones innovadoras. Supervisa pruebas de producto, evalúa la viabilidad técnica y comercial de nuevas propuestas, y gestiona el proceso desde la idea hasta el lanzamiento al mercado.', 
 ARRAY['Innovación', 'Desarrollo', 'Producto', 'Mercado', 'Investigación', 'Mejora', 'Lanzamiento', 'Sabores', 'Ingredientes', 'Recetas', 'Texturas', 'Coberturas', 'Formulación', 'Pruebas', 'Degustación', 'Temperatura', 'Conservación', 'Empaque']),

-- Director de Desarrollo de Clientes
('Director de Desarrollo de Clientes', 
 'Responsable de identificar y desarrollar oportunidades de negocio con clientes clave en el mercado de helados. Gestiona relaciones con cadenas de heladerías, supermercados y distribuidores importantes. Desarrolla estrategias para aumentar la presencia de marca y mejorar la satisfacción del cliente.', 
 ARRAY['Clientes', 'Relaciones', 'Satisfacción', 'Estrategia', 'Crecimiento', 'Fidelización', 'Ventas', 'Distribución', 'Alianzas', 'Negociación', 'Servicio', 'Atención', 'Expansión', 'Cobertura', 'Pedidos', 'Abastecimiento', 'Cartera']),

-- Jefe de Activos Comerciales
('Jefe de Activos Comerciales', 
 'Gestiona y optimiza los equipos de refrigeración y congelación (neveras, congeladores, vitrinas) utilizados en puntos de venta. Supervisa el inventario de activos, su mantenimiento y distribución estratégica para maximizar la presencia de marca y conservación adecuada de los helados.', 
 ARRAY['Activos', 'Comerciales', 'Inventario', 'Optimización', 'Gestión', 'Control de stock', 'Refrigeración', 'Congelación', 'Mantenimiento', 'Equipos', 'Neveras', 'Vitrinas', 'Exhibición', 'Conservación', 'Distribución', 'Reparación', 'Instalación']),

-- Jefe de Trade Marketing
('Jefe de Trade Marketing', 
 'Desarrolla y ejecuta estrategias para maximizar la visibilidad y venta de helados en los puntos de venta. Diseña promociones estacionales, gestiona la imagen de marca en heladerías y puntos de venta, y coordina actividades de impulso y degustación.', 
 ARRAY['Marketing', 'Promociones', 'Ventas', 'Punto de venta', 'Estrategia', 'Consumidores', 'Merchandising', 'Exhibición', 'Impulso', 'Temporada', 'Publicidad', 'Descuentos', 'Degustación', 'Vitrina', 'Heladería', 'Visibilidad', 'Material publicitario']),

-- Jefe de Ventas Canal Alternativo
('Jefe de Ventas Canal Alternativo', 
 'Gestiona las ventas en canales no tradicionales como parques de diversiones, cines, estadios y eventos especiales. Desarrolla estrategias específicas para estos espacios de consumo de helados y establece alianzas estratégicas para ampliar la presencia de marca.', 
 ARRAY['Ventas', 'Canal alternativo', 'Estrategias de ventas', 'Clientes', 'Productos', 'Crecimiento', 'Eventos', 'Entretenimiento', 'Ocio', 'Parques', 'Cines', 'Estadios', 'Alianzas', 'Convenios', 'Patrocinio', 'Temporada', 'Consumo inmediato']),

-- Jefe de Ventas Canal CET
('Jefe de Ventas Canal CET', 
 'Dirige las ventas en Cadenas, Estaciones de servicio y Tiendas de conveniencia. Desarrolla estrategias específicas para estos puntos de venta, gestionando el abastecimiento y la exhibición de helados en espacios de compra por impulso.', 
 ARRAY['Ventas', 'CET', 'Clientes', 'Estrategias de ventas', 'Crecimiento', 'Fidelización', 'Cadenas', 'Estaciones', 'Tiendas', 'Conveniencia', 'Impulso', 'Neveras', 'Abastecimiento', 'Exhibición', 'Rotación', 'Distribución', 'Almacenamiento']),

-- Jefe de Ventas Canal Droguerías y GC
('Jefe de Ventas Canal Droguerías y GC', 
 'Responsable de las ventas en droguerías y establecimientos de gran consumo. Gestiona la presencia de helados en estos canales, desarrollando estrategias específicas para la venta de productos en formatos familiares y multipacks.', 
 ARRAY['Ventas', 'Droguerías', 'Gran consumo', 'Estrategia', 'Clientes', 'Productos', 'Supermercados', 'Autoservicios', 'Almacenes', 'Mayoristas', 'Distribución', 'Abastecimiento', 'Multipack', 'Familiar', 'Promociones', 'Exhibición', 'Refrigeración']),

-- Jefe de Ventas Canal Institucional
('Jefe de Ventas Canal Institucional', 
 'Maneja las ventas a instituciones como colegios, universidades, empresas y hoteles. Desarrolla propuestas específicas para cada tipo de institución, gestionando productos y presentaciones adaptadas a comedores, cafeterías y eventos institucionales.', 
 ARRAY['Ventas', 'Institucional', 'Clientes', 'Estrategia', 'Fidelización', 'Productos', 'Colegios', 'Universidades', 'Empresas', 'Hoteles', 'Cafeterías', 'Comedores', 'Eventos', 'Catering', 'Postres', 'Provisión', 'Contratos']),

-- Jefe(a) de Ventas Canal Tradicional
('Jefe(a) de Ventas Canal Tradicional', 
 'Gestiona las ventas en tiendas de barrio, heladerías pequeñas y puntos de venta. Desarrolla estrategias para mantener y crecer la presencia de marca en el canal más cercano al consumidor final, manejando relaciones con pequeños comerciantes.', 
 ARRAY['Ventas', 'Tradicional', 'Estrategia', 'Clientes', 'Productos', 'Relaciones', 'Tiendas', 'Heladerías', 'Comerciantes', 'Barrio', 'Impulso', 'Neveras', 'Surtido', 'Distribución', 'Abastecimiento', 'Microempresarios', 'Familias']);
