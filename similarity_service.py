from flask import Flask, request, jsonify
from flask_cors import CORS

from sentence_transformers import SentenceTransformer, util
import psycopg2
import os

app = Flask(__name__)
CORS(app)  # Habilita CORS para toda la aplicación

# Cargar el modelo para embeddings
model = SentenceTransformer('all-MiniLM-L6-v2')

# Configuración de la base de datos
DB_CONFIG = {
    'dbname': 'Innovacion',
    'user': 'postgres',
    'password': 'nueva_contraseña',
    'host': 'localhost',
    'port': '5432'
}

def get_existing_descriptions():
    """Conectar a la base de datos y obtener todas las descripciones de retos existentes."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT id, descripcion FROM retos")
        data = cursor.fetchall()
        conn.close()
        print(f"[Python Log] Número de descripciones obtenidas de la base de datos: {len(data)}")
        return data
    except Exception as e:
        print(f"[Python Log] Error al obtener descripciones de la base de datos: {e}")
        return []

@app.route('/similarity-check', methods=['POST'])
def similarity_check():
    # Obtener la descripción ingresada desde el request
    data = request.json
    new_description = data.get('descripcion', '')

    # Log para verificar la descripción recibida
    print(f"[Python Log] Descripción recibida para verificación de similitud: {new_description}")

    # Obtener las descripciones de la base de datos
    existing_descriptions = get_existing_descriptions()

    # Generar el embedding para la descripción nueva
    print(f"[Python Log] Generando embedding para la nueva descripción.")
    new_embedding = model.encode(new_description, convert_to_tensor=True)

    # Comparar la nueva descripción con cada una de las descripciones existentes
    highest_similarity = 0
    most_similar_reto = None

    for reto_id, description in existing_descriptions:
        # Generar embedding para la descripción existente
        print(f"[Python Log] Generando embedding para la descripción existente con ID {reto_id}.")
        existing_embedding = model.encode(description, convert_to_tensor=True)
        
        # Calcular la similitud
        similarity_score = util.pytorch_cos_sim(new_embedding, existing_embedding).item()
        print(f"[Python Log] Similitud con reto ID {reto_id}: {similarity_score * 100:.2f}%")

        if similarity_score > highest_similarity:
            highest_similarity = similarity_score
            most_similar_reto = {
                'id': reto_id,
                'descripcion': description,
                'similarity': highest_similarity * 100  # Convertir a porcentaje
            }

    # Log de la similitud más alta encontrada
    if most_similar_reto:
        print(f"[Python Log] Similitud más alta encontrada: {highest_similarity * 100:.2f}% con el reto ID {most_similar_reto['id']}")
    else:
        print("[Python Log] No se encontraron similitudes significativas.")

    return jsonify({
        'similarity': highest_similarity * 100,  # Porcentaje de similitud
        'most_similar_reto': most_similar_reto
    })

if __name__ == '__main__':
    print("[Python Log] Iniciando el servicio de similitud en http://0.0.0.0:5001")
    app.run(host='0.0.0.0', port=5001)
