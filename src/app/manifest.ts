import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Leaf Loop",
    short_name: "Leaf Loop",
    description: "วางแผนการย้ายปลูกและเก็บเกี่ยวผักไฮโดรโปนิกส์",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "th",
    background_color: "#f1f5e6",
    theme_color: "#f1f5e6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
