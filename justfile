db:
  docker exec -it cbva-web-postgres-1 psql -U postgres -d cbva

db_prod_dump:
  just sb db dump --workdir .supabase -f dumps/data.sql --data-only

db_restore:
  cat .supabase/dumps/data.sql | docker exec -i cbva-web-postgres-1 psql -U postgres -d cbva

fix script:
  pnpm tsx src/db/fix/{{script}}.ts

seed:
  pnpm tsx src/db/seed/bin.ts

sb *args:
  supabase --workdir .supabase {{args}}
