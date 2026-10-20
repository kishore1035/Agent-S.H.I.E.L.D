import pytest
from nexus.app_store import AgentManifest, AppStore
from nexus.blackboard import Blackboard
from nexus.agents import CodingAgent, DataAgent, AgentOutput, Agent
from nexus.llm import MockLlmClient
from nexus.router import TaskPlanner, Subtask, RouterSupervisor
from nexus.error import RouterError

def test_router_planner_decomposition():
    planner = TaskPlanner()
    subtasks = planner.decompose("Analyze sales csv data and write a python summary script")
    assert len(subtasks) >= 2
    tags = [t for st in subtasks for t in st.tags]
    assert "data" in tags
    assert "code" in tags

def test_supervisor_worker_selection_and_failover():
    store = AppStore()
    store.register(AgentManifest(
        id="primary-coder",
        name="Primary Coder",
        capabilities=["code", "python"],
        version="1.0.0",
    ))
    store.register(AgentManifest(
        id="backup-coder",
        name="Backup Coder",
        capabilities=["code", "python"],
        version="1.0.0",
    ))

    supervisor = RouterSupervisor(store)
    subtask = Subtask(id="st-1", description="Write script", tags=["code", "python"])

    # Normal selection picks highest/first
    chosen = supervisor.select_worker(subtask, failed_workers=[])
    assert chosen == "primary-coder"

    # If primary has died, supervisor automatically re-routes to backup
    rerouted = supervisor.select_worker(subtask, failed_workers=["primary-coder"])
    assert rerouted == "backup-coder"

    # If all fail, raises RouterError
    with pytest.raises(RouterError):
        supervisor.select_worker(subtask, failed_workers=["primary-coder", "backup-coder"])

@pytest.mark.asyncio
async def test_supervisor_failover_execution_when_agent_crashes():
    store = AppStore()
    store.register(AgentManifest(id="flaky-agent", name="Flaky", capabilities=["code"]))
    store.register(AgentManifest(id="reliable-agent", name="Reliable", capabilities=["code"]))

    mock = MockLlmClient()
    mock.add_rule("code", "def work(): return True")

    class CrashingAgent(Agent):
        def manifest(self):
            return AgentManifest(id="flaky-agent", name="Flaky", capabilities=["code"])
        async def execute(self, task, blackboard):
            raise RuntimeError("Agent container crashed or timed out!")

    class GoodAgent(Agent):
        def manifest(self):
            return AgentManifest(id="reliable-agent", name="Reliable", capabilities=["code"])
        async def execute(self, task, blackboard):
            return AgentOutput(agent_id="reliable-agent", result="success", is_code=True)

    supervisor = RouterSupervisor(store)
    bb = Blackboard()
    agent_map = {
        "flaky-agent": CrashingAgent(mock),
        "reliable-agent": GoodAgent(mock),
    }

    subtask = Subtask(id="st-1", description="Write code", tags=["code"])
    output = await supervisor.execute_subtask(subtask, agent_map, bb)
    assert output.agent_id == "reliable-agent"
    assert output.result == "success"
