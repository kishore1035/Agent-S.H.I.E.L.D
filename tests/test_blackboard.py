import asyncio
import pytest
from nexus.blackboard import Blackboard, BlackboardEvent

@pytest.mark.asyncio
async def test_blackboard_write_read_and_subscribe():
    bb = Blackboard()
    rx = bb.subscribe()

    entry = await bb.set("task_output", {"status": "completed", "score": 100}, author="coding-agent")
    assert entry.version == 1
    assert entry.author == "coding-agent"
    assert entry.value == {"status": "completed", "score": 100}

    # Verify get
    fetched = await bb.get("task_output")
    assert fetched is not None
    assert fetched.version == 1
    assert fetched.value["status"] == "completed"

    # Verify version bump on second set
    entry2 = await bb.set("task_output", {"status": "refined"}, author="data-agent")
    assert entry2.version == 2
    assert entry2.author == "data-agent"

    # Verify pub/sub event received
    event1 = await asyncio.wait_for(rx.get(), timeout=1.0)
    assert isinstance(event1, BlackboardEvent)
    assert event1.entry.key == "task_output"
    assert event1.entry.version == 1

    event2 = await asyncio.wait_for(rx.get(), timeout=1.0)
    assert event2.entry.version == 2
    assert event2.entry.author == "data-agent"

    bb.unsubscribe(rx)
