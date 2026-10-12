import Link from "next/link";
import { BouncingBall } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 text-center">
      <BouncingBall size={56} />
      <p className="font-display text-7xl font-bold text-teal">Airball</p>
      <p className="mt-4 text-ink-soft">Cette page n&apos;existe pas.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-teal">
        Retour à l&apos;accueil →
      </Link>
    </div>
  );
}
