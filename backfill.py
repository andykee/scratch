#!/usr/bin/env python3
import sys, json
from urllib.request import urlopen, Request
from urllib.error import HTTPError

BASE = "http://127.0.0.1:8000/api/entries"

for raw in sys.argv[1:]:
    parts = raw.split('-')
    date = '-'.join(p.zfill(2) if i > 0 else p.zfill(4) for i, p in enumerate(parts))
    payload = json.dumps({"date": date}).encode()
    req = Request(BASE, data=payload, headers={"Content-Type": "application/json"})
    try:
        urlopen(req)
        print(f"  created  {date}")
    except HTTPError as e:
        if e.code == 409:
            print(f"  skipped  {date}  (already exists)")
        else:
            print(f"  error    {date}  (HTTP {e.code})")
