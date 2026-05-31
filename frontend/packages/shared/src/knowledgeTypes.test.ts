import { describe, expect, it } from "vitest";
import type { KnowledgeRelationType, PostContentType, PostVisibility } from "./types";

describe("knowledge system shared types", () => {
  it("describes post visibility, content type, and knowledge relation type unions", () => {
    const visibility: PostVisibility = "PRIVATE";
    const contentType: PostContentType = "NOTE";
    const relationType: KnowledgeRelationType = "SOURCE";

    expect([visibility, contentType, relationType]).toEqual(["PRIVATE", "NOTE", "SOURCE"]);
  });
});
