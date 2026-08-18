# OpenLP Service Planner

OpenLP Service Planner is a web-based service planning application designed to make preparing services for [OpenLP](https://openlp.org/) easier, particularly when several people contribute to preparing a service.

It provides a shared online workspace where services can be planned in advance, songs and projection media can be prepared, and the completed service can be downloaded as an OpenLP service file for use on the projection computer.

The projection computer does not need to be connected to the internet.

## What it does

### Plan services collaboratively

Create upcoming services and arrange the running order using a simple web interface.

Service items can include:

- Songs
- Bible passages
- Images and notices
- Sermon images
- Videos
- PDF presentations
- Text and other run-sheet items

Items can be reordered and edited as the service is prepared.

The planner records changes and helps multiple people contribute without needing direct access to the projection computer.

### Shared song library

The planner maintains a shared OpenLP song library.

Songs can be:

- searched and added to services
- edited centrally
- given a usual verse order
- imported from SongSelect
- exported in OpenLyrics format
- used directly when generating an OpenLP service

This allows service planners to prepare the actual song order that will appear in OpenLP.

### Media libraries

Images, videos and PDFs can be stored and reused through shared media libraries.

Image presentations support ordering, autoplay, looping and timing. PDFs are converted into image slides so they can be projected reliably without depending on PDF presentation support on the OpenLP computer.

### OpenLP export

When a service is ready, the planner generates an OpenLP `.osz` service file containing the required songs and projection media.

The file can then be transferred to the projection computer using a USB drive, LocalSend or another file-transfer method.

The planner can also record which version of a service has been downloaded for projection and warn when the online service has subsequently changed.

### Service templates

Reusable service templates can define the normal structure of recurring services.

Templates can contain:

- song positions
- Bible-reading positions
- notices
- sermons
- locally maintained projection items
- media
- an OpenLP theme

Different recurring services can have their own default templates, while an individual service can use a different template when required.

Templates work independently of ChurchSuite.

### Optional ChurchSuite integration

ChurchSuite integration is optional.

When enabled, the planner can use the ChurchSuite Planning API to find and import published service plans.

ChurchSuite items can be mapped into OpenLP Service Planner items, while locally prepared projection material can be retained between synchronisations.

Import options include:

- using a service template
- songs only
- selected ChurchSuite item types
- all configured item types

This allows ChurchSuite to remain the source of the service running order while OpenLP Service Planner manages the material needed for projection.

A read-only published service-plan list can also be made available to authorised users.

### Users and permissions

The planner supports different levels of access so that not every user needs full planning or administration permissions.

Authentication can be configured using local Planner accounts and supported single-sign-on options.

Administrative functions include user management, service configuration, extensions, authentication settings, templates, backups and other system settings.

## Deployment

OpenLP Service Planner can run on:

- **Cloudflare Workers**, using D1 for the database and R2 for media storage; or
- a **Debian VPS**, using the included server and filesystem/SQLite-compatible storage implementation.

The application is designed so that the same planner functionality is available on either deployment platform.

Detailed installation instructions are provided in:

- `docs/INSTALL-CLOUDFLARE.md`
- `docs/DEBIAN-VPS.md`

## Backups

The planner includes backup and restore facilities for protecting planner data and media.

Regular backups are strongly recommended, particularly before upgrades or significant configuration changes.

## Open source

OpenLP Service Planner is released under the MIT License.

It is an independent project intended to complement OpenLP and, optionally, ChurchSuite. It is not an official OpenLP or ChurchSuite product.

See `LICENSE` for details.- When ChurchSuite is Off, all sync/import/view-plan UI remains hidden while Templates continue to work without ChurchSuite wording.



