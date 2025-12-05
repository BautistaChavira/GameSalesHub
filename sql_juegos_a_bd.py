import csv

# Archivo de entrada
csv_file = "steam_top_games.csv"

# Archivo de salida
sql_file = "insert_games.sql"

inserts = []

with open(csv_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        title = row["title"].replace("'", "''").strip()  # escapar comillas simples
        price_final = row["price_final"]
        on_sale = "true" if price_final and price_final not in ("", "0") else "false"

        inserts.append(
            f"INSERT INTO games (title, on_sale) VALUES ('{title}', {on_sale}) "
            f"ON CONFLICT (title) DO NOTHING;"
        )

with open(sql_file, "w", encoding="utf-8") as f:
    f.write("\n".join(inserts))

print(f"✅ Archivo {sql_file} generado con {len(inserts)} juegos.")