build:
```docker build -t server-sched .```

run:
```docker run -d -p 5000:5000 -v "$(pwd)/data:/app/data" server-sched```