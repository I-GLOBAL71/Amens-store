import { describe, it, expect } from "bun:test";
import { SITE_URL, absoluteUrl } from "../src/lib/site";
import robots from "../src/app/robots";

describe("Cohérence canonique SEO — amens.store (www.amens.store)", () => {
  it("utilise https://www.amens.store comme domaine canonique", () => {
    expect(SITE_URL).toBe("https://www.amens.store");
    expect(absoluteUrl("/")).toBe("https://www.amens.store/");
    expect(absoluteUrl("/?v=blog")).toBe("https://www.amens.store/?v=blog");
  });

  it("déclare le sitemap et le host canoniques dans robots.txt", () => {
    const r = robots();
    expect(r.sitemap).toBe("https://www.amens.store/sitemap.xml");
    expect(r.host).toBe("https://www.amens.store");
  });
});
