import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Expense Tracker Pro",
    short_name: "Expenses",
    description:
      "Multi-currency, bilingual expense tracking with budgets, analytics and reports.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0d1f1a",
    theme_color: "#0d1f1a",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
