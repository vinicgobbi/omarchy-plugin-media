function isProxyPlayer(player) {
  var dbusName = String(player && player.dbusName || "").toLowerCase()
  var desktopEntry = String(player && player.desktopEntry || "").toLowerCase()
  return dbusName.indexOf("playerctld") !== -1 || desktopEntry === "playerctld"
}

function hasMetadata(player) {
  return !!(player && (player.trackTitle || player.trackArtist || player.identity || player.desktopEntry))
}

function hasTrackMetadata(player) {
  return !!(player && (player.trackTitle || player.trackArtist || player.trackAlbum || player.trackArtUrl))
}

function playerCanControl(player) {
  return !!(player && (player.canTogglePlaying || player.canPlay || player.canPause || player.canGoNext || player.canGoPrevious))
}

function canHandleAction(player, action) {
  if (!player) return false
  if (action === "next") return !!player.canGoNext
  if (action === "previous") return !!player.canGoPrevious
  if (action === "play") return !!(player.canPlay || player.canTogglePlaying)
  if (action === "pause") return !!(player.canPause || player.canTogglePlaying)
  if (action === "playPause") return !!(player.canTogglePlaying || player.canPlay || player.canPause)
  return false
}

function canCycleSource(player) {
  return !!(player && hasMetadata(player) && (player.isPlaying || player.canPlay))
}

function nodeProps(node) {
  return node && node.ready && node.properties ? node.properties : {}
}

function isPlaybackStream(node) {
  if (!node || !node.isStream) return false
  if (node.isSink === true) return true

  var mediaClass = String(node.type || "")
  return mediaClass.indexOf("Stream/Output/Audio") !== -1
    || mediaClass.indexOf("AudioOutStream") !== -1
    || mediaClass.indexOf("Output") !== -1
}

function streamLabelKey(label) {
  var key = String(label || "").toLowerCase()
  key = key.replace(/^pipewire alsa \[/, "")
  key = key.replace(/\]$/, "")
  key = key.replace(/^alsa playback \[/, "")
  key = key.replace(/[^a-z0-9]+/g, "")
  return key
}

function rawStreamLabel(node) {
  if (!node) return ""
  var p = nodeProps(node)
  return p["application.name"]
    || node.description
    || p["media.name"]
    || p["node.name"]
    || node.name
}

function playerAppLabel(player) {
  if (!player) return ""
  var dbus = String(player.dbusName || "")
  dbus = dbus.replace(/^org\.mpris\.MediaPlayer2\./, "")
  dbus = dbus.replace(/\.instance[0-9]+$/, "")
  return player.desktopEntry || player.identity || dbus
}

function playerHasPlaybackStream(player, playbackStreams) {
  var playerKey = streamLabelKey(playerAppLabel(player))
  if (!playerKey) return false

  var streams = Array.isArray(playbackStreams) ? playbackStreams : []
  for (var i = 0; i < streams.length; i++) {
    var streamKey = streamLabelKey(rawStreamLabel(streams[i]))
    if (!streamKey) continue
    if (streamKey === playerKey
        || streamKey.indexOf(playerKey) !== -1
        || playerKey.indexOf(streamKey) !== -1)
      return true
  }

  return false
}

function playerKey(player) {
  if (!player) return ""
  return String(player.dbusName || player.desktopEntry || player.identity || "")
}

function trackSignature(player) {
  if (!player) return ""
  return [
    player.trackTitle || "",
    player.trackArtist || "",
    player.trackAlbum || "",
    player.trackArtUrl || ""
  ].join("\u001f")
}

function trackChanged(previousSignature, player) {
  return trackSignature(player) !== String(previousSignature || "")
}

function labelFor(player) {
  if (!player) return ""
  return clip(player.trackTitle || player.identity || player.desktopEntry || "")
}

function osdMessage(player, fallback) {
  if (!player) return fallback
  var label = labelFor(player)
  if (label && player.trackArtist) return label + " - " + clip(player.trackArtist)
  return label || fallback
}


// --- untrusted metadata -----------------------------------------------------
// Everything a player reports (title, artist, cover URL...) is controlled by
// whatever app or web page is playing, so it is limited before it is shown.

var MAX_FIELD_CHARS = 300

// Caps a metadata field so a huge string can't stall the shell's text layout.
function clip(value, max) {
  var t = String(value === undefined || value === null ? "" : value)
  var limit = max || MAX_FIELD_CHARS
  return t.length > limit ? t.slice(0, limit - 1) + "\u2026" : t
}

// Host names that point at this machine or the local network.
function isPrivateHost(host) {
  var h = String(host || "").toLowerCase()
  if (h === "" || h === "localhost" || h.charAt(0) === "[") return true
  if (/\.(local|localhost|internal|lan|home|corp|intranet)$/.test(h)) return true
  var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h)
  if (!m) return false
  var a = parseInt(m[1], 10), b = parseInt(m[2], 10)
  return a === 0 || a === 10 || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127)
}

// Cover art URL that is safe to hand to an Image: https to a public host, or
// a local file. Anything else (http, data:, internal hosts...) becomes "".
// Otherwise a web page playing audio could make the shell request any URL.
function safeArtUrl(url) {
  var u = String(url || "")
  if (u === "" || u.length > 2048 || /[\s\u0000-\u001f]/.test(u)) return ""
  if (/^file:\/\/\//i.test(u)) return u
  var m = /^https:\/\/([^\/?#:@]+)(?::(\d{1,5}))?(?:[\/?#]|$)/i.exec(u)
  if (!m) return ""
  return isPrivateHost(m[1]) ? "" : u
}

// --- bar widget preferences -------------------------------------------------

function defaultPrefs() {
  return {
    showIcon: true,       // play/pause glyph
    showPrevious: false,  // clickable "previous track" button next to the icon
    showNext: false,      // clickable "next track" button next to the icon
    showCover: false,     // small album art before the text
    showTitle: true,
    showArtist: true,
    showAlbum: false,
    showPlayer: false,    // name of the app playing (Spotify, Chrome...)
    showTime: false,      // elapsed / total time
    artistFirst: false,   // "artist · title" instead of "title · artist"
    separator: "\u00b7",  // between the pieces of text
    hideWhenPaused: false,
    dynamicWidth: false,  // true: always show the whole text and fit the widget to it
    // The next three only apply to a fixed width (dynamicWidth false):
    textMode: "scroll",   // "scroll" (marquee) or "ellipsis" (cut at maxChars with "...")
    maxWidth: 180,        // widget width in px
    maxChars: 40
  }
}

var SEPARATORS = ["\u00b7", "-", "|", "/"]

function clampInt(value, min, max, fallback) {
  var n = parseInt(value, 10)
  if (isNaN(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function normalizePrefs(input) {
  var d = defaultPrefs()
  var src = input && typeof input === "object" ? input : {}
  function bool(name) { return typeof src[name] === "boolean" ? src[name] : d[name] }
  return {
    showIcon: bool("showIcon"),
    showPrevious: bool("showPrevious"),
    showNext: bool("showNext"),
    showCover: bool("showCover"),
    showTitle: bool("showTitle"),
    showArtist: bool("showArtist"),
    showAlbum: bool("showAlbum"),
    showPlayer: bool("showPlayer"),
    showTime: bool("showTime"),
    artistFirst: bool("artistFirst"),
    separator: SEPARATORS.indexOf(src.separator) !== -1 ? src.separator : d.separator,
    hideWhenPaused: bool("hideWhenPaused"),
    dynamicWidth: bool("dynamicWidth"),
    textMode: src.textMode === "ellipsis" ? "ellipsis" : "scroll",
    maxWidth: clampInt(src.maxWidth, 60, 600, d.maxWidth),
    maxChars: clampInt(src.maxChars, 5, 200, d.maxChars)
  }
}

// What to store on the widget's entry in shell.json: only the options that
// differ from the defaults, plus any keys of the existing entry that aren't
// ours (so we never drop settings we don't know about).
function entrySettings(prefs, existing) {
  var d = defaultPrefs()
  var out = {}
  var src = existing && typeof existing === "object" ? existing : {}
  for (var k in src) if (!(k in d) && k !== "id") out[k] = src[k]
  for (var name in d) if (prefs[name] !== d[name]) out[name] = prefs[name]
  return out
}

function ellipsize(text, maxChars) {
  var t = String(text || "")
  if (maxChars <= 3 || t.length <= maxChars) return t
  // Don't leave a separator dangling in front of the dots.
  return t.slice(0, maxChars - 3).replace(/[\s\u00b7|\/-]+$/, "") + "..."
}

// Text shown next to the glyph in the bar, per the user's preferences.
// `info` is { title, artist, album, player }.
function barLabel(info, prefs) {
  var parts = []
  var title = prefs.showTitle && info.title ? info.title : ""
  var artist = prefs.showArtist && info.artist ? info.artist : ""
  if (prefs.showPlayer && info.player) parts.push(info.player)
  var pair = prefs.artistFirst ? [artist, title] : [title, artist]
  for (var i = 0; i < pair.length; i++) if (pair[i]) parts.push(pair[i])
  if (prefs.showAlbum && info.album) parts.push(info.album)
  var text = parts.join("  " + prefs.separator + "  ")
  // Fitting the text means never shortening it.
  return !prefs.dynamicWidth && prefs.textMode === "ellipsis" ? ellipsize(text, prefs.maxChars) : text
}

if (typeof module !== "undefined") {
  module.exports = {
    isProxyPlayer: isProxyPlayer,
    hasMetadata: hasMetadata,
    hasTrackMetadata: hasTrackMetadata,
    playerCanControl: playerCanControl,
    canHandleAction: canHandleAction,
    canCycleSource: canCycleSource,
    nodeProps: nodeProps,
    isPlaybackStream: isPlaybackStream,
    streamLabelKey: streamLabelKey,
    rawStreamLabel: rawStreamLabel,
    playerAppLabel: playerAppLabel,
    playerHasPlaybackStream: playerHasPlaybackStream,
    playerKey: playerKey,
    trackSignature: trackSignature,
    trackChanged: trackChanged,
    labelFor: labelFor,
    osdMessage: osdMessage,
    defaultPrefs: defaultPrefs,
    normalizePrefs: normalizePrefs,
    clip: clip,
    safeArtUrl: safeArtUrl,
    isPrivateHost: isPrivateHost,
    entrySettings: entrySettings,
    ellipsize: ellipsize,
    barLabel: barLabel
  }
}
