#!/usr/bin/env python3
import sys, json
from urllib.request import urlopen, Request
from urllib.error import HTTPError

BASE = "http://127.0.0.1:8000/api/entries"

for date in sys.argv[1:]:
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
