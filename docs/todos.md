# Up next

- Bracket for in progress tournament
  - Display for when teams aren't set
  - Ability to create bracket when pools aren't done

- Ask td's for ref assignment scenarios

- tournaments that award bids
- complete tournament
- pg_cron
- Migrate to Uppy for photo uploads
- Director's notes/directors should be changable for each tournament, not all tournaments at a venue
- Modify permissions so that directors can't edit tournaments

# Considerations

- User <-> Player profiles should be many to many so parents and coaches can manage.
- Renaming each id field: table.id -> table.tableId. Currently the nested relationships cause issues

# Known issues

- Hydration
  - Dates, maybe store local timezone in cookie? Allow user to set timezone per browser. No database.
