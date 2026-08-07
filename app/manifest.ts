import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JGO OS",
    short_name: "JGO OS",
    description: "JGO Hire Operating System",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f4",
    theme_color: "#dfe8d8",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}