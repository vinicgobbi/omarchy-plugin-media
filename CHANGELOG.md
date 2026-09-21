## v0.1.0 (2026-09-21)

### Feat

- make the bar's play/pause icon a button
- add previous and next buttons to the bar, configurable
- add advanced options menu and more bar content options
- add volume, shuffle, repeat, speed, seek and keyboard control
- initial Media Manager plugin cloned from omarchy.media

### Fix

- make the open-popup indicator cover the whole widget
- sanitize player metadata before showing it
- keep the manually selected player active and ignore idle ones
- rename seek bar id that shadowed the widget's bar property
- resolve the media service through the omarchy.media id

### Refactor

- store the options inline on the widget entry in shell.json
