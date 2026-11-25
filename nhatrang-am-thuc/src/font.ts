import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

// The `vietnamese` subset is required, otherwise glyphs such as Ẵ, Ề and Đ
// fall back to a different font and the diacritics render inconsistently.
export const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
});
