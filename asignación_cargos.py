
import spacy
import psycopg2
import logging
from typing import List, Dict, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# Inicializar FastAPI y spaCy
app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

nlp = spacy.load("es_core_news_sm")

# Configurar logging para ver el flujo y datos procesados
logging.basicConfig(level=logging.INFO)

# Configuración de conexión a la base de datos
def conectar_base_datos():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="Innovacion",
            user="postgres",
            password="nueva_contraseña"
        )
        return conn
    except Exception as e:
        logging.error(f"Error de conexión a la base de datos: {e}")
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

# Modelo de entrada para FastAPI
class Reto(BaseModel):
    descripcion: str
    solucion: Optional[str] = None

# Función para obtener palabras clave de los cargos desde la base de datos
def obtener_palabras_clave_cargos():
    conn = conectar_base_datos()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT nombre, palabras_clave FROM cargos")
        cargos = cursor.fetchall()
        # Convertimos cada palabra clave a minúsculas y eliminamos espacios en cada palabra clave.
        cargos_dict = {
            cargo[0]: [palabra.strip().lower() for palabra in cargo[1]]  # Eliminamos split
            for cargo in cargos
        }
        logging.info(f"Cargos obtenidos de la base de datos: {cargos_dict}")
        return cargos_dict
    except Exception as e:
        logging.error(f"Error al obtener palabras clave de cargos: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener datos de la base de datos")
    finally:
        cursor.close()
        conn.close()

# Extraer palabras clave del texto utilizando lematización y normalización
def extraer_palabras_clave(texto):
    doc = nlp(texto.lower())
    palabras_clave = [token.lemma_ for token in doc if token.pos_ in ("NOUN", "ADJ")]
    logging.info(f"Palabras clave extraídas del texto '{texto}': {palabras_clave}")
    return palabras_clave

# Calcular la similitud de palabras clave mediante intersección de conjuntos
def calcular_porcentaje_similitud(palabras_clave_texto, palabras_clave_cargo):
    # Convertir a conjuntos para encontrar intersección
    coincidencias = set(palabras_clave_texto) & set(palabras_clave_cargo)
    total_palabras = len(palabras_clave_texto)
    porcentaje = (len(coincidencias) / total_palabras) * 100 if total_palabras > 0 else 0
    logging.info(f"Porcentaje de similitud calculado: {porcentaje}% - Texto: {palabras_clave_texto} - Cargo: {palabras_clave_cargo}")
    return porcentaje

# Procesar los cargos más adecuados con una métrica de similitud
def obtener_cargos_mas_adecuados(texto):
    palabras_clave_texto = extraer_palabras_clave(texto)
    cargos_palabras = obtener_palabras_clave_cargos()
    resultados = []

    for cargo, palabras_clave_cargo in cargos_palabras.items():
        porcentaje = calcular_porcentaje_similitud(palabras_clave_texto, palabras_clave_cargo)
        resultados.append((cargo, porcentaje))

    # Ordenar resultados por porcentaje de coincidencia de mayor a menor
    resultados_ordenados = sorted(resultados, key=lambda x: x[1], reverse=True)
    logging.info(f"Resultados de cargos más adecuados: {resultados_ordenados}")
    return resultados_ordenados[:3] if resultados_ordenados and resultados_ordenados[0][1] > 0 else []

# Endpoint para analizar las palabras clave
@app.post("/api/analizar_reto")
async def analizar_reto(reto: Reto):
    try:
        logging.info(f"Análisis del reto recibido - Descripción: {reto.descripcion}, Solución: {reto.solucion}")
        resultado_descripcion = obtener_cargos_mas_adecuados(reto.descripcion)
        resultado_solucion = obtener_cargos_mas_adecuados(reto.solucion) if reto.solucion else []

        return {
            "resultado_descripcion": resultado_descripcion,
            "resultado_solucion": resultado_solucion
        }
    except Exception as e:
        logging.error(f"Error al analizar el reto: {e}")
        raise HTTPException(status_code=500, detail=f"Error al analizar el reto: {str(e)}")

# Nuevo endpoint para obtener la descripción de un cargo
@app.get("/api/descripcion-cargo")
async def obtener_descripcion_cargo(cargo: str):
    conn = conectar_base_datos()
    cursor = conn.cursor()
    try:
        # Consultar la descripción del cargo en la base de datos
        cursor.execute("SELECT descripcion_cargo FROM cargos WHERE nombre = %s", (cargo,))
        resultado = cursor.fetchone()
        if resultado:
            descripcion = resultado[0]
            return {"descripcion": descripcion}
        else:
            raise HTTPException(status_code=404, detail="Descripción no encontrada")
    except Exception as e:
        logging.error(f"Error al obtener la descripción del cargo: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener la descripción del cargo")
    finally:
        cursor.close()
        conn.close()

# Nuevo endpoint para obtener todos los nombres de los cargos
@app.get("/api/cargos")
async def obtener_todos_los_cargos():
    conn = conectar_base_datos()
    cursor = conn.cursor()
    try:
        # Consultar todos los nombres de los cargos en la base de datos
        cursor.execute("SELECT nombre FROM cargos")
        resultados = cursor.fetchall()
        # Convertir resultados en una lista de strings
        nombres_cargos = [resultado[0] for resultado in resultados]
        return {"cargos": nombres_cargos}
    except Exception as e:
        logging.error(f"Error al obtener los nombres de los cargos: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener los nombres de los cargos")
    finally:
        cursor.close()
        conn.close()

# Endpoint para obtener todos los clientes internos asociados a un cargo específico
@app.get("/api/clientes-internos-por-cargo")
async def obtener_clientes_internos_por_cargo(cargo: str):
    logging.info(f"Iniciando búsqueda de clientes internos para el cargo: {cargo}")
    conn = conectar_base_datos()
    cursor = conn.cursor()
    try:
        # Consulta mejorada con JOIN para obtener el ID del cliente interno
        query = """
        SELECT i.id_cliente, i.nombre_completo, s.nombre AS sede, i.correo
        FROM información_clientes_internos i
        JOIN sedes s ON i.sede = s.id
        WHERE i.id_cargo = (
            SELECT id_cargo FROM cargos WHERE nombre = %s
        )
        """
        cursor.execute(query, (cargo,))
        
        clientes = cursor.fetchall()

        if clientes:
            # Construir una lista de clientes internos con el nombre de la sede para enviar como respuesta
            clientes_internos = [
                {
                    "id_cliente": cliente[0],
                    "nombre_completo": cliente[1],
                    "sede": cliente[2],
                    "correo": cliente[3],
                }
                for cliente in clientes
            ]
            return clientes_internos
        else:
            raise HTTPException(status_code=404, detail="No se encontraron clientes internos para este cargo")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener los clientes internos por cargo")
    finally:
        cursor.close()
        conn.close()


@app.post("/api/crear-reto")
async def crear_reto(
    titulo: str = Form(...),
    descripcion: str = Form(...),
    beneficios: str = Form(...),
    solucion: str = Form(None),
    enlaceCanva: str = Form(None),
    idSede: int = Form(...),
    idUsuario: int = Form(...),
    idClienteInterno: int = Form(...),
    idPromotor: int = Form(None),
    archivo_pdf: UploadFile = File(None)
):
    logging.info(f"Iniciando creación de reto con datos: titulo={titulo}, descripcion={descripcion}, beneficios={beneficios}, "
                 f"solucion={solucion}, idSede={idSede}, idUsuario={idUsuario}, idClienteInterno={idClienteInterno}, idPromotor={idPromotor}")
    conn = conectar_base_datos()
    cursor = conn.cursor()

    try:
        tiene_solucion = bool(solucion and solucion.strip())
        logging.info(f"Tiene solución: {tiene_solucion}")

        # Leer el contenido del archivo si se envió
        archivo_pdf_content = await archivo_pdf.read() if archivo_pdf else None

        # Obtener la fecha de inicio (ahora) y fecha fin (1 mes después)
        fecha_inicio = datetime.now()
        fecha_fin = fecha_inicio.replace(month=fecha_inicio.month + 1) if fecha_inicio.month < 12 else fecha_inicio.replace(year=fecha_inicio.year + 1, month=1)

        # Obtener el id_area desde la tabla información_clientes_internos
        id_area_query = "SELECT id_area FROM información_clientes_internos WHERE id_cliente = %s;"
        logging.info(f"Ejecutando consulta para id_area: {id_area_query} con idClienteInterno={idClienteInterno}")
        cursor.execute(id_area_query, (idClienteInterno,))
        id_area = cursor.fetchone()
        
        if not id_area or id_area[0] is None:
            logging.warning(f"El cliente interno con id {idClienteInterno} no tiene un área asignada.")
            raise HTTPException(status_code=400, detail="El cliente interno no tiene un área asignada.")
        
        id_area = id_area[0]
        logging.info(f"Área obtenida para el cliente interno: {id_area}")

        # Insertar en la tabla de retos
        query = """
        INSERT INTO retos (
            titulo, descripcion, beneficios, solucion_propuesta, enlace_canva, archivo_pdf, 
            id_sede, id_usuario, id_cliente_interno, id_promotor, tiene_solucion, fecha_inicio, fecha_fin, id_area
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
        """
        logging.info("Ejecutando consulta de inserción del reto.")
        cursor.execute(query, (
            titulo, descripcion, beneficios,
            solucion if tiene_solucion else None,
            enlaceCanva, archivo_pdf_content, idSede, idUsuario, idClienteInterno,
            idPromotor if not tiene_solucion else None, tiene_solucion,
            fecha_inicio, fecha_fin, id_area
        ))
        id_reto = cursor.fetchone()[0]
        logging.info(f"Reto creado exitosamente con ID: {id_reto}")

        conn.commit()
        return {"message": "Reto creado exitosamente", "id_reto": id_reto}
    except Exception as e:
        conn.rollback()
        logging.error(f"Error al crear el reto: {e}")
        raise HTTPException(status_code=500, detail="Error al crear el reto")
    finally:
        cursor.close()
        conn.close()
