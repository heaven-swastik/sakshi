# SAKSHI — developer shortcuts
# Run `make help` to see all commands.

.PHONY: help dev-api dev-web dev seed test lint clean docker

help:
	@echo "SAKSHI developer commands:"
	@echo "  make dev-api    Start the FastAPI backend (port 8000)"
	@echo "  make dev-web    Start the React frontend (port 5173)"
	@echo "  make dev        Start both (two terminals)"
	@echo "  make seed       Seed synthetic demo data"
	@echo "  make test       Run all tests"
	@echo "  make docker     Build and run with Docker Compose"
	@echo "  make clean      Remove generated files"

dev-api:
	cd api && pip install -r requirements.txt -q && uvicorn main:app --reload --port 8000

dev-web:
	cd web && npm install && npm run dev

seed:
	cd api && python -c "from db import engine; from models import Base; Base.metadata.create_all(engine)"
	python seed/generate.py

test:
	cd api && python -m pytest tests/ -v

lint:
	cd api && python -m flake8 . --max-line-length 100 --exclude venv,__pycache__

docker:
	docker compose up --build

clean:
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -f sakshi.db api/sakshi.db
	rm -f api/credential_key.pem

