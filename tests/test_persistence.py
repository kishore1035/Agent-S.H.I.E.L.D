import pytest
from nexus.blackboard import Blackboard
from nexus.persistence import SqliteBlackboardStore

@pytest.mark.asyncio
async def test_sqlite_persistence_and_reload(tmp_path):
    db_file = str(tmp_path / "test_blackboard.db")
    store = SqliteBlackboardStore(db_file)
    await store.initialize()

    # Create blackboard with persistence
    bb = Blackboard(persistence_store=store)
    await bb.set("metric:accuracy", {"score": 0.98}, author="data-agent")
    await bb.set("task:summary", "research complete", author="research-agent")

    # Load into fresh blackboard from same db
    fresh_store = SqliteBlackboardStore(db_file)
    await fresh_store.initialize()
    loaded_bb = await Blackboard.from_persistence(fresh_store)

    entry1 = await loaded_bb.get("metric:accuracy")
    assert entry1 is not None
    assert entry1.value["score"] == 0.98
    assert entry1.author == "data-agent"

    entry2 = await loaded_bb.get("task:summary")
    assert entry2 is not None
    assert entry2.value == "research complete"
