import requests
import csv
import time

# Paso 1: obtener todos los juegos desde SteamSpy
steamspy_url = "https://steamspy.com/api.php?request=all"
print("📡 Consultando SteamSpy...")
all_games = requests.get(steamspy_url).json()
print(f"✅ Total juegos recibidos: {len(all_games)}")

# Paso 2: preparar archivo CSV
with open("steam_all_games.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["app_id", "title", "genres", "price_initial", "price_final", "discount_percent", "currency"])

    count = 0
    for app_id, game in all_games.items():
        details_url = f"https://store.steampowered.com/api/appdetails?appids={app_id}"
        try:
            resp = requests.get(details_url).json()
            if not resp[str(app_id)]["success"]:
                print(f"⚠️ App {app_id} no tiene datos válidos")
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
            if count % 100 == 0:
                print(f"➡️ Guardados {count} juegos...")
            time.sleep(0.2)  # evitar saturar la API
        except Exception as e:
            print(f"❌ Error con app {app_id}: {e}")

print(f"🎉 CSV steam_all_games.csv generado con {count} juegos.")