// components/dashboard/hooks/useDashboardCollections.ts
"use client";
import { useWishlist } from "./useWishlist";
import { useCollectionCrud } from "./useCollectionCrud";
import type { User as UserType, CollectionWithGames } from "@/lib/types";

export interface UseDashboardCollectionsProps {
  currentUser?: UserType | null;
  initialWishlist?: number[];
  initialCollections?: CollectionWithGames[];
  onWishlistChange?: (wishlist: number[]) => void;
  onCollectionsChange?: (collections: CollectionWithGames[]) => void;
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
  const { wishlistIds, setWishlistIds, handleToggleWishlist } = useWishlist({
    currentUser,
    initialWishlist,
    onWishlistChange,
    setBannerMsg,
  });

  const {
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
    handleCreateCollection,
    handleDeleteCollection,
    handleAddGameToColl,
    handleRemoveGameFromColl,
  } = useCollectionCrud({
    currentUser,
    initialCollections,
    onCollectionsChange,
    setBannerMsg,
  });

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
