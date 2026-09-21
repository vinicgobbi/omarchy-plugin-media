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
`Service.qml` is `keepLoaded`, so a change to it only takes effect after a
full shell restart; the same goes for a component the shell has already
cached, like `AdvancedSettings.qml`. If a change doesn't show up:

```bash
omarchy restart shell
```

The restart takes a while and the old process lingers for a moment, so
give it ~30 s before judging the result.

Validate the manifest before publishing:

```bash
omarchy plugin validate .
```

## Structure

- `manifest.json` — plugin metadata (id, kinds, entry points) and the
  `barWidget.defaults` / `schema` for the options
- `BarWidget.qml` — the bar widget, click handling and the popup:
  album art, track info, progress/seek bar, transport buttons, volume and
  the source list; also reads and writes the options
- `AdvancedSettings.qml` — the options view shown inside the popup
  (preview + Content / Format / Size tabs)
- `Service.qml` — the MPRIS service: active player selection, playback
  actions and the `media` IPC target
- `MediaModel.js` — pure helpers: player/source helpers and the options
  (defaults, normalizing, the bar text)

## Design notes

- **Click mapping** (inverted from `omarchy.media`): left click toggles
  the popup, right click plays/pauses, middle click skips to the next
  track. The handler lives in the `MouseArea` in `BarWidget.qml`.
- **Options are inline on the widget's entry** in `shell.json`, as the
  Omarchy storage rules require (no separate settings file). The bar
  injects them as `settings`; `BarWidget.qml` normalizes them with
  `MediaModel.normalizePrefs` and writes changes back with
  `bar.shell.updateEntryInline(...)`, storing only the values that differ
  from the defaults (`MediaModel.entrySettings`). A change shows up
  immediately (`pendingPrefs`) and is dropped once the shell has reloaded
  the file.
- **Keep the option lists in sync**: `MediaModel.defaultPrefs()` and the
  manifest's `barWidget.defaults` / `schema` describe the same options. Add
  or change one, change the others.
- **Bar buttons and the widget MouseArea**: the widget-wide `MouseArea`
  (popup / play-pause / next / wheel) is declared after the icon `Row`, so
  it would swallow clicks meant for the play/pause icon and the previous /
  next buttons. The `Row` therefore has `z: 1`, and only the `BarButton`s
  have handlers (left button only); clicks on anything else in the row, and
  right / middle clicks, fall through to that `MouseArea`. Buttons go
  through `transport(...)` like every other action, so they are rate-limited.
  On a vertical bar the icon is the whole widget, so it is not clickable
  there (`clickable: false`) and a click opens the popup instead.
- **Fit vs fixed width**: with `dynamicWidth` the widget shows the whole
  text and never scrolls or cuts it. Scrolling and cutting (`textMode`,
  `maxWidth`, `maxChars`) only apply to a fixed width.
- **Progress bar**: only shown when the player reports both `position`
  and `length` (`positionSupported` / `lengthSupported`). It is
  interactive only if `canSeek` is true. MPRIS doesn't push position
  updates while playing, so a 250 ms `Timer` calls `positionChanged()`
  while the popup is open and the media is playing (the bar's own time is
  polled every second, only when `showTime` is on). While dragging, the
  bar shows the dragged position and the seek is applied on release.
- **Rate-limited actions**: every action is a D-Bus call and `isPlaying`
  lags the real state, so play/pause/next/previous are ignored when they
  arrive too soon after the previous one, and volume drags and wheel seeks
  are batched (`transport`, `queueVolume`, `queueSeek`).
- **Player selection**: choosing a player by hand (list click, Tab) pins
  it in `Service.qml` until a different player starts playing or it goes
  away. Stopped players without a track (Spotify's embedded Chromium
  registers an empty one) are ignored.
- **Player metadata is untrusted**: title, artist, album, player name and
  the cover URL are set by whatever is playing, including web pages.
  Never show them raw. Text goes through `MediaModel.clip` (300 chars max,
  so a huge string can't stall the shell) and every `Text` that shows it
  uses `textFormat: Text.PlainText`. The cover goes through
  `MediaModel.safeArtUrl`, which only lets `https://` to a public host or a
  local `file:///` path reach an `Image`; `http://`, `data:` and
  loopback/private/`.local` hosts are dropped so a page can't make the shell
  request internal URLs.
- **Service id**: `BarWidget.qml` resolves the service through
  `firstPartyServiceFor("omarchy.media")`; the shell routes it to the
  enabled clone (via `omarchy.clonedFrom` in `manifest.json`).
- **Don't reuse `id: bar`**: `bar` is the widget's own property
  (`bar?.shell`, `bar.foreground`, ...). An item with `id: bar` in this
  file shadows it, so the service resolves to nothing and the widget
  stays hidden. The seek track is `seekBar` for that reason.
- **Use the shell's controls** (`ToggleSwitch`, `ButtonGroup`,
  `NumberField`, `PanelSectionHeader`, ...) in the options view instead of
  drawing your own, so it matches the other Omarchy panels.

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
