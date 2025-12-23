# Agent Template

Template for creating new AI agents on GSV Platform.

## Quick Start

```bash
# Copy this template
cp -r agents/agent-template agents/my-new-agent
cd agents/my-new-agent

# Create venv and install
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run
uvicorn main:app --reload
```

## Structure

- FastAPI-based agent service
- OpenAI/LangChain ready
- Health check endpoint
