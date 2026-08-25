import { NextResponse, type NextRequest } from "next/server";

import { openTeamSession } from "@/lib/arena/team-session";

/**
 * Point d'entrée du lien privé du capitaine.
 *
 * Le jeton n'est présent que dans cette requête : il est vérifié, échangé
 * contre un cookie httpOnly, puis la réponse redirige vers `/equipe`. À partir
 * de là il ne figure plus ni dans la barre d'adresse, ni dans l'historique, ni
 * dans un en-tête `Referer` sortant.
 *
 * Un jeton inconnu, révoqué ou expiré mène au même endroit qu'un jeton absent :
 * on n'apprend rien à qui en essaierait au hasard.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await openTeamSession(decodeURIComponent(token));

  const destination = session ? "/equipe" : "/equipe/lien-invalide";
  return NextResponse.redirect(new URL(destination, _request.nextUrl.origin));
}
