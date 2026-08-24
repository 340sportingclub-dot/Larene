import type { Metadata } from "next";

import { ComingSoon } from "@/components/arena/ComingSoon";

export const metadata: Metadata = { title: "Infos pratiques — L’ARÈNE" };

export default function Page() {
  return (
    <ComingSoon
      title="Infos pratiques"
      description="Lieu, horaires, accès et informations pratiques arriveront ici au prochain sprint."
    />
  );
}
