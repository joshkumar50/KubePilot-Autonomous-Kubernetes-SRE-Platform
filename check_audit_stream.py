import asyncio
import redis.asyncio as redis

async def main():
    r = redis.from_url("redis://localhost:6379", decode_responses=True)
    # Check if audit_events stream exists
    streams = await r.xlen("audit_events")
    print(f"audit_events stream length: {streams}")
    
    if streams > 0:
        msgs = await r.xrange("audit_events", count=5)
        for msg_id, data in msgs:
            print(f"  {msg_id}: {data}")
    
    # Check consumer groups
    try:
        groups = await r.xinfo_groups("audit_events")
        print(f"Consumer groups: {groups}")
    except Exception as e:
        print(f"No groups: {e}")

asyncio.run(main())
