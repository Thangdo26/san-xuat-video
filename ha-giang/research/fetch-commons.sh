#!/bin/bash
# Downloads the chosen Commons photos for Hà Giang into public/videos/ha-giang/candidates (credits go to data/videos/ha-giang/credits.json).
cd /c/Users/thang/Thang_space/ha-giang
while IFS='|' read -r slot title; do
  [ -z "$slot" ] && continue
  [ -f "public/videos/ha-giang/candidates/$slot.jpg" ] && continue
  npm run -s video:fetch-image -- --slug ha-giang --dir candidates --slot "$slot" --title "$title" || echo "FAIL $slot"
  sleep 3
done <<'EOF'
lc-01|File:Lung Cu Flag Tower.jpg
lc-02|File:Lung Cu flag tower of Ha Giang in 2014 04.jpg
lc-03|File:Lung Cu flag tower of Ha Giang in 2014 01.jpg
lc-04|File:Cột cờ Lũng Cú - Hà Giang.JPG
lc-05|File:Lá cờ Việt Nam trên đỉnh Cột cờ Lũng Cú.JPG
lc-06|File:Lung cu view.jpg
lc-07|File:Lô Lô Chải 2022 - NKS.jpg
lc-08|File:Toàn cảnh.jpg
lc-09|File:Lũng Cú, Đồng Văn, Hà Giang, Vietnam - panoramio (1).jpg
lc-10|File:Cột cờ Lũng Cú.JPG
mpl-01|File:Mã Pí Lèng Pass, Vietnam.jpg
mpl-02|File:Mountain road at Mã Pí Lèng Pass, Hà Giang Province, Vietnam.jpg
mpl-03|File:Ma Pi Leng panorama.jpg
mpl-04|File:Mã Pí Lèng, Vietnam.jpg
mpl-05|File:Đèo Mã Pí Lèng 2022.jpg
mpl-06|File:MaPiLeng loop 2022.jpg
mpl-07|File:Hẻm Tu Sản 2-2022.jpg
mpl-08|File:Sông Nho Quế 2022 - NKS.jpg
mpl-09|File:Sông Nho Quế.jpg
mpl-10|File:Ma Pi Leng Pass winding road Ha Giang Vietnam.jpg
mpl-11|File:Mapileng mountains.jpg
vg-01|File:Ha Giang Hmong King palace in 2014 05.jpg
vg-02|File:Ha Giang Hmong King palace in 2014 17.jpg
vg-03|File:Ha Giang Hmong King palace in 2014 01.jpg
vg-04|File:Ha Giang Hmong King palace in 2014 12.jpg
vg-05|File:Ha Giang Hmong King palace in 2014 03.jpg
vg-06|File:Ha Giang Hmong King palace in 2014 08.jpg
vg-07|File:Ha Giang Hmong King palace in 2014 20.jpg
vg-08|File:Ha Giang Hmong King palace in 2014 15.jpg
dv-01|File:Dong Van old town.jpg
dv-02|File:Cho Pho Co Dong Van in 2014.jpg
dv-03|File:Pho Co Coffee in Dong Van.jpg
dv-04|File:Ha Giang market- Dong Van market.jpg
dv-05|File:Tt. Đồng Văn, Đồng Văn, Hà Giang, Vietnam - panoramio.jpg
dv-06|File:Tt. Đồng Văn, Đồng Văn, Hà Giang, Vietnam - panoramio (1).jpg
dv-07|File:Khu pho co, tt Dong van, tinh Hagiang Việt Nam - panoramio.jpg
dv-08|File:Đồng Văn, Vietnam - 3.jpg
dv-09|File:Tt. Đồng Văn, Đồng Văn, Hà Giang, Vietnam - panoramio (5).jpg
qb-01|File:Quản Bạ, Vietnam - 1.jpg
qb-02|File:Quản Bạ, Vietnam - 2.jpg
qb-03|File:Núi Cô Tiên, Quản Bạ (47742798901).jpg
qb-04|File:DuonglencongtroiQuanBa.jpg
qb-05|File:Tt. Tam Sơn, Quản Bạ, Hà Giang, Vietnam - panoramio (4).jpg
qb-06|File:Cán Tỷ, Quản Bạ, Hà Giang, Vietnam - panoramio.jpg
qb-07|File:Tt. Tam Sơn, Quản Bạ, Hà Giang, Vietnam - panoramio (3).jpg
tm-01|File:Dốc Thẩm Mã 2022 - NKS.jpg
tm-02|File:Tham Ma pass - Dong Van.jpg
tm-03|File:Road in Hà Giang province.jpg
tm-04|File:Tt. Yên Minh, Yên Minh, Hà Giang, Vietnam - panoramio.jpg
tm-05|File:Needle trees in the Yen Minh district 1.jpg
tm-06|File:Sủng Là, Đồng Văn, Hà Giang, Vietnam - panoramio.jpg
tm-07|File:Ha Giang Loop.jpg
tm-08|File:Ha Giang Loop, Northern Vietnam.jpg
mv-01|File:Mèo Vạc market - 01.jpg
mv-02|File:Mèo Vạc market - 04.jpg
mv-03|File:Mèo Vạc market - 02.jpg
mv-04|File:Thị trấn Mèo Vạc.jpg
mv-05|File:Ancient river valley in PaVi HaGiang Vietnam.jpg
mv-06|File:Rd4C & Valley in PaVi HaGiang Vietnam.jpg
mv-07|File:Mèo Vạc market - 07.jpg
dg-01|File:Du Gia 062026.jpg
dg-02|File:Du Già.jpg
f-banhcuon-1|File:Banh cuon nhan thit.jpg
f-banhcuon-2|File:Bánh cuốn.jpg
f-banhcuon-3|File:Bánh cuốn nhân thịt.JPG
f-xoi-1|File:Xôi ngũ sắc.JPG
f-tgm-1|File:Lễ hội ẩm thực Cửa Việt th4n2023 đặc sản Tây Bắc, bánh tam giác mạch.jpg
f-local-1|File:Ha Giang local foods in Ha Giang City.jpg
EOF
echo FETCH-DONE
