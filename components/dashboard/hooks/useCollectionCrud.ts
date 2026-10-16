// components/dashboard/hooks/useCollectionCrud.ts
"use client";

import { useState, useEffect } from "react";
import type { PlatformType, OwnedGame, User as UserType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";
import {
  createCollectionApi,
  deleteCollectionApi,
  addGameToCollectionApi,
  removeGameFromCollectionApi,
} from "./collectionApi";

interface UseCollectionCrudProps {
  currentUser?: UserType | null;
  initialCollections?: LocalCollection[];
  onCollectionsChange?: (collections: LocalCollection[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function useCollectionCrud({
  currentUser,
  initialCollections = [],
  onCollectionsChange,
  setBannerMsg,
}: UseCollectionCrudProps) {
  const [collections, setCollections] = useState<LocalCollection[]>(initialCollections);
  const [selectedCollId, setSelectedCollId] = useState<string | null>(null);
  const [newCollName, setNewCollName] = useState("");
  const [newCollDesc, setNewCollDesc] = useState("");
  const [isCreatingColl, setIsCreatingColl] = useState(false);
  const [gameToAddToColl, setGameToAddToColl] = useState<OwnedGame | null>(null);

  useEffect(() => {
    setCollections(initialCollections);
  }, [initialCollections]);

  const handleCreateCollection = async () => {
    const trimmed = newCollName.trim();
    if (!trimmed) return;
    const desc = newCollDesc.trim() || undefined;
    let createdId = currentUser ? await createCollectionApi(trimmed, desc) : null;
    if (!createdId) createdId = "coll_" + Date.now();

    const newColl: LocalCollection = { id: createdId, name: trimmed, description: desc, color: "#6366f1", gameIds: [] };
    const next = [...collections, newColl];
    setCollections(next);
    if (onCollectionsChange) onCollectionsChange(next);
    setNewCollName("");
    setNewCollDesc("");
    setIsCreatingColl(false);
    setSelectedCollId(newColl.id);
    setBannerMsg({ type: "success", text: `Collection "${trimmed}" créée !` });
  };

  const handleDeleteCollection = async (collId: string) => {
    if (currentUser) await deleteCollectionApi(collId);
    const next = collections.filter((c) => c.id !== collId);
    setCollections(next);
    if (onCollectionsChange) onCollectionsChange(next);
    if (selectedCollId === collId) setSelectedCollId(null);
    setBannerMsg({ type: "success", text: "Collection supprimée." });
  };

  const handleAddGameToColl = async (collId: string, game: OwnedGame) => {
    if (currentUser) await addGameToCollectionApi(collId, game.appId, game.platform);
    const next = collections.map((c) => (c.id === collId && !c.gameIds.includes(game.appId)) ? { ...c, gameIds: [...c.gameIds, game.appId] } : c);
    setCollections(next);
    if (onCollectionsChange) onCollectionsChange(next);
    setGameToAddToColl(null);
    setBannerMsg({ type: "success", text: `"${game.name}" ajouté à la collection !` });
  };

  const handleRemoveGameFromColl = async (collId: string, appId: number, platform: PlatformType) => {
    if (currentUser) await removeGameFromCollectionApi(collId, appId, platform);
    const next = collections.map((c) => c.id === collId ? { ...c, gameIds: c.gameIds.filter((id) => id !== appId) } : c);
    setCollections(next);
    if (onCollectionsChange) onCollectionsChange(next);
    setBannerMsg({ type: "success", text: "Jeu retiré de la collection." });
  };

  return {
    collections, setCollections, selectedCollId, setSelectedCollId,
    newCollName, setNewCollName, newCollDesc, setNewCollDesc,
    isCreatingColl, setIsCreatingColl, gameToAddToColl, setGameToAddToColl,
    handleCreateCollection, handleDeleteCollection, handleAddGameToColl, handleRemoveGameFromColl,
  };
}
