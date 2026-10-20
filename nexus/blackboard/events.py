from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, Field


class BlackboardEntry(BaseModel):
    key: str
    value: Any
    author: str
    version: int = 1
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BlackboardEvent(BaseModel):
    entry: BlackboardEntry
    event_type: str = "updated"
