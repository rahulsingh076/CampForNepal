# Image Source Map

Final Touch 13 adds a small, locally shipped topic-image set. The original
records keep their existing `/images/...` paths, so admin edits and dataClient
contracts do not change. Topic files are hard-linked from `frontend/public/images/sources/`
into their matching existing content paths; the source file and each group of
paths below are the same image.

All files were checked on 2026-08-03. The source page is the authoritative
licence and attribution record. Before a production launch, add a public photo
credit location that names these creators and links to their source pages.

## Gallery Coverage Note

The original demo records contain several gallery slots per trip. This pass
uses one licensed, topic-specific photograph for each covered topic and maps it
to those existing slots so no unrelated stock image or generic fallback is
presented as a route gallery. These are not distinct gallery photographs. An
owner-approved, correctly attributed multi-image set is still required before
representing any gallery as a complete visual record of a specific trip.

The application now accepts richer public media objects for packages,
destinations, and activities, but the current checked-in demo set contains image
files only. No demo reels or video files are present in `frontend/public`, and
none were invented for this pass. Owner-supplied videos and reels must be stored
as approved external URLs with source/licence metadata, never as MongoDB binary
media.

| Topic | Local files served | Source / creator | Licence | Attribution requirement |
| --- | --- | --- | --- | --- |
| Everest and Khumbu | `home/hero-ama-dablam-sunrise-01.jpg`, `destinations/everest-region-khumbu-*.jpg`, Everest package, activity, blog, and update images | [Wikimedia Commons: Billjones94](https://commons.wikimedia.org/wiki/File:Everest_Base_camp_in_Nepal,_photographed_on_November_29,_2023.jpg) | CC0 1.0 | No legal attribution required; retain source record. |
| Annapurna | `destinations/annapurna-region-*.jpg`, Annapurna package and Thorong La blog/update images | [Wikimedia Commons: Haidis](https://commons.wikimedia.org/wiki/File:Annapurna_Range,_Nepal.jpg) | CC BY-SA 4.0 | Credit Haidis, link source and licence, note local resize. |
| Langtang | `destinations/langtang-valley-*.jpg`, Langtang package, blog, and update images | [Wikimedia Commons: Sergey Pesterev](https://commons.wikimedia.org/wiki/File:Himalayas_Langtang.jpg) | CC BY-SA 4.0 | Credit Sergey Pesterev, link source and licence, note local resize. |
| Manaslu | `destinations/manaslu-region-*.jpg`, Manaslu package and update images | [Wikimedia Commons: Udhabkc](https://commons.wikimedia.org/wiki/File:Mt_Manaslu_from_Manaslu_basecamp.jpg) | CC BY-SA 4.0 | Credit Udhabkc, link source and licence, note local resize. |
| Upper Mustang | `destinations/upper-mustang-*.jpg`, Upper Mustang package, Tiji blog, and permit update images | [Wikimedia Commons: Safalphotos](https://commons.wikimedia.org/wiki/File:Lo_Manthang,_Upper_Mustang,_Nepal.jpg) | CC BY-SA 4.0 | Credit Safalphotos, link source and licence, note local resize. |
| Pokhara | `destinations/pokhara-*.jpg`, Pokhara package images | [Wikimedia Commons: Jean-Marie Hullot](https://commons.wikimedia.org/wiki/File:Phewa_lake,_Pokhara.jpg) | CC BY-SA 3.0 | Credit Jean-Marie Hullot, link source and licence, note local resize. |
| Chitwan | `destinations/chitwan-national-park-*.jpg`, safari package, wildlife activity, blog, and update images | [Wikimedia Commons: Aditya Pal](https://commons.wikimedia.org/wiki/File:Greater_one-horned_rhinoceros_at_Chitwan.jpg) | CC BY-SA 4.0 | Credit Aditya Pal, link source and licence, note local resize. |
| Kathmandu heritage | `destinations/kathmandu-valley-*.jpg`, heritage package, and cultural activity images | [Wikimedia Commons: Vyacheslav Argenberg](https://commons.wikimedia.org/wiki/File:Boudhanath,_Kathmandu,_Nepal.jpg) | CC BY 4.0 | Credit Vyacheslav Argenberg, link source and licence, note local resize. |
| Lumbini | `destinations/lumbini-*.jpg`, spiritual activity images | [Wikimedia Commons: Shadow Ayush](https://commons.wikimedia.org/wiki/File:Maya_Devi_Temple,_Lumbini,_Rupandehi,_Nepal.jpg) | CC BY-SA 4.0 | Credit Shadow Ayush, link source and licence, note local resize. |
| Bardia | `destinations/bardia-national-park-*.jpg` | [Wikimedia Commons: Sanoj-photography](https://commons.wikimedia.org/wiki/File:Bardiya_National_Park.jpg) | CC BY-SA 3.0 | Credit Sanoj-photography, link source and licence, note local resize. |
| Trishuli rafting | `activities/white-water-rafting-*.jpg` | [Wikimedia Commons: Bijay Chaurasia](https://commons.wikimedia.org/wiki/File:Rafting_on_Trishuli_River-Rafting_in_Nepal-3047.jpg) | CC BY-SA 4.0 | Credit Bijay Chaurasia Photography, Wikimedia Commons, and the licence. |
| Pokhara paragliding | `activities/paragliding-*.jpg` | [Wikimedia Commons: Rudolph.A.furtado](https://commons.wikimedia.org/wiki/File:'Tandem_Paragliding'_over_Pokhara.(Tuesday_22-11-2011).JPG) | CC0 1.0 | No legal attribution required; retain source record. |
| Bhaktapur cycling | `activities/mountain-biking-*.jpg` | [Wikimedia Commons: Ram kumar kc](https://commons.wikimedia.org/wiki/File:Mountain_Biking_in_Bhaktapur.JPG) | CC BY-SA 3.0 | Credit Ram kumar kc, link source and licence, note local resize. |

## Intentionally Not Replaced

- Guide photos and user avatars: owner-approved portraits and consent are
  required. The public UI uses a clearly labelled neutral placeholder instead.
- Certificates: a real document scan and owner confirmation are required; the
  demo renders a neutral missing-media state rather than a scenic stand-in.
- Package route maps: a photograph must not masquerade as a map, so the UI now
  states when a route-map visual is absent from the demo.
- Travel-information pages: no new editorial imagery was introduced because
  the current data model does not carry a verified image field for those pages.
