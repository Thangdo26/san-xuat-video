# Search Wikimedia Commons files: python cs.py "query" ["query" ...]
# Prints title, size and licence for each hit, so candidates can be picked before downloading.
import io, json, sys, time, urllib.parse, urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
UA = {"User-Agent": "sapa-research/1.0 (personal research script)"}

def get(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r:
        return json.load(r)

for q in sys.argv[1:]:
    d = get({"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 40,
             "prop": "imageinfo", "iiprop": "size|extmetadata", "iiextmetadatafilter": "LicenseShortName"})
    pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    print(f"== {q} ({len(pages)})")
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        lic = ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "?")
        if ii.get("width", 0) >= 1200 and not p["title"].lower().endswith((".pdf", ".svg", ".tif", ".ogg", ".webm")):
            print(f"  {ii.get('width')}x{ii.get('height')} | {lic} | {p['title']}")
    time.sleep(2)
