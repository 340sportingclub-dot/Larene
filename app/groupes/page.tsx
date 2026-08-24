import type { Metadata } from "next";

import { ComingSoon } from "@/components/arena/ComingSoon";

export const metadata: Metadata = { title: "Les groupes — L’ARÈNE" };

export default function Page() {
  return (
    <ComingSoon
      title="Les groupes"
      description="Les classements de chaque poule, officiels et en direct, arriveront ici au prochain sprint."
    />
  );
}
