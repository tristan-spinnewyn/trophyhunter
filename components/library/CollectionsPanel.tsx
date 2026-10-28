// components/library/CollectionsPanel.tsx

"use client";

import { FolderPlus } from "lucide-react";
import type { CollectionWithGames } from "@/lib/types";
import { CreateCollectionForm } from "./collections/CreateCollectionForm";
import { CollectionsList } from "./collections/CollectionsList";

interface CollectionsPanelProps {
  collections: CollectionWithGames[];
  selectedCollId: string | null;
  setSelectedCollId: (id: string | null) => void;
  isCreatingColl: boolean;
  setIsCreatingColl: (val: boolean) => void;
  newCollName: string;
  setNewCollName: (val: string) => void;
  newCollDesc: string;
  setNewCollDesc: (val: string) => void;
  handleCreateCollection: () => void;
  handleDeleteCollection: (id: string) => void;
}

export default function CollectionsPanel({
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
}: CollectionsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCreatingColl(!isCreatingColl)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition"
        >
          <FolderPlus className="h-4 w-4" />
          Nouvelle Collection
        </button>
      </div>

      {isCreatingColl && (
        <CreateCollectionForm
          newCollName={newCollName}
          setNewCollName={setNewCollName}
          newCollDesc={newCollDesc}
          setNewCollDesc={setNewCollDesc}
          handleCreateCollection={handleCreateCollection}
          onCancel={() => setIsCreatingColl(false)}
        />
      )}

      <CollectionsList
        collections={collections}
        selectedCollId={selectedCollId}
        setSelectedCollId={setSelectedCollId}
        handleDeleteCollection={handleDeleteCollection}
      />
    </div>
  );
}
