// app/components/HomeContextPanels.tsx

import { useRouter } from "next/navigation";
import CollectionsPanel from "@/components/dashboard/CollectionsPanel";
import DuplicatesPanel from "@/components/dashboard/DuplicatesPanel";
import type { DashboardTabType } from "@/components/dashboard/DashboardNavTabs";
import type { LocalCollection } from "@/lib/storage";
import type { OwnedGame } from "@/lib/types";

interface HomeContextPanelsProps {
  activePlatformTab: DashboardTabType;
  collections: LocalCollection[];
  selectedCollId: string | null;
  setSelectedCollId: (id: string | null) => void;
  isCreatingColl: boolean;
  setIsCreatingColl: (val: boolean) => void;
  newCollName: string;
  setNewCollName: (val: string) => void;
  newCollDesc: string;
  setNewCollDesc: (val: string) => void;
  handleCreateCollection: () => Promise<void>;
  handleDeleteCollection: (collId: string) => Promise<void>;
  duplicateGroups: Array<{ title: string; games: OwnedGame[] }>;
  onBackToAll: () => void;
}

export function HomeContextPanels({
  activePlatformTab,
  collections,
  selectedCollId,
  setSelectedCollId,
  isCreatingColl,
  setIsCreatingColl,
  newCollName,
  setNewCollName,
  newCollDesc,
  setNewCollDesc,
  handleCreateCollection,
  handleDeleteCollection,
  duplicateGroups,
  onBackToAll,
}: HomeContextPanelsProps) {
  const router = useRouter();

  if (activePlatformTab === "collections") {
    return (
      <CollectionsPanel
        collections={collections}
        selectedCollId={selectedCollId}
        setSelectedCollId={setSelectedCollId}
        isCreatingColl={isCreatingColl}
        setIsCreatingColl={setIsCreatingColl}
        newCollName={newCollName}
        setNewCollName={setNewCollName}
        newCollDesc={newCollDesc}
        setNewCollDesc={setNewCollDesc}
        handleCreateCollection={handleCreateCollection}
        handleDeleteCollection={handleDeleteCollection}
        onBackToAll={onBackToAll}
      />
    );
  }

  if (activePlatformTab === "duplicates") {
    return (
      <DuplicatesPanel
        duplicateGroups={duplicateGroups}
        onSelectGame={(appId) => router.push(`/game/${appId}`)}
        onBackToAll={onBackToAll}
      />
    );
  }

  return null;
}
