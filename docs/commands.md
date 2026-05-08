# Traccar Commands — Developer Guide

This document covers everything needed to understand, use, and extend the Traccar command system.

---

## Overview

Commands are instructions sent **from the Traccar server to a GPS device**. They travel over one of two channels:

| Channel | Mechanism | Requirement |
|---|---|---|
| **Data** (default) | Live TCP/UDP connection the device already has open | Device must be connected |
| **Text** | SMS | SMS provider configured on the server; device must have a `phone` field set |

When a device is offline and a data-channel command is submitted (without `noQueue: true`), it is stored in the `tc_queued_commands` table and delivered automatically on the next reconnect.

---

## Command Types

All constants live in `Command.java:27-71`. The string value shown is what you send in the REST API.

### General

| Constant | String value | Description |
|---|---|---|
| `TYPE_CUSTOM` | `custom` | Raw bytes (HEX for binary protocols) or plain text. Always supported on every protocol. |
| `TYPE_IDENTIFICATION` | `deviceIdentification` | Request the device to re-identify itself |
| `TYPE_GET_VERSION` | `getVersion` | Request firmware/hardware version |
| `TYPE_GET_MODEM_STATUS` | `getModemStatus` | Request modem status information |
| `TYPE_GET_DEVICE_STATUS` | `getDeviceStatus` | Request general device status |
| `TYPE_REBOOT_DEVICE` | `rebootDevice` | Reboot the device |
| `TYPE_POWER_OFF` | `powerOff` | Power off the device |
| `TYPE_FACTORY_RESET` | `factoryReset` | Restore factory defaults |

### Position / Tracking

| Constant | String value | Parameters | Description |
|---|---|---|---|
| `TYPE_POSITION_SINGLE` | `positionSingle` | — | Request one position report immediately |
| `TYPE_POSITION_PERIODIC` | `positionPeriodic` | `frequency` (int, seconds) | Set periodic reporting interval |
| `TYPE_POSITION_STOP` | `positionStop` | — | Stop periodic position reporting |

### Engine / Output Control

| Constant | String value | Description |
|---|---|---|
| `TYPE_ENGINE_STOP` | `engineStop` | Cut engine / immobilize vehicle |
| `TYPE_ENGINE_RESUME` | `engineResume` | Re-enable engine |
| `TYPE_OUTPUT_CONTROL` | `outputControl` | Toggle a digital output; uses `index` (output number) and `data` (value) |

### Alarm Configuration

| Constant | String value | Parameters | Description |
|---|---|---|---|
| `TYPE_ALARM_ARM` | `alarmArm` | — | Arm the device alarm |
| `TYPE_ALARM_DISARM` | `alarmDisarm` | — | Disarm the device alarm |
| `TYPE_ALARM_DISMISS` | `alarmDismiss` | — | Dismiss an active alarm |
| `TYPE_ALARM_GEOFENCE` | `alarmGeofence` | `radius` | Configure geofence alarm radius |
| `TYPE_ALARM_BATTERY` | `alarmBattery` | `enable` | Enable/disable low-battery alarm |
| `TYPE_ALARM_SOS` | `alarmSos` | `enable` | Enable/disable SOS alarm |
| `TYPE_ALARM_REMOVE` | `alarmRemove` | `enable` | Enable/disable device-removal alarm |
| `TYPE_ALARM_CLOCK` | `alarmClock` | — | Set alarm clock |
| `TYPE_ALARM_SPEED` | `alarmSpeed` | — | Configure speed alarm |
| `TYPE_ALARM_FALL` | `alarmFall` | `enable` | Enable/disable fall-detection alarm |
| `TYPE_ALARM_VIBRATION` | `alarmVibration` | `enable` | Enable/disable vibration alarm |

### Communication / SIM

| Constant | String value | Parameters | Description |
|---|---|---|---|
| `TYPE_SEND_SMS` | `sendSms` | `phone`, `message` | Send an SMS from the device |
| `TYPE_SEND_USSD` | `sendUssd` | `data` | Send a USSD code |
| `TYPE_SOS_NUMBER` | `sosNumber` | `index`, `phone` | Set an SOS contact number |
| `TYPE_SET_PHONEBOOK` | `setPhonebook` | `data` | Upload phonebook |
| `TYPE_MESSAGE` | `message` | `message` | Display a text message on the device |
| `TYPE_VOICE_MESSAGE` | `voiceMessage` | — | Trigger a voice message |
| `TYPE_VOICE_MONITORING` | `voiceMonitoring` | `enable` | Enable/disable voice monitoring |

### Device Configuration

| Constant | String value | Parameters | Description |
|---|---|---|---|
| `TYPE_SET_TIMEZONE` | `setTimezone` | `timezone` (TZ string) | Set device timezone |
| `TYPE_SET_CONNECTION` | `setConnection` | `server`, `port` | Change the server the device reports to |
| `TYPE_SET_ODOMETER` | `setOdometer` | `data` | Set odometer value |
| `TYPE_SET_SPEED_LIMIT` | `setSpeedLimit` | `data` | Configure on-device speed limit |
| `TYPE_SET_AGPS` | `setAgps` | — | Trigger AGPS data update |
| `TYPE_SET_INDICATOR` | `setIndicator` | `enable` | Enable/disable LED indicator |
| `TYPE_CONFIGURATION` | `configuration` | `data` | Send arbitrary configuration string |
| `TYPE_FIRMWARE_UPDATE` | `firmwareUpdate` | `data` | Initiate firmware update (URL/path in `data`) |
| `TYPE_SILENCE_TIME` | `silenceTime` | — | Set silence/do-not-disturb time |

### Power Modes

| Constant | String value | Description |
|---|---|---|
| `TYPE_MODE_POWER_SAVING` | `modePowerSaving` | Switch device to power-saving mode |
| `TYPE_MODE_DEEP_SLEEP` | `modeDeepSleep` | Switch device to deep-sleep mode |

### Camera / Media

| Constant | String value | Description |
|---|---|---|
| `TYPE_REQUEST_PHOTO` | `requestPhoto` | Request a photo from a camera-equipped device |

---

## Command Parameters (Keys)

Parameters are passed as a JSON attributes map on the `Command` object. All key constants are in `Command.java:73-86`.

| Constant | Key string | Type | Used by |
|---|---|---|---|
| `KEY_UNIQUE_ID` | `uniqueId` | String | Device identification |
| `KEY_FREQUENCY` | `frequency` | int (seconds) | `positionPeriodic` |
| `KEY_LANGUAGE` | `language` | String | Localization |
| `KEY_TIMEZONE` | `timezone` | String (IANA TZ) | `setTimezone` |
| `KEY_DEVICE_PASSWORD` | `devicePassword` | String | Auth-protected commands |
| `KEY_RADIUS` | `radius` | int (meters) | `alarmGeofence` |
| `KEY_MESSAGE` | `message` | String | `message`, `sendSms` |
| `KEY_ENABLE` | `enable` | boolean | Various alarm toggles |
| `KEY_DATA` | `data` | String | `custom`, `configuration`, `firmware`, USSD |
| `KEY_INDEX` | `index` | int | `outputControl`, `sosNumber` |
| `KEY_PHONE` | `phone` | String | `sendSms`, `sosNumber` |
| `KEY_SERVER` | `server` | String | `setConnection` |
| `KEY_PORT` | `port` | int | `setConnection` |
| `KEY_NO_QUEUE` | `noQueue` | boolean | Skip queuing; fail immediately if offline |

---

## REST API

### Send a command

```
POST /api/commands/send
POST /api/commands/send?groupId={groupId}   ← send to all devices in a group
```

**Request body:**

```json
{
  "deviceId": 1,
  "type": "positionPeriodic",
  "attributes": {
    "frequency": 30
  }
}
```

To send a saved command by ID (pre-configured in the UI), set `id` instead of `type`:

```json
{
  "id": 5,
  "deviceId": 1
}
```

**Responses:**

- `200 OK` — command sent immediately.
- `202 Accepted` — command queued (device offline); body contains the `QueuedCommand` object(s).

To prevent queuing and fail immediately if the device is offline, add `"noQueue": true` to `attributes`.

### List sendable saved commands for a device

```
GET /api/commands/send?deviceId={deviceId}
```

Returns only commands compatible with the device's current protocol and channel.

### List all available command types

```
GET /api/commands/types
GET /api/commands/types?deviceId={deviceId}&textChannel={true|false}
```

Without `deviceId`, returns all known types. With `deviceId`, filters to types the device's protocol actually supports.

### CRUD for saved commands

```
GET    /api/commands          ← list saved commands visible to current user
POST   /api/commands          ← create a saved command
PUT    /api/commands/{id}     ← update
DELETE /api/commands/{id}     ← delete
```

---

## Delivery Architecture

```
POST /api/commands/send
        │
        ▼
  CommandsManager.sendCommand()
        │
        ├─ textChannel = true ──► SmsManager.sendMessage()  (protocol.sendTextCommand())
        │
        └─ textChannel = false
                │
                ├─ CommandSender found (Firebase / Traccar push / FindHub)
                │        └──► CommandSender.sendCommand()
                │
                ├─ Device online (DeviceSession.supportsLiveCommands())
                │        └──► DeviceSession.sendCommand()
                │                  └──► BaseProtocol.sendDataCommand()
                │                            └──► channel.writeAndFlush()
                │
                └─ Device offline + noQueue = false
                         └──► store in tc_queued_commands
                                  └──► delivered on next reconnect
```

When a device reconnects, `BaseProtocolDecoder.getDeviceSession()` triggers `CommandsManager.readQueuedCommands()`, which dequeues and sends all pending commands and fires a `commandQueued` event.

---

## Command Senders (Push / Cloud)

For mobile or cloud-connected devices that do not maintain a persistent TCP connection, three `CommandSender` implementations are available. The sender is selected per-device via the `command.sender` device attribute, or auto-detected from `notificationTokens`.

### Selection logic (`CommandSenderManager`)

1. If the device has a `command.sender` attribute (`firebase`, `traccar`, or `findHub`) → use that sender explicitly.
2. Else if the device has `notificationTokens`:
   - `command.client.serviceAccount` configured → **FirebaseCommandSender**
   - `notificator.traccar.key` configured → **TraccarCommandSender**
3. Otherwise → fall through to live TCP or queue.

### FirebaseCommandSender

Sends commands via **Firebase Cloud Messaging (FCM)** to the Traccar Client app on Android/iOS.

**Server config key:** `command.client.serviceAccount` — full Firebase service-account JSON string.

Supported commands: `positionSingle`, `positionPeriodic`, `positionStop`, `factoryReset`.

Payload sent via FCM data message:

```json
{ "command": "positionPeriodic", "deviceId": "<uniqueId>", "interval": "30" }
```

### TraccarCommandSender

Sends commands via the **Traccar push relay** (`https://www.traccar.org/push/`) to the Traccar Client app.

**Server config key:** `notificator.traccar.key` — API key for the Traccar push service.

Supported commands: `positionSingle`, `positionPeriodic`, `positionStop`, `factoryReset`.

### FindHubCommandSender

Sends commands to **Google Find Hub** devices via their REST API.

**Device attributes required:**

| Attribute | Config key | Description |
|---|---|---|
| `command.findHub.url` | `Keys.COMMAND_FIND_HUB_URL` | Base URL of the Find Hub service |
| `command.findHub.key` | `Keys.COMMAND_FIND_HUB_KEY` | Bearer token for authentication |

Supported commands: `positionSingle`, `positionPeriodic`, `positionStop`.

The command type is converted to kebab-case and appended as a URL path segment:
```
POST {url}/devices/{uniqueId}/position-periodic?interval=30
```

---

## Protocol Support

`custom` is always supported by every protocol (both data and text channels). All other command types must be explicitly registered by each protocol.

In a `*Protocol.java` constructor:

```java
// Register data-channel (TCP/UDP) commands
setSupportedDataCommands(
    Command.TYPE_ENGINE_STOP,
    Command.TYPE_ENGINE_RESUME,
    Command.TYPE_POSITION_PERIODIC
);

// Register text-channel (SMS) commands
setSupportedTextCommands(
    Command.TYPE_ENGINE_STOP,
    Command.TYPE_ENGINE_RESUME
);
```

Protocols with data-command support include (non-exhaustive): ADM, Atrack, BCE, Castel, Cellocator, EasyTrack, Eelink, Galileo, GL200, GT06, H02, Huabao, Meitrack, Navtelecom, Ruptela, Suntech, Teltonika, TK103, Totem, Wialon, and many more.

Protocols with SMS-command support: Granit, Totem, Wondex.

---

## Adding Command Support to a Protocol

### 1. Register the command type

In `XxxProtocol.java`:

```java
setSupportedDataCommands(Command.TYPE_ENGINE_STOP, Command.TYPE_ENGINE_RESUME);
```

### 2. Implement the encoder

Create `XxxProtocolEncoder.java` extending `BaseProtocolEncoder`:

```java
public class XxxProtocolEncoder extends BaseProtocolEncoder {
    @Override
    protected Object encodeCommand(Channel channel, SocketAddress remoteAddress, Command command) {
        return switch (command.getType()) {
            case Command.TYPE_ENGINE_STOP  -> encodeContent("STOP");
            case Command.TYPE_ENGINE_RESUME -> encodeContent("RESUME");
            default -> null;  // null means "not supported"
        };
    }
}
```

The returned object is passed directly to `channel.writeAndFlush()`. For text protocols it is a `String`; for binary protocols it is a `ByteBuf`.

### 3. Wire the encoder into the pipeline

In `XxxProtocol.java` (inside `addServer()`):

```java
addServer(new TrackerServer(config, getName()) {
    @Override
    protected void addProtocolHandlers(PipelineBuilder pipeline, Config config) {
        pipeline.addLast(new XxxFrameDecoder());
        pipeline.addLast(new XxxProtocolEncoder());   // ← add encoder
        pipeline.addLast(new XxxProtocolDecoder(XxxProtocol.this));
    }
});
```

### 4. For SMS commands

Use `setTextCommandEncoder()` with a `StringProtocolEncoder`, and call `setSupportedTextCommands()` instead of (or in addition to) `setSupportedDataCommands()`.

---

## `custom` Command Format

The `custom` type bypasses the encoder entirely and sends raw data directly to the device.

- **Binary protocol** — the `data` attribute must be a **hex string** (e.g., `"68680f05..."`). It is decoded with `DataConverter.parseHex()` and written as a `ByteBuf`.
- **Text protocol** (pipeline has a `StringEncoder`) — the `data` attribute is sent as a plain string. The escape sequences `\\r` → `\r` and `\\n` → `\n` are expanded before sending.

Example REST call:

```json
{
  "deviceId": 1,
  "type": "custom",
  "attributes": {
    "data": "ENGINEOFF\r\n"
  }
}
```

---

## Queued Commands

Stored in the `tc_queued_commands` table (mapped by `QueuedCommand.java`). When the device reconnects:

1. `BaseProtocolDecoder.getDeviceSession()` is called.
2. `ConnectionManager` fires a broadcast to all instances.
3. `CommandsManager.updateCommand()` reads queued commands and replays them over the live session.
4. Each delivered command fires a `commandQueued` event (visible via notifications).

To skip queuing entirely, set `noQueue: true` in command attributes — the API will return an error if the device is offline.
