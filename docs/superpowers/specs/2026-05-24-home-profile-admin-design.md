# Home Profile Admin Design

## Goal

Allow admins to edit the public homepage music module and personal introduction module, including a real audio URL for playback.

## Approach

Add a structured `HomeProfile` configuration resource instead of encoding homepage data in `site_pages.content_html`. The public site reads the resource from a public endpoint and falls back to stable defaults when the request fails or has not been configured. The admin site gets a dedicated homepage editor route where the same fields can be loaded and saved through authenticated endpoints.

## Data

The profile contains:

- Music: `musicTitle`, `musicSubtitle`, `musicMeta`, `musicAudioUrl`
- Introduction: `aboutKicker`, `aboutTitle`, `aboutBody`
- Focus rows: `focusItems`, each with `label` and `text`

Text fields are plain text. `musicAudioUrl` may be empty, an absolute `http` or `https` URL, or an existing site-relative upload URL such as `/uploads/song.mp3`.

## Backend

Create one persisted `home_profiles` row keyed by `profile_key = "home"`. Add:

- `GET /api/v1/home-profile`
- `GET /api/v1/admin/home-profile`
- `PUT /api/v1/admin/home-profile`

Public GET returns default values when no row exists. Admin PUT upserts the `home` row.

## Frontend

The public homepage loads `publicApi.homeProfile()` alongside posts. The interlude section renders configured text, uses a real `<audio>` element when `musicAudioUrl` is present, and keeps the current visual playback state/progress behavior tied to the audio element.

The admin app adds a `首页` navigation item and a `HomeProfileView` form with separate music and introduction panels. It loads the profile on mount, lets the admin edit all supported fields, and saves through `adminApi.saveHomeProfile`.

## Testing

Add focused tests for:

- Backend public defaults and admin update persistence
- Admin API endpoint paths
- Admin editor load/save behavior
- Public homepage rendering configured profile values and binding the audio URL
