# Up next

- Bracket for in progress tournament
  - Display for when teams aren't set
  - Ability to create bracket when pools aren't done
- Select wildcards

- Ask td's for ref assignment scenarios

- tournaments that award bids
- complete tournament
- pg_cron
- Migrate to Uppy for photo uploads

# Considerations

- User <-> Player profiles should be many to many so parents and coaches can manage.
- Renaming each id field: table.id -> table.tableId. Currently the nested relationships cause issues
