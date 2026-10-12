// Rejoué à chaque navigation : la nouvelle page entre en fondu glissé.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="ebl-page">{children}</div>;
}
