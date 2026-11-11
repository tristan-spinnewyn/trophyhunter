// components/game-status/GameReviewField.tsx
"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";
import { MAX_RATING, MAX_REVIEW_LENGTH, type GameReview } from "@/lib/game-review/game-review";

interface GameReviewFieldProps {
  readonly rating?: number;
  readonly review?: string;
  readonly onSave: (review: GameReview) => void;
}

const STARS = Array.from({ length: MAX_RATING }, (_, i) => i + 1);

/** The owner's rating (stars) and short review of a finished or abandoned game. */
export function GameReviewField({ rating, review, onSave }: GameReviewFieldProps) {
  const fieldId = useId();
  const [draft, setDraft] = useState(review ?? "");
  const savedReview = review ?? null;

  const saveRating = (stars: number) => onSave({ rating: stars === rating ? null : stars, review: savedReview });
  const saveReview = () => {
    const next = draft.trim() || null;
    if (next !== savedReview) onSave({ rating: rating ?? null, review: next });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span id={`${fieldId}-label`} className="text-sm font-semibold text-paper-dim">
          Ta note
        </span>
        <div role="radiogroup" aria-labelledby={`${fieldId}-label`} className="flex gap-0.5">
          {STARS.map((stars) => {
            const isLit = rating !== undefined && stars <= rating;
            return (
              <button
                key={stars}
                type="button"
                role="radio"
                aria-checked={stars === rating}
                aria-label={`${stars} sur ${MAX_RATING}`}
                onClick={() => saveRating(stars)}
                className="rounded-control p-0.5 text-faint transition hover:text-paper"
              >
                <Star aria-hidden className={`h-5 w-5 ${isLit ? "fill-paper text-paper" : ""}`} />
              </button>
            );
          })}
        </div>
      </div>
      <label htmlFor={fieldId} className="sr-only">
        Ton avis
      </label>
      <textarea
        id={fieldId}
        value={draft}
        maxLength={MAX_REVIEW_LENGTH}
        rows={2}
        placeholder="Ce que tu en as pensé, en quelques mots…"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveReview}
        className="w-full max-w-xl resize-y rounded-control border border-edge bg-plank px-3 py-2 text-sm text-paper placeholder-faint focus:border-seam focus:outline-none"
      />
    </div>
  );
}
