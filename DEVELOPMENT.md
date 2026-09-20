# Development

## Local setup

Symlink this repo into your Omarchy plugins directory so edits hot-reload
without reinstalling:

```bash
ln -s "$(pwd)" ~/.config/omarchy/plugins/vinicgobbi.media
omarchy plugin enable vinicgobbi.media
```

This plugin is a clone of the built-in `omarchy.media`, so disable the
media widget you were using before (`omarchy.media` or `bibek.media`) to
avoid two media services running at once.

Saving `BarWidget.qml` (the plugin's entry point) hot-reloads on its own.
If a change to `Service.qml` doesn't show up, fully restart the shell:

```bash
omarchy restart shell
```

Validate the manifest before publishing:

```bash
omarchy plugin validate .
```

## Structure

- `manifest.json` — plugin metadata (id, kinds, entry points)
- `BarWidget.qml` — the bar widget, click handling and the popup:
  album art, track info, progress/seek bar, transport buttons and the
  source list
- `Service.qml` — the MPRIS service: active player selection, playback
  actions and the `media` IPC target
- `MediaModel.js` — helpers that build the list of media sources

## Design notes

- **Click mapping** (inverted from `omarchy.media`): left click toggles
  the popup, right click plays/pauses, middle click skips to the next
  track. The handler lives in the `MouseArea` in `BarWidget.qml`.
- **Progress bar**: only shown when the player reports both `position`
  and `length` (`positionSupported` / `lengthSupported`). It is
  interactive only if `canSeek` is true. MPRIS doesn't push position
  updates while playing, so a 250 ms `Timer` calls `positionChanged()`
  while the popup is open and the media is playing. While dragging, the
  bar shows the dragged position and the seek is applied on release.
- **Service id**: `BarWidget.qml` resolves the service through
  `firstPartyServiceFor("vinicgobbi.media")`, so the id must match
  `manifest.json`.

## Commits and releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
and are checked with [Commitizen](https://commitizen-tools.github.io/commitizen/):

```bash
pipx install commitizen
cz commit   # interactive, conventional-commits-compliant commit
```

Releases are manual: run `.github/workflows/release.yml` from the
Actions tab (`Run workflow`, on `main`). It only runs when dispatched
against `main`, and uses Commitizen to bump `manifest.json`'s version
and the changelog based on the commit types since the last release,
tags it (`vX.Y.Z`), and publishes a GitHub Release with the changelog
entry. If there's nothing to bump (no `feat`/`fix`/`BREAKING CHANGE`
commits since the last release), it's a no-op — no tag, no release.
