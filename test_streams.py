import asyncio
import json
import redis.asyncio as redis

async def listen():
    r = redis.from_url("redis://localhost:6379", decode_responses=True)
    print("Reading all events from streams...")
    
    streams = {
        "chaos.stream": "0-0",
        "dependency_stream": "0-0",
        "incident_stream": "0-0",
        "recovery_stream": "0-0"
    }
    
    messages = await r.xread(streams)
    if messages:
        for stream, stream_messages in messages:
            for msg_id, data in stream_messages:
                print(f"[{stream}] {data.get('event_type')}: {data.get('payload')}")

if __name__ == "__main__":
    asyncio.run(listen())
