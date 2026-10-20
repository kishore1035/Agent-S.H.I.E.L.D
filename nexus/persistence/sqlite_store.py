import json
from datetime import datetime, timezone
import aiosqlite
from nexus.blackboard.events import BlackboardEntry


class SqliteBlackboardStore:
    """Asynchronous SQLite Write-Ahead Logging (WAL) persistent storage for Blackboard."""

    def __init__(self, db_path: str):
        self.db_path = db_path

    async def initialize(self) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            await db.execute("""
                CREATE TABLE IF NOT EXISTS blackboard_entries (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    author TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    timestamp TEXT NOT NULL
                );
            """)
            await db.commit()

    async def save_entry(self, entry: BlackboardEntry) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            val_json = json.dumps(entry.value)
            ts_str = entry.timestamp.isoformat()
            await db.execute(
                """
                INSERT INTO blackboard_entries (key, value, author, version, timestamp)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    author = excluded.author,
                    version = excluded.version,
                    timestamp = excluded.timestamp;
                """,
                (entry.key, val_json, entry.author, entry.version, ts_str),
            )
            await db.commit()

    async def load_all(self) -> list[BlackboardEntry]:
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT key, value, author, version, timestamp FROM blackboard_entries")
            rows = await cursor.fetchall()
            entries = []
            for key, val_json, author, version, ts_str in rows:
                val = json.loads(val_json)
                ts = datetime.fromisoformat(ts_str)
                entries.append(
                    BlackboardEntry(
                        key=key,
                        value=val,
                        author=author,
                        version=version,
                        timestamp=ts,
                    )
                )
            return entries
