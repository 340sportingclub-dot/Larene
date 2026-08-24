import type { Metadata } from "next";

import { ComingSoon } from "@/components/arena/ComingSoon";

export const metadata: Metadata = { title: "Stats du tournoi — L’ARÈNE" };

export default function Page() {
  return (
    <ComingSoon
      title="Stats du tournoi"
      description="Les statistiques complètes du tournoi arriveront ici au prochain sprint."
    />
  );
}
