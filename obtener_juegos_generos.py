import requests, csv, time

genres = ["Action", "Adventure", "RPG", "Indie"]
steamspy_url = "https://steamspy.com/api.php?request=genre&genre={}"

games_dict = {}

for genre in genres:
    print(f"\n🔎 Consultando género: {genre}")
    resp = requests.get(steamspy_url.format(genre))
    print(f"➡️ Status SteamSpy {genre}: {resp.status_code}")
    try:
        popular_games = resp.json()
        print(f"➡️ {len(popular_games)} juegos recibidos para {genre}")
        # Mostrar los primeros 3 juegos para inspección
        for i, (app_id, game) in enumerate(popular_games.items()):
            print(f"   {app_id}: {game.get('name')}")
            if i >= 2: break
        for app_id, game in popular_games.items():
            games_dict[app_id] = game
    except Exception as e:
        print(f"❌ Error parseando JSON: {e}")
    time.sleep(0.5)

print(f"\n✅ Total acumulado: {len(games_dict)} juegos únicos")

with open("steam_genre_games.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["app_id", "title", "genres", "price_initial", "price_final", "discount_percent", "currency"])

    for app_id, game in games_dict.items():
        details_url = f"https://store.steampowered.com/api/appdetails?appids={app_id}"
        print(f"\n📡 Consultando detalles de app {app_id} ({game.get('name')})")
        resp = requests.get(details_url)
        try:
            data_resp = resp.json()
            if not data_resp[str(app_id)]["success"]:
                print(f"⚠️ App {app_id} no tiene datos válidos")
                continue
            data = data_resp[str(app_id)]["data"]
            title = data.get("name", "")
            genres_str = ", ".join([g["description"] for g in data.get("genres", [])]) if "genres" in data else ""
            price = data.get("price_overview", {})

            writer.writerow([
                app_id,
                title,
                genres_str,
                price.get("initial"),
                price.get("final"),
                price.get("discount_percent"),
                price.get("currency")
            ])
            print(f"✅ Guardado: {title}")
        except Exception as e:
            print(f"❌ Error con app {app_id}: {e}")
        time.sleep(0.2)

print("\n🎉 CSV steam_genre_games.csv generado.")