import requests
import csv
import time

# Paso 1: obtener juegos más populares desde SteamSpy
# Puedes ajustar 'request=top100in2weeks' o 'top100forever'
steamspy_url = "https://steamspy.com/api.php?request=top100in2weeks"
popular_games = requests.get(steamspy_url).json()

# Paso 2: preparar archivo CSV
with open("steam_top_games.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["app_id", "title", "genres", "price_initial", "price_final", "discount_percent", "currency"])

    # Paso 3: iterar sobre los primeros 200–500 juegos
    count = 0
    for app_id, game in popular_games.items():
        if count >= 500:  # cambia a 500 si quieres más
            break

        details_url = f"https://store.steampowered.com/api/appdetails?appids={app_id}"
        try:
            resp = requests.get(details_url).json()
            if not resp[str(app_id)]["success"]:
                continue

            data = resp[str(app_id)]["data"]
            title = data.get("name", "")
            genres = ", ".join([g["description"] for g in data.get("genres", [])]) if "genres" in data else ""
            price = data.get("price_overview", {})

            writer.writerow([
                app_id,
                title,
                genres,
                price.get("initial"),
                price.get("final"),
                price.get("discount_percent"),
                price.get("currency")
            ])

            count += 1
            time.sleep(0.2)  # evitar saturar la API
        except Exception as e:
            print(f"Error con app {app_id}: {e}")