import { identifyIdType } from "../user-mapping";

describe("identifyIdType", () => {
  it("should identify MongoDB ObjectId correctly", () => {
    const mongodbId = "507f1f77bcf86cd799439011";
    expect(identifyIdType(mongodbId)).toBe("mongodb");
  });

  it("should identify Firebase UID correctly", () => {
    const firebaseUID = "abcdefghijklmnopqrstuvwxyz12";
    expect(identifyIdType(firebaseUID)).toBe("firebase");
  });

  it("should return unknown for invalid IDs", () => {
    expect(identifyIdType("")).toBe("unknown");
    expect(identifyIdType("123")).toBe("unknown");
    expect(identifyIdType("invalid-id")).toBe("unknown");
  });

  it("should handle edge cases", () => {
    // 24 character string that's not hex
    expect(identifyIdType("123456789012345678901234")).toBe("mongodb");

    // 28 character string that's not alphanumeric
    expect(identifyIdType("1234567890123456789012345678")).toBe("firebase");
  });
});

