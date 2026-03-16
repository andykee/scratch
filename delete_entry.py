#!/usr/bin/env python3
import sys
from urllib.request import urlopen, Request
from urllib.error import HTTPError

BASE = "http://127.0.0.1:8000/api/entries"

for raw in sys.argv[1:]:
    parts = raw.split('-')
    date = '-'.join(p.zfill(2) if i > 0 else p.zfill(4) for i, p in enumerate(parts))
    req = Request(f"{BASE}/{date}", method="DELETE")
    try:
        urlopen(req)
        print(f"  deleted  {date}")
    except HTTPError as e:
        if e.code == 404:
            print(f"  skipped  {date}  (not found)")
        else:
            print(f"  error    {date}  (HTTP {e.code})")
