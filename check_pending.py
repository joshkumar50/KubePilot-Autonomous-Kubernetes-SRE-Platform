import asyncio
import redis.asyncio as redis

async def main():
    r = redis.from_url('redis://localhost:6379', decode_responses=True)
    try:
        print(await r.xpending('incident_stream', 'incident_group'))
    except Exception as e:
        print(e)
    try:
        print(await r.xpending('recovery_stream', 'incident_recovery_group'))
    except Exception as e:
        print(e)
    print("Done")

asyncio.run(main())
