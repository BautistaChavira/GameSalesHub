import re

# Ruta al archivo HAR/TXT exportado desde DevTools
file_path = "gg.deals.har"  # cámbialo por tu archivo real

# Leer el archivo completo
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Buscar todas las coincidencias de "gg.deals/ajax"
pattern = r"https:\/\/gg\.deals\/ajax[^\s\",]+"
matches = re.findall(pattern, content)

if matches:
    print("Endpoints encontrados:")
    for i, url in enumerate(matches, 1):
        print(f"{i}: {url}")
else:
    print("No se encontraron endpoints con gg.deals/ajax")