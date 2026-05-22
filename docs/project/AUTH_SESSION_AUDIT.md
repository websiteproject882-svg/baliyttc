# Auth Session Audit

Date: 2026-05-23

## Result

The application uses separate cookies for each portal:

- `student_session`
- `admin_session`
- `staff_session`

Creating a session clears the other portal cookies, which reduces accidental cross-portal confusion.

## Improvement Added

Session reads are now stricter. A token must be stored in the matching cookie and its signed payload must also contain the matching `authType`.

Examples:

- `student_session` requires payload `authType: "student"`
- `admin_session` requires payload `authType: "admin"`
- `staff_session` requires payload `authType: "staff"`

This prevents a valid student token from being accepted if it is accidentally or maliciously placed into an admin/staff cookie.

## Verified By Tests

Added session tests for:

- signed JWT encrypt/decrypt round trip
- rejecting payloads under the wrong auth type

## Remaining Work

Future auth phases should add route-handler tests for:

- student cookie denied on admin/staff APIs
- admin cookie denied on student APIs
- staff cookie denied when role lacks permission
- 2FA challenge expiry and replay behavior

