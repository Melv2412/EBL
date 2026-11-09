import Image from "next/image";
import Link from "next/link";
import { WHATSAPP_URL } from "@/lib/league";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-night text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div className="inline-block rounded bg-white px-3 py-2">
            <Image src="/logos/esatic.png" alt="ESATIC" width={140} height={34} />
          </div>
          <p className="max-w-md text-sm">
            La ligue de basket inter-promos de l&apos;École Supérieure Africaine des TIC, Abidjan.
            Projet étudiant porté par la communauté basket de l&apos;école.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <a href={WHATSAPP_URL} className="block font-medium text-white hover:text-teal" target="_blank" rel="noopener">
            Une info, une photo, une correction ? WhatsApp →
          </a>
          <Link href="/a-propos" className="block hover:text-white">
            À propos et mentions
          </Link>
        </div>
      </div>
    </footer>
  );
}
