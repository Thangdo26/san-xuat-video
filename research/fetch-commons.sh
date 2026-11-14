#!/bin/bash
# Downloads candidate Commons photos for Cát Bà into public/videos/cat-ba/candidates (credits go to data/videos/cat-ba/credits.json).
cd /c/Users/thang/Thang_space/cat-ba
while IFS='|' read -r slot title; do
  [ -z "$slot" ] && continue
  [ -f "public/videos/cat-ba/candidates/$slot.jpg" ] && continue
  npm run -s video:fetch-image -- --slug cat-ba --dir candidates --slot "$slot" --title "$title" || echo "FAIL $slot"
  sleep 3
done <<'LIST'
rd-1|File:Duong xuyen dao Cat Ba 1.JPG
rd-2|File:Road to Việt Hải, Cát Bà Island, Vietnam, 20240131 1323 4619.jpg
rd-3|File:Duong len Cat Ba.JPG
rd-4|File:Droga do świątyni na brzegu wyspy Cat Ba w Wietnamie, 20240130 1356 4348.jpg
rd-5|File:Droga do świątyni na brzegu wyspy Cat Ba w Wietnamie, 20240130 1357 4351.jpg
rd-6|File:Droga do świątyni na brzegu wyspy Cat Ba w Wietnamie, 20240130 1403 4373.jpg
rd-7|File:Droga do świątyni na brzegu wyspy Cat Ba w Wietnamie, 20240130 1404 4380.jpg
rd-8|File:Duong xuyen dao Cat Hai 1.JPG
br-1|File:Dinh Vu - Cat Hai Bridge.jpg
br-2|File:Lach Huyen Port from Cai Vieng Port.jpg
fe-1|File:Bến phà Cái Viềng.jpg
fe-2|File:Cat Ba from a ferry going to Cat Hai.jpg
fe-3|File:Arrival on Cat Ba.jpg
fe-4|File:Cat Ba ferry 1.jpg
cc-1|File:Cat Co 1 Beach-Cát Bà Island-Andres Larin.jpg
cc-2|File:Cat Ba Island, Vietnam.JPG
cc-3|File:Beach of Cat Ba in 2015 01.jpg
cc-4|File:Beach of Cat Ba in 2015 03.jpg
cc-5|File:Bai tam Cat Ba.JPG
cc-6|File:Cat Ba Island.jpg
tw-1|File:Sunset from Cat Ba Town.jpg
tw-2|File:Cat Ba Town sunset.jpg
tw-3|File:Cat Ba Town in the evening.jpg
tw-4|File:Cat Ba Town Harbour.jpg
tw-5|File:Cat Ba Town 1.jpg
tw-6|File:Cat Ba Town 4.jpg
tw-7|File:Cat Ba Town.jpg
lh-1|File:View of the Cai Beo floating village.jpg
lh-2|File:Cat ba.jpg
lh-3|File:Cat Ba.jpg
lh-4|File:Cát Bà Island.jpg
np-1|File:Cat Ba National Park 01.jpg
np-2|File:Cat Ba National Park 05.jpg
np-3|File:Cat Ba National Park 267.JPG
np-4|File:Cat Ba Island, Vietnam, 20240131 1407 4670.jpg
np-5|File:Cat Ba Island, Vietnam, 20240131 1426 4686.jpg
vh-1|File:Việt Hải, Cát Bà Island, Vietnam, 20240131 1211 4613.jpg
LIST
echo FETCH-DONE
