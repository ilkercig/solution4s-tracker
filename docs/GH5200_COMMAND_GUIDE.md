# GH5200 Command Integration Guide

> Covers: sending commands to the GH5200, tracking execution, and real-time event monitoring.

---

## 1. Controlling Movement Event (Parameter 12106)

The GH5200 Movement Event scenario is toggled via `setparam` over the Codec 12 GPRS command channel.

### Disable Movement Event

```bash
POST /api/commands/send
Content-Type: application/json

{
  "deviceId": 1,
  "type": "custom",
  "attributes": {
    "data": "setparam 12106:0"
  }
}
```

### Enable Movement Event

```bash
POST /api/commands/send
Content-Type: application/json

{
  "deviceId": 1,
  "type": "custom",
  "attributes": {
    "data": "setparam 12106:1"
  }
}
```

**Parameter reference:**

| Parameter ID | Type | Value | Meaning |
|---|---|---|---|
| 12106 | Uint8 | `0` | Disable Movement Event scenario |
| 12106 | Uint8 | `1` | Enable Movement Event scenario |

### How it works internally

`TeltonikaProtocolEncoder.encodeCommand()` receives the `custom` command. Since `"setparam 12106:0"` is not a pure hex string, it encodes it as ASCII bytes and wraps them in a **Codec 12** binary frame (preamble + length + codec ID `0x0C` + CRC-16/IBM). The GH5200 processes the command and sends a Codec 12 response back over the same TCP connection.

### API responses

| HTTP status | Meaning |
|---|---|
| `200 OK` | Command sent immediately to device |
| `202 Accepted` | Device offline; command queued in `tc_commands_queue` |
| `500` | Device offline and `noQueue: true` was set |

To prevent queuing and fail immediately when the device is offline, add `"noQueue": true` to `attributes`.

---

## 2. Knowing if a Command Was Executed

### Two confirmation signals

| Event type | When it fires | What it means |
|---|---|---|
| `commandResult` | Device sends a Codec 12 response back | Device actually processed the command; `attributes.result` holds the device's response string |
| `queuedCommandSent` | Queued command is flushed on device reconnect | Command was delivered over the wire (not necessarily confirmed executed) |

`commandResult` is the strongest signal. For `setparam`, the GH5200 returns `"New value <paramId>:<value>;"` on success, or an error string on failure.

### How `commandResult` is generated

1. GH5200 sends a Codec 12 response packet.
2. `TeltonikaProtocolDecoder.decodeSerial()` reads the response payload.
3. If the payload is printable ASCII, it sets `position.attributes["result"]` to that string.
4. `CommandResultEventHandler` detects the `result` attribute and fires a `commandResult` event.

---

## 3. Receiving Events in Real Time (WebSocket)

Connect once and listen for server-pushed JSON frames — no polling needed.

### Connect

```
GET ws://<host>/api/socket
```

Authenticate via session cookie (obtained from `POST /api/session`) or HTTP Basic auth header.

### Message format

```json
{
  "events": [
    {
      "id": 42,
      "type": "commandResult",
      "deviceId": 1,
      "positionId": 999,
      "attributes": {
        "result": "New value 12106:0;"
      }
    }
  ]
}
```

Other top-level keys that can appear in the same frame:

| Key | Content |
|---|---|
| `positions` | Updated `Position` objects |
| `devices` | Updated `Device` objects |
| `events` | `Event` objects (all event types) |
| `logs` | Log records (only if client sends `{"logs": true}`) |

### Filtering relevant events

Watch for `event.type`:

- **`"commandResult"`** — command confirmed by device; read `attributes.result`
- **`"queuedCommandSent"`** — queued command delivered on reconnect

### Fetch a specific event by ID (REST)

```
GET /api/events/{id}
```

Returns a single `Event` object. Useful if you stored an event ID from a WebSocket message and need to retrieve it later.

---

## 4. End-to-End Flow

```
POST /api/commands/send  { "type": "custom", "data": "setparam 12106:0" }
        │
        ├─ 200 OK ──► command sent over Codec 12 immediately
        │                 └─ GH5200 replies over TCP
        │                       └─ decoder sets position.result
        │                             └─ WebSocket pushes:
        │                                  { "events": [{ "type": "commandResult",
        │                                                  "attributes": { "result": "..." } }] }
        │
        └─ 202 Accepted ──► command stored in tc_commands_queue
                               └─ device reconnects → command flushed
                                     └─ WebSocket pushes:
                                          { "events": [{ "type": "queuedCommandSent" }] }
                                               └─ device replies → WebSocket pushes:
                                                    { "events": [{ "type": "commandResult",
                                                                    "attributes": { "result": "..." } }] }
```

---

## 5. GH5200-Specific Caveats

| Situation | Effect on commands |
|---|---|
| **Deep Sleep** (AVL ID 200 = 2) | GPRS commands not received; command stays queued; no `commandResult` until device wakes |
| **Online Deep Sleep** (AVL ID 200 = 3) | GSM active; GPRS commands arrive normally; `commandResult` expected |
| **GNSS Sleep** (AVL ID 200 = 1) | GPRS active; commands work normally |
| `setparam` success | Device replies `"New value <paramId>:<value>;"` |
| `setparam` failure (invalid param) | Device replies with error string in `result` |

> When `sleepMode` attribute is 2 (Deep Sleep), do not treat absence of `commandResult` as a failure — the command is safely queued and will execute on wake.

---

## 6. Supported Data-Channel Command Types (Teltonika Protocol)

| Type string | Encoded as | Notes |
|---|---|---|
| `custom` | ASCII text or binary (hex) wrapped in Codec 12 | Use for `setparam`, `getparam`, `readio`, etc. |
| `engineStop` | `setdigout 1` in Codec 12 | Hard-coded in encoder |
| `engineResume` | `setdigout 0` in Codec 12 | Hard-coded in encoder |

All other command types are not supported on the data channel for this protocol.

For the `custom` type: if `data` matches the pattern `([0-9A-Fa-f]{2})+` it is treated as a hex string and sent as raw binary; otherwise it is sent as ASCII text.
