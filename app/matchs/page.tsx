import type { Metadata } from "next";

import { ComingSoon } from "@/components/arena/ComingSoon";

export const metadata: Metadata = { title: "Matchs — L’ARÈNE" };

export default function Page() {
  return (
    <ComingSoon
      title="Matchs"
      description="Le calendrier complet du tournoi, les scores en direct et les résultats arriveront ici au prochain sprint."
    />
  );
}
