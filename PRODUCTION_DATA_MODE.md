# Production data mode

Operational Admin dashboard, Sales and Inventory screens now use live API clients only. Sample-data switches and sample adapters are disabled/removed. Server errors remain visible as errors; empty database results render empty states or zero totals rather than fabricated records.

Super Admin dashboard, Admins & Users, Roles & Permissions, Distributor Network and Onboarding Requests read from protected server APIs. Sections without a persistent backend API (Plans & Billing, Audit Logs, Announcements and Platform Settings) intentionally display an empty state that explains the missing live data source.

No database rows are deleted by these source changes. Existing live records must be reviewed and backed up before any production cleanup.
