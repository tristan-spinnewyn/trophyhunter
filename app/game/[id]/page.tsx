import { Suspense } from "react";
import GameClientPage from "./GameClientPage";
import { GameClientLoading } from "./components/GameClientLoading";

type GameParams = Promise<{ id: string }>;

/** Reads the URL inside Suspense so the shared App Shell stays instant for every game link. */
async function GameRoute({ params }: { params: GameParams }) {
  const { id } = await params;
  return <GameClientPage id={id} />;
}

export default function GamePage({ params }: { params: GameParams }) {
  return (
    <Suspense fallback={<GameClientLoading />}>
      <GameRoute params={params} />
    </Suspense>
  );
}
