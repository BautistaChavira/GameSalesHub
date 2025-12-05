import csv

# Ruta al archivo CSV
csv_file = "steam_top_games.csv"

# Set para evitar duplicados
genres_set = set()

# Leer el CSV
with open(csv_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        raw_genres = row["genres"]
        if raw_genres:
            # Quitar comillas y separar por coma
            for g in raw_genres.replace('"', "").split(","):
                g = g.strip()
                if g:
                    genres_set.add(g)

# Generar los INSERTS
inserts = [
    f"INSERT INTO genres (name) VALUES ('{g}') ON CONFLICT (name) DO NOTHING;"
    for g in sorted(genres_set)
]

# Guardar en archivo SQL
with open("insert_genres.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(inserts))

print("Archivo insert_genres.sql generado con", len(genres_set), "géneros únicos.")