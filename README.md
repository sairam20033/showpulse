# Backend
    cd backend
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    pytest
Docs at http://localhost:8000/docs
