import type { MetadataRoute } from "next";

/** Permet d'ajouter le site à l'écran d'accueil du téléphone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ESATIC Basket League",
    short_name: "EBL",
    description: "La ligue de basket inter-promos de l'ESATIC : éditions, finales, MVP et vote All-Star.",
    start_url: "/",
    display: "standalone",
    background_color: "#15191d",
    theme_color: "#15191d",
    lang: "fr",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
