# Wagtail → Saleor One-time Sync Spec v1
Generated: 2025-12-19

Files:
- 25-Wagtail-to-Saleor-Sync-Command-Spec-v1.md (main spec)
- config/sync_mapping.v1.json (canonical mapping)
- saleor/graphql_templates.graphql (queries/mutations used)
- code/cms/management/commands/sync_wagtail_to_saleor.py (skeleton mgmt command)

Use:
1) Fill Wagtail taxonomies + Offering pages (with saleor product ids and cp ids)
2) Run `python manage.py sync_wagtail_to_saleor --dry-run --strict`
3) Fix drift, then run with `--create-missing --sync-products`
