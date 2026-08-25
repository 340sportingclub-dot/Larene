import type { Metadata } from "next";

import { TeamForm } from "@/app/inscription/equipe/TeamForm";
import { RegistrationSteps } from "@/components/arena/RegistrationSteps";

export const metadata: Metadata = { title: "Mon équipe — L’ARÈNE" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-md">
        <RegistrationSteps current={1} />

        <h1 className="mt-6 font-display text-3xl uppercase leading-none text-arena-white sm:text-4xl">
          Votre équipe
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-arena-muted">
          Deux minutes. Vous pourrez tout modifier ensuite.
        </p>

        <div className="mt-7">
          <TeamForm />
        </div>
      </div>
    </main>
  );
}
