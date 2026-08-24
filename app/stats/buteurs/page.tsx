import type { Metadata } from "next";

import { ComingSoon } from "@/components/arena/ComingSoon";

export const metadata: Metadata = { title: "Meilleurs buteurs — L’ARÈNE" };

export default function Page() {
  return (
    <ComingSoon
      title="Meilleurs buteurs"
      description="Le classement des buteurs arrivera ici au prochain sprint."
    />
  );
}
