# Bali YTTC Media Library

This folder is for source imports and asset organization notes.

## Current Import Status

- Google Drive source: `ADRUVA BALI PROJECT`
- Local raw import folder: `media-library/raw-drive/`
- Raw import is intentionally git-ignored because it is a temporary dump.
- Curated web-ready copies are committed under `public/media/`.

The Drive download started successfully but stopped when Google Drive blocked one file:

- Folder: `200 hour YTT`
- File ID: `1Wmc40D9cEz6uC7Wlok-hi2vyFQQhk5MU`
- Reason: gdown could not retrieve a public download URL. Usually this means the file permission is not fully public or Drive throttled the link.

Downloaded before the stop:

- `100 hr`: 29 files
- `200 hour YTT`: 10 files

To continue later, set the Drive folder and every nested file to `Anyone with the link can view`, then rerun:

```powershell
python -m gdown --folder "https://drive.google.com/drive/folders/1aEdry4Sm7woPp-cBpPzhg43G0lsRLHn1?usp=drive_link" --output media-library/raw-drive
node scripts/generate-media-inventory.mjs
```

## Curated Folder Structure

Use `public/media` when assigning assets to website sections.

- `00-brand/logos`: logos and brand marks
- `00-brand/certification-badges`: Yoga Alliance and trust badges
- `01-home/hero`: homepage hero images
- `01-home/video`: homepage hero videos
- `02-courses/50hr`: 50-hour course media
- `02-courses/100hr`: 100-hour course media
- `02-courses/200hr`: 200-hour course media
- `02-courses/300hr`: 300-hour course media
- `03-accommodation/campus`: drone, shala, campus views
- `03-accommodation/rooms`: private/shared room photos
- `03-accommodation/pool`: pool photos
- `03-accommodation/facilities`: reception, bathroom, amenities
- `04-activities/ceremony`: opening, purification, graduation
- `04-activities/asana-practice`: Hatha, Ashtanga, Vinyasa, pranayama
- `04-activities/workshops`: acro, arm balancing, sound healing, mandala
- `04-activities/beach-yoga`: beach yoga and nature practices
- `05-instructors`: teacher profile photos
- `06-testimonials/videos`: student video testimonials
- `07-gallery/*`: public gallery buckets
- `08-documents/raw`: PDFs, manuals, brochures when imported

## Naming Rules

- Use lowercase words separated by hyphens.
- Start with the section when useful: `200hr-`, `100hr-`, `gallery-`.
- Avoid WhatsApp or camera default names in `public/media`.
- Keep raw originals in `media-library/raw-drive`; only curated names go into `public/media`.

## Inventory

The generated file `public/media/media-inventory.json` lists every curated asset with its public URL, section, extension, file size, and update time.
