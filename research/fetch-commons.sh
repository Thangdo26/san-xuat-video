#!/bin/bash
# Downloads the chosen Commons photos for Ninh Bình into public/videos/ninh-binh/candidates (credits go to data/videos/ninh-binh/credits.json).
cd /c/Users/thang/Thang_space/ninh-binh
while IFS='|' read -r slot title; do
  [ -z "$slot" ] && continue
  [ -f "public/videos/ninh-binh/candidates/$slot.jpg" ] && continue
  npm run -s video:fetch-image -- --slug ninh-binh --dir candidates --slot "$slot" --title "$title" || echo "FAIL $slot"
  sleep 3
done <<'LIST'
f-de-1|File:Thịt dê Ninh Bình.JPG
f-de-2|File:Tái dê.jpg
f-de-3|File:Món dê ở quán Bích La Thôn-Đông Hà, Tết năm 2018.jpg
f-de-4|File:Đặc sản món dê tại Bích La Thôn-Đông Hà 2018 (2).jpg
f-de-5|File:Đặc sản món dê tại Bích La Thôn-Đông Hà 2018 (9).jpg
f-de-6|File:Đặc sản món dê tại Bích La Thôn-Đông Hà 2018 (14).jpg
f-cc-1|File:Cơm cháy Ninh Bình.JPG
f-cc-2|File:Comchay.JPG
f-cc-3|File:2020-03-08 20.57.21 Scorched rice.jpg
f-cc-4|File:2020-03-08 20.57.34 Scorched rice.jpg
f-cc-5|File:Cơm cháy kho quẹt.jpg
f-nem-1|File:Nem chua Yen Mac.jpg
f-nem-2|File:Nem chua.jpg
f-nem-3|File:Nem Chua.jpg
f-nem-4|File:Nem chua nuong.JPG
f-bc-1|File:Banh cuon nhan thit cha lua, Banh Cuon Thang Long.jpg
f-bc-2|File:Bánh cuốn.jpg
f-bc-3|File:Bat banh cuon cha.jpg
f-bc-4|File:Hàng đổ bánh cuốn, Quán Đồng Hành, Đại hội Thánh Mẫu 2017.jpg
cd-1|File:Đền Đinh Tiên Hoàng, sạp rồng.JPG
cd-2|File:Dinh Tien Hoang temple (7172236091).jpg
cd-3|File:Bridge leading to gateway of ancient capital of Hoa Lu (26725545949).jpg
cd-4|File:Temple at ancient Vietnamese capital of Hoa Lu (11) (38468992212).jpg
cd-5|File:Đền Đinh Tiên Hoàng, ao súng.JPG
cd-6|File:Temple of Emperor Le Dai Hanh, Hoa Lư, Ninh Bình, Vietnam, 20240203 1527 5706.jpg
LIST
