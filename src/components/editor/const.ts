export const DEFAULT_HIGHLIGHT_COLOR = "#ffff00";
export const HIGHLIGHT_COLORS = [
  { name: "yellow", color: DEFAULT_HIGHLIGHT_COLOR },
  { name: "green", color: "#dcfce7" },
  { name: "blue", color: "#e0f2fe" },
  { name: "purple", color: "#f3e8ff" },
  { name: "red", color: "#ffe4e6" },
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]["name"];

export const defaultContent = `
<h2>
  Hi there,
</h2>
<p>
  this is a <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you'd probably expect from a text editor. But wait until you see the lists:
</p>
<ul>
  <li>
    That's a bullet list with one …
  </li>
  <li>
    … or two list items.
  </li>
</ul>
<p>
  Isn't that great? And all of that is editable. But wait, there's more. Let's try a code block:
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  I know, I know, this is impressive. It's only the tip of the iceberg though. Give it a try and click a little bit around. Don't forget to check the other examples too.
</p>
<blockquote>
  Wow, that's amazing. Good work, boy! 👏
  <br />
  — Mom
</blockquote>
`;
