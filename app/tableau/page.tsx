import type { Metadata } from "next";

import { ComingSoon } from "@/components/arena/ComingSoon";

export const metadata: Metadata = { title: "Le tableau — L’ARÈNE" };

export default function Page() {
  return (
    <ComingSoon
      title="Le tableau"
      description="Le tableau à élimination directe, sa projection en direct et le tableau officiel arriveront ici au prochain sprint."
    />
  );
}
