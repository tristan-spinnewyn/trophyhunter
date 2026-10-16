import { Suspense } from "react";
import GameClientPage from "./GameClientPage";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400">
          Chargement du jeu...
        </div>
      }
    >
      <GameClientPage id={id} />
    </Suspense>
  );
}
