# Printing And Hard Copy

Printing uses browser-native `window.print()` and print-safe API projections.
There is no server PDF service and no claim that a physical print completed.

## Public Print Actions

Visitors can open browser print or Save as PDF for:

- package brochure
- detailed package itinerary
- destination/place overview
- event details

The frontend hides navigation, forms, sticky controls, floating contact buttons,
interactive gallery controls, and private dashboard shells in print CSS.

## Staff Print Projections

Backend print endpoints expose allowlisted data only:

- public package, itinerary, destination, and event projections
- admin customer operational detail
- admin inquiry summary
- admin fixed-departure manifest

Booking and conversation print endpoints are reserved until backend Booking and
Conversation models exist.

## Audit Wording

Opening a print view may be recorded as:

```text
print_view_opened
```

The browser cannot prove paper was printed, so the app must not record or show:

```text
physical_print_completed
```

## Owner Actions

- Approve company print header/footer wording.
- Approve confidentiality wording.
- Confirm which customer, inquiry, booking, conversation, and manifest fields
  are operationally necessary.
- Manually test A4, Save as PDF, and real printer output before launch.
