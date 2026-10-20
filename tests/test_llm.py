import pytest
from nexus.llm import LlmClient, MockLlmClient

@pytest.mark.asyncio
async def test_mock_llm_pattern_matching_and_fallback():
    mock = MockLlmClient()
    mock.add_rule("summarize", "Summary: task successful")
    mock.add_rule("factorial", "def factorial(n): return 1 if n <= 1 else n * factorial(n-1)")

    # Matching rule 1
    res1 = await mock.complete("Please summarize this report")
    assert res1 == "Summary: task successful"

    # Matching rule 2
    res2 = await mock.complete("Write code for factorial calculation")
    assert "def factorial" in res2

    # Fallback default
    res3 = await mock.complete("Unseen generic query")
    assert "Mock response for: Unseen generic query" in res3
