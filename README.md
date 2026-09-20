# omarchy-plugin-media-manager

A media bar-widget for the [Omarchy](https://omarchy.org/) shell, cloned
from the built-in `omarchy.media`. It shows what's playing over MPRIS and
opens a popup with playback controls and a live progress bar you can seek
with.

## Features

- Bar widget with the play/pause state and "title · artist"
- Popup with album art, track info and previous / play-pause / next
- **Live progress bar** with elapsed and total time, updated in real time
- **Seek** by clicking or dragging the bar (when the player allows it)
- Source list to switch between players
- `media` IPC target for scripts and hotkeys

## Install

```bash
omarchy plugin add https://github.com/vinicgobbi/omarchy-plugin-media-manager.git --enable
```

Disable any other media widget (`omarchy.media`, `bibek.media`) so only
one media service is active.

## Usage

| Action           | Effect               |
| ---------------- | -------------------- |
| Left click       | Toggle the popup     |
| Right click      | Play / pause         |
| Middle click     | Next track           |
| Scroll up        | Previous track       |
| Scroll down      | Next track           |

This is the inverse of `omarchy.media`, where left click plays/pauses and
right click opens the popup.

### Progress bar

- Shown only when the player reports both position and length. Live
  streams and players without them get no bar.
- If the player doesn't support seeking, the bar is display-only.
- Click anywhere on the bar to jump there, or drag; the seek is applied
  when you release the mouse.

## Uninstall

```bash
omarchy plugin remove vinicgobbi.media
```

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup, the plugin's file
structure, and the commit/release process.

## Credits

Based on the built-in `omarchy.media` plugin by the Omarchy team.

## License

[MIT](LICENSE)
