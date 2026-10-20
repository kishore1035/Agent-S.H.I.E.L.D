import pytest
from nexus.app_store import AgentManifest, AppStore

def test_app_store_registration_and_discovery():
    store = AppStore()
    coding = AgentManifest(
        id="coding-agent-v1",
        name="Coding Specialist",
        capabilities=["code", "python", "rust", "fix"],
        version="1.0.0",
        timeout_secs=45.0,
    )
    data = AgentManifest(
        id="data-agent-v1",
        name="Data Analyst",
        capabilities=["data", "sql", "csv", "transform"],
        version="1.0.0",
        timeout_secs=30.0,
    )

    store.register(coding)
    store.register(data)

    assert len(store.list()) == 2
    assert store.get("coding-agent-v1") == coding

    # Capability matching
    best_coder = store.find_best_worker(["python", "code"])
    assert best_coder is not None
    assert best_coder.id == "coding-agent-v1"

    best_data = store.find_best_worker(["csv"])
    assert best_data is not None
    assert best_data.id == "data-agent-v1"

    # No match
    none_worker = store.find_best_worker(["non-existent-skill"])
    assert none_worker is None
