import { describe, expect, it } from "vitest";

import { parseWallifyAccountSettings, parseWallifyTerms } from "../server/wallify-client";

describe("Wallify settings and terms parsing", () => {
  it("reads the editable website profile fields", () => {
    const profile = parseWallifyAccountSettings('<input name="username" value="admin"><input value="admin@wallify.test" name="email"><textarea name="bio">保持热爱</textarea>');
    expect(profile).toEqual({ username: "admin", email: "admin@wallify.test", bio: "保持热爱" });
  });

  it("keeps official terms headings, paragraphs and rules", () => {
    const terms = parseWallifyTerms('<h2>接受条款</h2><p>同意后方可使用。</p><h2>用户行为规范</h2><p>使用本站时，您同意：</p><ul><li>不上传侵权内容</li><li>不破坏系统</li></ul>');
    expect(terms).toEqual([
      { title: "接受条款", paragraphs: ["同意后方可使用。"], bullets: [] },
      { title: "用户行为规范", paragraphs: ["使用本站时，您同意："], bullets: ["不上传侵权内容", "不破坏系统"] },
    ]);
  });
});
