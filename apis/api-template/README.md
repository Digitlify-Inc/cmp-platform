# API Template

Template for creating new APIs on GSV Platform.

## Quick Start

```bash
# Copy this template
cp -r apis/api-template apis/my-new-api
cd apis/my-new-api

# Create venv and install
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run
uvicorn main:app --reload
```

## Structure

- FastAPI-based REST API
- SQLAlchemy + Alembic ready
- CRUD operations template
