import { describe, expect, it } from "vitest";
import { parseReadmeFrontmatter } from "./parse-readme-frontmatter.js";

describe("parseReadmeFrontmatter", () => {
  it("parses YAML front matter between --- markers", () => {
    const content = `---
title: "ADS1015"
model: "ADS1015"
category: "ADC"
description: "Test device"
---

## 概要
`;

    expect(parseReadmeFrontmatter(content)).toEqual({
      title: "ADS1015",
      model: "ADS1015",
      category: "ADC",
      description: "Test device",
    });
  });

  it("returns null when front matter is missing", () => {
    expect(parseReadmeFrontmatter("## 概要\n")).toBeNull();
  });
});
