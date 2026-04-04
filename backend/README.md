# Backend Notes

## Analytics API Query Parameters

The following endpoints accept analytics date filters:

- `GET /api/analytics/overview`
- `GET /api/analytics/leads/pipeline`
- `GET /api/analytics/revenue`

### Supported query options

Use either a `period` token or explicit dates.

- `period`: `today`, `7d`, `30d`, `90d`, `this_month`, `this_year`
- `startDate`: ISO date string, for example `2026-04-01`
- `endDate`: ISO date string, for example `2026-04-30`

When `startDate` or `endDate` is provided, explicit date filtering is used.
When no filters are provided, the behavior remains unchanged:

- Overview `leadsToday` defaults to today.
- Pipeline and revenue return all-time values.

### Examples

- `GET /api/analytics/overview?period=30d`
- `GET /api/analytics/leads/pipeline?startDate=2026-01-01&endDate=2026-03-31`
- `GET /api/analytics/revenue?period=this_year`

## Leads API Date Filter

`GET /api/leads` supports `dateRange`:

- `today`
- `7d`
- `30d`
- `90d`

Example:

- `GET /api/leads?status=new&dateRange=7d&page=1&limit=20`
