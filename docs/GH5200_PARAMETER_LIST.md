# GH5200 Parameter List

This document lists configurable parameters for the Teltonika GH5200 device, organized by scenario/feature group.

---

## Movement Event

| Parameter ID | Parameter Type | Default Value | Min | Max | Value | Parameter Name |
|---|---|---|---|---|---|---|
| 12106 | Uint8 | 0 | 0 | 1 | 0 – Disable<br>1 – Enable | Scenario Settings |
| 12108 | Uint8 | 0 | 0 | 1 | 0 – Movement Event<br>1 – No Movement Event | Mode |
| 12107 | Uint32 | 30 | 30 | 65500 | Seconds | Timeout |
| 7294 | Uint16 | _(empty)_ | 0 | 10 | Predefined Number | Send SMS to |
| 8294 | String | Movement Event | 0 | 160 | Char | SMS Text |

---

## Alarm

| Parameter ID | Parameter Type | Default Value | Min | Max | Value | Parameter Name |
|---|---|---|---|---|---|---|
| 7245 | Uint16 | _(empty)_ | 0 | 10 | Predefined Number | Send SMS to |
| 8245 | String | Alarm | 0 | 160 | Char | SMS Text |
| 11711 | Uint8 | 0 | 0 | 1 | 0 – Call<br>1 – Record | Order priority |
| 11712 | Uint16 | _(empty)_ | 0 | 10 | Predefined Number | Call to |

---

## GSM Predefined Numbers

| Parameter ID | Parameter Type | Default Value | Min | Max | Value | Parameter Name |
|---|---|---|---|---|---|---|
| 6000–6009 | Char | `""` | 0 | 16 | String | Predefined Number |
