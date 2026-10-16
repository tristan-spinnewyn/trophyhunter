"use client";

import { useState } from "react";
import type { PlatformType, OwnedGame, User as UserType } from "@/lib/types";
import type { LocalCollection } from "@/lib/storage";

interface UseDashboardCollectionsProps {
  currentUser?: UserType | null;
  initialWishlist?: number[];
  initialCollections?: LocalCollection[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: LocalCollection[]) => void;
  setBannerMsg: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function useDashboardCollections({
  currentUser,
  initialWishlist = [],
  initialCollections = [],
  onWishlistChange,
  onCollectionsChange,
  setBannerMsg,
}: UseDashboardCollectionsProps) {
  const [wishlistIds, setWishlistIds] = useState<number[]>(initialWishlist);
  const [collections, setCollections] = useState<LocalCollection[]>(initialCollections);
  const [selectedCollId, setSelectedCollId] = useState<string | null>(null);
  const [newCollName, setNewCollName] = useState("");
  const [newCollDesc, setNewCollDesc] = useState("");
  const [newCollColor] = useState("#6366f1");
  const [isCreatingColl, setIsCreatingColl] = useState(false);
  const [gameToAddToColl, setGameToAddToColl] = useState<OwnedGame | null>(null);

  const handleToggleWishlist = async (appId: number, platform: PlatformType) => {
    const isCurrentlyWishlisted = wishlistIds.includes(appId);
    const nextAdded = !isCurrentlyWishlisted;
    const nextWishlist = nextAdded
      ? [...wishlistIds, appId]
      : wishlistIds.filter((id) => id !== appId);

    setWishlistIds(nextWishlist);
    if (onWishlistChange) onWishlistChange(nextWishlist);

    if (currentUser) {
      try {
        await fetch("/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId, platform, isWishlist: nextAdded }),
        });
      } catch {}
    }
    setBannerMsg({
      type: "success",
      text: nextAdded
        ? "Jeu ajouté à votre liste d'envies !"
        : "Jeu retiré de votre liste d'envies.",
    });
  };

  const handleCreateCollection = async () => {
    const trimmed = newCollName.trim();
    if (!trimmed) return;

    let createdId = "coll_" + Date.now();
    if (currentUser) {
      try {
        const res = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmed,
            description: newCollDesc.trim() || undefined,
            color: newCollColor,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.collection?.id) {
            createdId = data.collection.id;
          }
        }
      } catch {}
    }

    const newColl: LocalCollection = {
      id: createdId,
      name: trimmed,
      description: newCollDesc.trim() || undefined,
      color: newCollColor,
      gameIds: [],
    };
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
    if (currentUser) {
      try {
        await fetch(`/api/collections/${collId}`, { method: "DELETE" });
      } catch {}
    }
    const next = collections.filter((c) => c.id !== collId);
    setCollections(next);
    if (onCollectionsChange) onCollectionsChange(next);
    if (selectedCollId === collId) setSelectedCollId(null);
    setBannerMsg({ type: "success", text: "Collection supprimée." });
  };

  const handleAddGameToColl = async (collId: string, game: OwnedGame) => {
    if (currentUser) {
      try {
        await fetch(`/api/collections/${collId}/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: game.appId, platform: game.platform }),
        });
      } catch {}
    }
    const next = collections.map((c) => {
      if (c.id === collId && !c.gameIds.includes(game.appId)) {
        return { ...c, gameIds: [...c.gameIds, game.appId] };
      }
      return c;
    });
    setCollections(next);
    if (onCollectionsChange) onCollectionsChange(next);
    setGameToAddToColl(null);
    setBannerMsg({ type: "success", text: `"${game.name}" ajouté à la collection !` });
  };

  const handleRemoveGameFromColl = async (
    collId: string,
    appId: number,
    platform: PlatformType
  ) => {
    if (currentUser) {
      try {
        await fetch(
          `/api/collections/${collId}/games?appId=${appId}&platform=${platform}`,
          {
            method: "DELETE",
          }
        );
      } catch {}
    }
    const next = collections.map((c) => {
      if (c.id === collId) {
        return { ...c, gameIds: c.gameIds.filter((id) => id !== appId) };
      }
      return c;
    });
    setCollections(next);
    if (onCollectionsChange) onCollectionsChange(next);
    setBannerMsg({ type: "success", text: "Jeu retiré de la collection." });
  };

  return {
    wishlistIds,
    setWishlistIds,
    collections,
    setCollections,
    selectedCollId,
    setSelectedCollId,
    newCollName,
    setNewCollName,
    newCollDesc,
    setNewCollDesc,
    isCreatingColl,
    setIsCreatingColl,
    gameToAddToColl,
    setGameToAddToColl,
    handleToggleWishlist,
    handleCreateCollection,
    handleDeleteCollection,
    handleAddGameToColl,
    handleRemoveGameFromColl,
  };
}
