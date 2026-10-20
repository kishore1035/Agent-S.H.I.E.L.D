from __future__ import annotations
import asyncio
from typing import Any, TYPE_CHECKING
from .events import BlackboardEntry, BlackboardEvent

if TYPE_CHECKING:
    from nexus.persistence.sqlite_store import SqliteBlackboardStore


class Blackboard:
    """Thread-safe, async shared memory notebook for AI worker agents."""

    def __init__(self, persistence_store: SqliteBlackboardStore | None = None):
        self._entries: dict[str, BlackboardEntry] = {}
        self._subscribers: set[asyncio.Queue[BlackboardEvent]] = set()
        self._lock = asyncio.Lock()
        self.persistence_store = persistence_store

    @classmethod
    async def from_persistence(cls, store: SqliteBlackboardStore) -> Blackboard:
        bb = cls(persistence_store=store)
        entries = await store.load_all()
        for e in entries:
            bb._entries[e.key] = e
        return bb

    def subscribe(self) -> asyncio.Queue[BlackboardEvent]:
        queue: asyncio.Queue[BlackboardEvent] = asyncio.Queue(maxsize=256)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[BlackboardEvent]) -> None:
        self._subscribers.discard(queue)

    async def set(self, key: str, value: Any, author: str) -> BlackboardEntry:
        async with self._lock:
            existing = self._entries.get(key)
            version = (existing.version + 1) if existing else 1
            entry = BlackboardEntry(
                key=key,
                value=value,
                author=author,
                version=version,
            )
            self._entries[key] = entry

        if self.persistence_store:
            try:
                await self.persistence_store.save_entry(entry)
            except Exception:
                pass

        event = BlackboardEvent(entry=entry, event_type="updated")
        # Broadcast to all live subscribers without blocking
        dead_queues = []
        for q in self._subscribers:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass
            except Exception:
                dead_queues.append(q)

        for dq in dead_queues:
            self._subscribers.discard(dq)

        return entry

    async def get(self, key: str) -> BlackboardEntry | None:
        async with self._lock:
            return self._entries.get(key)

    async def list_all(self) -> list[BlackboardEntry]:
        async with self._lock:
            return list(self._entries.values())

    async def clear(self) -> None:
        async with self._lock:
            self._entries.clear()
