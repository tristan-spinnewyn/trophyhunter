// components/dashboard/hooks/useDashboardCollections.ts
"use client";

import type { UseDashboardCollectionsProps } from "./useDashboardCollections.types";
import { useWishlist } from "./useWishlist";
import { useCollectionCrud } from "./useCollectionCrud";

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
