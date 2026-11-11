// __tests__/lib/game-review/game-review.test.ts
import { describe, it, expect } from "vitest";
import { canBeReviewed, describeRating, MAX_REVIEW_LENGTH, parseGameReviewInput } from "@/lib/game-review/game-review";

describe("parseGameReviewInput", () => {
  it("accepts a rating from 1 to 5 and a review", () => {
    expect(parseGameReviewInput({ rating: 4, review: "  Superbe fin.  " })).toEqual({
      ok: true,
      review: { rating: 4, review: "Superbe fin." },
    });
  });

  it("clears the rating with null and the review with blank text", () => {
    expect(parseGameReviewInput({ rating: null, review: "   " })).toEqual({ ok: true, review: { rating: null, review: null } });
  });

  it("treats missing fields as cleared", () => {
    expect(parseGameReviewInput({})).toEqual({ ok: true, review: { rating: null, review: null } });
  });

  it("refuses a rating outside 1 to 5 or not whole", () => {
    expect(parseGameReviewInput({ rating: 0 }).ok).toBe(false);
    expect(parseGameReviewInput({ rating: 6 }).ok).toBe(false);
    expect(parseGameReviewInput({ rating: 3.5 }).ok).toBe(false);
    expect(parseGameReviewInput({ rating: "5" }).ok).toBe(false);
  });

  it("refuses a review that is too long or not text", () => {
    expect(parseGameReviewInput({ review: "x".repeat(MAX_REVIEW_LENGTH + 1) }).ok).toBe(false);
    expect(parseGameReviewInput({ review: 42 }).ok).toBe(false);
  });
});

describe("canBeReviewed", () => {
  it("is true for finished and abandoned games only", () => {
    expect(canBeReviewed("completed")).toBe(true);
    expect(canBeReviewed("abandoned")).toBe(true);
    expect(canBeReviewed("in-progress")).toBe(false);
    expect(canBeReviewed(undefined)).toBe(false);
  });
});

describe("describeRating", () => {
  it("says the rating out of five", () => {
    expect(describeRating(4)).toBe("Ta note : 4/5");
  });

  it("says nothing for an unrated game", () => {
    expect(describeRating(undefined)).toBeNull();
  });
});
