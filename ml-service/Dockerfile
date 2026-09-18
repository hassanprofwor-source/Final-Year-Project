FROM python:3.12-slim-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir --only-binary=:all: -r requirements.txt

COPY . .

ENV ENABLE_SCHEDULED_RETRAIN=false
ENV FLASK_DEBUG=0
ENV PYTHONUNBUFFERED=1

CMD gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 2 --timeout 120 app:app
