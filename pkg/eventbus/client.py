"""
Redis Streams EventBus Client
Provides an asynchronous, robust connection to Redis for publishing and consuming SRE events.
"""

import asyncio
import json
import logging
import os
from typing import Any, Callable, Dict, Optional

# Attempt to import redis. If not installed during Phase 1 validation, it will fail,
# but the codebase must be production ready.
try:
    import redis.asyncio as redis
    from redis.asyncio.client import Redis
except ImportError:
    redis = None
    Redis = Any

logger = logging.getLogger("eventbus")


class EventBusClient:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client: Optional[Redis] = None

    async def connect(self):
        """Establish async connection to Redis."""
        if redis is None:
            raise ImportError("redis module is not installed.")
        self.client = redis.from_url(self.redis_url, decode_responses=True)
        await self.client.ping()
        logger.info(f"Connected to EventBus at {self.redis_url}")

    async def disconnect(self):
        """Close connection."""
        if self.client:
            await self.client.close()

    async def publish(self, stream: str, event_type: str, payload: Dict[str, Any]):
        """Publish an event to a specific Redis Stream."""
        if not self.client:
            await self.connect()

        event_data = {"event_type": event_type, "payload": json.dumps(payload)}

        # '*' tells Redis to auto-generate the ID
        message_id = await self.client.xadd(stream, event_data, id="*")
        logger.debug(f"Published event {event_type} to {stream} with ID {message_id}")
        return message_id

    async def consume(self, stream: str, group: str, consumer: str, callback: Callable):
        """
        Consume events from a Redis Stream using Consumer Groups.
        Ensures at-least-once delivery.
        """
        if not self.client:
            await self.connect()

        # Ensure consumer group exists
        try:
            await self.client.xgroup_create(stream, group, id="0", mkstream=True)
        except Exception as e:
            if "BUSYGROUP" not in str(e):
                logger.error(f"Error creating consumer group: {e}")
                raise

        logger.info(f"Started consumer {consumer} in group {group} for stream {stream}")

        while True:
            try:
                # Read 10 items, block for 5 seconds
                messages = await self.client.xreadgroup(
                    group, consumer, {stream: ">"}, count=10, block=5000
                )
                if not messages:
                    continue

                for _, stream_messages in messages:
                    for message_id, message_data in stream_messages:
                        try:
                            # Invoke the callback
                            event_type = message_data.get("event_type", "unknown")
                            payload = json.loads(message_data.get("payload", "{}"))

                            # Await the callback
                            if asyncio.iscoroutinefunction(callback):
                                await callback(event_type, payload, message_id)
                            else:
                                callback(event_type, payload, message_id)

                            # ACK the message ONLY if successful
                            await self.client.xack(stream, group, message_id)

                        except Exception as inner_e:
                            logger.error(
                                f"Error processing message {message_id}: {inner_e}"
                            )
                            # Do not ACK! Let the DLQ or retry mechanism handle it.
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Consumer loop error: {e}")
                await asyncio.sleep(2)  # Backoff on connection error
