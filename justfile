db:
    docker exec -it cbva-web-postgres-1 psql -U postgres -d cbva

db_restore:
    cat supabase/prod-dump.sql | docker exec -i cbva-web-postgres-1 psql -U postgres -d cbva

fix script:
    pnpm tsx src/db/fix/{{script}}.ts
