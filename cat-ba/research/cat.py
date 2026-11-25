import io, json, sys, time, urllib.parse, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
UA = {"User-Agent": "catba-research/1.0 (personal travel video research)"}
def get(p):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**p, "format": "json"})
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA)) as r: return json.load(r)
for cat in sys.argv[1:]:
    d = get({"action":"query","generator":"categorymembers","gcmtitle":cat,"gcmtype":"file|subcat","gcmlimit":100,"prop":"imageinfo","iiprop":"size|extmetadata","iiextmetadatafilter":"LicenseShortName"})
    pages = d.get("query",{}).get("pages",{}).values()
    print("==", cat, len(pages))
    for p in pages:
        ii=(p.get("imageinfo") or [{}])[0]
        print(f"  {ii.get('width','')}x{ii.get('height','')} | {ii.get('extmetadata',{}).get('LicenseShortName',{}).get('value','')} | {p['title']}")
    time.sleep(3)
