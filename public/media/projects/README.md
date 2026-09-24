# Project media

Actual media files live in this folder, inside the repository, and are served
as static files by Next.js. The database stores only the public URL of each
file (in `ProjectMedia.url`), for example:

```text
/media/projects/video-platform/banner.webp
```

## Conventions

- One folder per project, named after the project slug:
  `public/media/projects/<project-slug>/`.
- Reference files from the admin (and from Markdown descriptions) using the
  app-relative path shown above, not a filesystem path.
- The first ordered `ProjectMedia` row of a project acts as its banner/cover,
  so name the cover asset `banner.*` to keep things obvious.
- There is intentionally no upload API and no external storage provider;
  commit the files alongside the code.

The SVG files here are placeholder fixtures used for local testing. Replace
them with real assets (for example `.webp` exports) and delete anything you
do not need.
