import type { Metadata } from "next";

import { ComingSoon } from "@/components/arena/ComingSoon";

export const metadata: Metadata = { title: "Meilleurs passeurs — L’ARÈNE" };

export default function Page() {
  return (
    <ComingSoon
      title="Meilleurs passeurs"
      description="Le classement des passeurs arrivera ici au prochain sprint."
    />
  );
}
