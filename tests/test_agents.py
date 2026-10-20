import pytest
from nexus.agents import CodingAgent, ResearchAgent, DataAgent, OpsAgent, AgentOutput
from nexus.blackboard import Blackboard
from nexus.llm import MockLlmClient

@pytest.mark.asyncio
async def test_specialized_agents_execution_and_blackboard_integration():
    mock = MockLlmClient()
    mock.add_rule("fibonacci", "def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)")
    mock.add_rule("market trends", "Tech stocks rallied 4% in Q3")
    mock.add_rule("clean csv", "data cleaned: removed 4 null rows")
    mock.add_rule("deploy", "docker compose up -d")

    bb = Blackboard()

    # 1. Coding Agent
    coder = CodingAgent(mock)
    code_out = await coder.execute("Generate fibonacci script", bb)
    assert code_out.agent_id == "coding-agent"
    assert code_out.is_code is True
    assert "def fib" in code_out.result

    entry = await bb.get("coding-agent:output")
    assert entry is not None
    assert entry.author == "coding-agent"

    # 2. Research Agent
    researcher = ResearchAgent(mock)
    res_out = await researcher.execute("Analyze market trends", bb)
    assert res_out.agent_id == "research-agent"
    assert res_out.is_code is False
    assert "rallied 4%" in res_out.result

    # 3. Data Agent
    data_agent = DataAgent(mock)
    data_out = await data_agent.execute("clean csv dataset", bb)
    assert data_out.agent_id == "data-agent"
    assert "removed 4 null" in data_out.result

    # 4. Ops Agent
    ops_agent = OpsAgent(mock)
    ops_out = await ops_agent.execute("deploy the service", bb)
    assert ops_out.agent_id == "ops-agent"
    assert ops_out.is_code is True
    assert "docker compose" in ops_out.result
