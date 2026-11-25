#!/bin/bash
# Downloads the chosen Commons photos for Sa Pa into public/videos/sa-pa/candidates (credits go to data/videos/sa-pa/credits.json).
cd /c/Users/thang/Thang_space/sa-pa
while IFS='|' read -r slot title; do
  [ -z "$slot" ] && continue
  [ -f "public/videos/sa-pa/candidates/$slot.jpg" ] && continue
  npm run -s video:fetch-image -- --slug sa-pa --dir candidates --slot "$slot" --title "$title" || echo "FAIL $slot"
  sleep 3
done <<'EOF'
catcat-01|File:Cát Cát Village 4 - Waterfall.jpg
catcat-02|File:Cat Cat Waterfalls, Sa Pa, Vietnam, 20240126 1228 3619.jpg
catcat-03|File:Catcatfalls2.jpg
catcat-04|File:Catcatfalls5.jpg
catcat-05|File:Trong bản Cát Cát.png
catcat-06|File:Cat Cat waterfall.jpg
city-01|File:Nhà thờ đá Sa Pa.jpg
city-02|File:Nhà thờ đá tại trung tâm Sa Pa.jpg
city-03|File:Sa Pa Church.jpg
city-04|File:Stone church in Sapa.jpg
city-05|File:Sa Pa Town.jpg
city-06|File:Sapa lake.jpg
city-07|File:Thị trấn Sa Pa.jpg
city-08|File:Sa-pa-3006284.jpg
fan-01|File:Fansipan summit pagoda stupa sea of clouds aerial view Sa Pa Vietnam.jpg
fan-02|File:Fansipan summit pyramid monument sunset sea of clouds Sa Pa Vietnam.jpg
fan-03|File:Fansipan Summit Mark 2024.jpg
fan-04|File:Fansipan Cable Car.jpg
fan-05|File:Fansipan cable car aerial view terraced rice fields Sa Pa Viet Nam.jpg
fan-06|File:Buddha statue golden sunset sea of clouds Fansipan Sa Pa Vietnam.jpg
fan-07|File:Fansipan Cable Car in the fog.jpg
oqh-01|File:Sunset on O Quy Ho pass.jpg
oqh-02|File:O Quy Ho pass.jpg
oqh-03|File:Đèo Ô Quy Hồ 1.JPG
oqh-04|File:Đèo Ô Quy Hồ 2.JPG
oqh-05|File:O quy ho tourist.jpg
bac-01|File:Thác bạc - panoramio.jpg
bac-02|File:Thacbac3.jpg
bac-03|File:Thacbac2.jpg
tavan-01|File:Sapa Ta Van.jpg
tavan-02|File:Ta Van Muong Ha vallei.jpg
tavan-03|File:Ta Van Muong Ha vallei bridge.jpg
tavan-04|File:Cau May tenoosten van SaPa bij Lao Cai (80944).jpg
tavan-05|File:Cau May tenoosten van SaPa bij Lao Cai (45004).jpg
mh-01|File:Mường Hoa Valley 06.jpg
mh-02|File:Mường Hoa Valley 11.jpg
mh-03|File:Mường Hoa Valley 13.jpg
mh-04|File:Mường Hoa Valley 01.jpg
mh-05|File:Rice terraces in Sapa, Vietnam.jpg
mh-06|File:Ray over terrace rice field in Sapa - Trung Chải..jpg
hr-01|File:Sapa vu du mont Ham Rong.jpg
hr-02|File:Vietnam-Sapa-Ham Rong Mountain-PANO 20180111 111620.jpg
hr-03|File:Sapa1.jpg
f-thangco-1|File:Thắng cố.jpg
f-thangco-2|File:Thang Co (Cattle Intestines Soup).jpg
f-nuong-1|File:Đồ nướng sapa.jpg
f-nuong-2|File:Street Food Vendor in Sapa Vietnam.jpg
f-comlam-1|File:Cơm lam 5.jpg
f-comlam-2|File:Lễ hội ẩm thực Cửa Việt th4n2023 đặc sản Gio An, cơm lam ống tre (2).jpg
f-gaden-1|File:Silkie chicken and pumpkin.jpg
EOF
echo FETCH-DONE
