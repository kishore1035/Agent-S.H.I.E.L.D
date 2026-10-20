import pytest
from nexus.llm import MockLlmClient
from nexus.trust.sandbox import SandboxRunner, SandboxResult
from nexus.trust.healer import SelfHealer
from nexus.error import SelfHealExhaustedError

@pytest.mark.asyncio
async def test_sandbox_runner_basic_execution():
    runner = SandboxRunner()
    result = await runner.run_code("print('Hello from sandbox')")
    assert result.exit_code == 0
    assert "Hello from sandbox" in result.stdout

@pytest.mark.asyncio
async def test_self_healing_fixes_broken_code():
    mock = MockLlmClient()
    # When fed NameError, mock returns corrected code
    mock.add_rule("NameError", "print('healed output')")

    runner = SandboxRunner()
    healer = SelfHealer(sandbox=runner, llm=mock)

    broken_code = "print(undefined_variable_xyz)"
    healed_stdout = await healer.execute_with_healing(broken_code, max_retries=2)
    assert healed_stdout.strip() == "healed output"

@pytest.mark.asyncio
async def test_self_healing_exhausts_retries_on_unfixable_code():
    mock = MockLlmClient()
    # Mock keeps returning broken code
    mock.add_rule("syntaxerror", "def broken(:")

    runner = SandboxRunner()
    healer = SelfHealer(sandbox=runner, llm=mock)

    broken_code = "def broken(:"
    with pytest.raises(SelfHealExhaustedError):
        await healer.execute_with_healing(broken_code, max_retries=1)
