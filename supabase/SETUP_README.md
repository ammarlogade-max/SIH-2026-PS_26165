# Supabase Setup Instructions

## Step 1: Run schemas in ORDER

In your Supabase SQL Editor, run these three files in sequence:

1. `schema.sql` — Core tables (documents, chunks, entities, chat)
2. `schema_v2.sql` — Intelligence tables (assets, risks, maintenance, incidents, compliance, insights)
3. `schema_v3.sql` — v3 tables (decisions cache, briefs, investigations)

## Step 2: Verify pgvector

After running schema.sql, verify:
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```
Should return one row. If not, run: `CREATE EXTENSION IF NOT EXISTS vector;`

## Step 3: Test the match function

```sql
SELECT * FROM match_document_chunks(
  ARRAY[0.1, 0.2, ...]::vector(1536),
  0.5,
  5,
  NULL
);
```

## Common Issues

**"relation does not exist"** → Run schemas in order (1, 2, 3)
**"function match_document_chunks does not exist"** → Re-run schema.sql
**"extension vector does not exist"** → Enable pgvector in Supabase dashboard under Database > Extensions
