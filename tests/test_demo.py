import pytest
from nexus.demo import run_demo_scenario, list_demo_scenarios

@pytest.mark.asyncio
async def test_demo_scenarios():
    scenarios = list_demo_scenarios()
    assert "self-heal" in scenarios
    assert "orchestration" in scenarios

    # Execute self-heal demo
    result = await run_demo_scenario("self-heal")
    assert result["status"] == "success"
    assert "healed_code" in result or "output" in result
