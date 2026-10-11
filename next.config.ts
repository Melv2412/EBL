import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co").hostname;

const nextConfig: NextConfig = {
  images: {
    // Logos et photos envoyés depuis l'admin vers Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
  },
  experimental: {
    // Photos prises au téléphone : plus lourdes que la limite par défaut (1 Mo).
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
