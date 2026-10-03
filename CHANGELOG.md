## v0.1.1 (2026-10-03)

### Fix

- evita reatribuir command/running num Process já em execução (troca rápida de faixa) e corrige corrida onde arte de uma faixa antiga podia ressuscitar
- mescla os dois Component.onCompleted duplicados (quebrava o carregamento do service)
- valida a capa do álbum (bytes, timeout, dimensões decodificadas) antes do QML Image, contra bomba de descompressão via MPRIS não confiável
- disable qmllint's alias category too

### Refactor

- usa Util.alpha() e CursorSurface (componentes do Omarchy) em vez de reimplementar hover/seleção e alpha na mão

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
