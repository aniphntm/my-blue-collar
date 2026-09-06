# MyBlue assets

Reusable files collected for MyBlue. Adding this folder does not deploy it or change application styling.

## Inventory

| Path | Contents |
| --- | --- |
| `mb-logo.svg`, `myblue-logo.svg` | Newly authored logo variants; use Arial/Helvetica text, not outlined glyphs. Not recovered canonical artwork. |
| `favicon.ico` | Unmodified copy of `app/favicon.ico`. |
| `favicon.png`, `icon.png`, `splash-icon.png`, `android-icon-*.png` | Unmodified copies from `apps/mobile/assets/`. Their inclusion does not certify them as approved brand artwork. |
| `fonts/geist/` | Geist Sans and Mono variable fonts, upright and italic, WOFF2 for web and TTF for desktop installation, with upstream licenses. |
| `fonts/fonts.css` | Optional self-hosted font-face declarations, weights 100–900. |
| `styles/tokens.css` | Existing web light/dark palette, font stacks and card radius, extracted from `app/globals.css` at `fdc74e2`. |

## Typography: current vs. bundled

The website currently uses `Arial, Helvetica, sans-serif` and `"SFMono-Regular", Consolas, "Liberation Mono", monospace`. Its `--font-geist` variable names do **not** mean Geist is currently loaded. The SVG logos also reference Arial/Helvetica. These platform fonts are not included as binaries.

Geist is an optional addition to this kit, not an approved replacement for the existing typography. No app imports, font stacks, logos or dependencies were changed. Install the TTF files for desktop design work. To use the WOFF2 files in a separate web project, serve the folder, load `fonts/fonts.css`, then explicitly select `font-family: "Geist", sans-serif` or `"Geist Mono", monospace` on the desired elements. Avoid loading both static and variable copies of the same font.

## Font source and license

Source: https://github.com/vercel/geist-font

Pinned upstream commit: `10dc7658f13c38a474cde201bb09a4617267545b`.

Files copied unchanged from `fonts/Geist/variable/`, `fonts/GeistMono/variable/` and the matching variable files in each family's `webfonts/` directory. Font filenames retain upstream names. Both upstream `OFL.txt` and `LICENSE.txt` are included in `fonts/geist/`; retain these when redistributing. Font licensing does not confer rights to MyBlue branding.

## Existing design values

Web accent: `#2563EB`; light ink: `#14130E`; light background: `#FAF9F6`; dark accent: `#7C8EF3`; dark background: `#131109`. Full web tokens, including both color schemes, are in `styles/tokens.css`. This is a snapshot, not an automatically synchronized source of truth.

The mobile application uses a separate palette in `apps/mobile/App.tsx`, including accent `#3457F1` and background `#F7F8FB`; the web snapshot does not replace it.

## Hosting and outstanding work

Repository-root `assets/` is a collection, not automatically a Next.js public URL. To expose `/assets/...` through the application, it must be deliberately served (for example via `public/assets/`) in a separate integration change. Do not assume the raw GitHub URL is a production CDN.

Still outstanding: confirm canonical logo artwork, approve a typography standard, and explicitly wire the kit into the intended applications. Original application assets remain in place.
