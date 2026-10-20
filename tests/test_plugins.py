import pytest
from nexus.plugins import PluginLoader
from nexus.llm import MockLlmClient

def test_dynamic_plugin_loading(tmp_path):
    plugins_dir = tmp_path / "plugins"
    plugins_dir.mkdir()

    # Write a custom agent python file
    custom_agent_code = """
from nexus.agents.base import Agent, AgentOutput
from nexus.app_store import AgentManifest
from nexus.blackboard import Blackboard

class CustomSecurityAgent(Agent):
    def manifest(self) -> AgentManifest:
        return AgentManifest(
            id="custom-security-agent",
            name="Security Scanner",
            capabilities=["security", "audit", "cve"],
            version="2.0.0",
            timeout_secs=30.0,
        )

    async def execute(self, task: str, blackboard: Blackboard) -> AgentOutput:
        return AgentOutput(
            agent_id="custom-security-agent",
            result="No vulnerabilities detected.",
            is_code=False,
        )
"""
    (plugins_dir / "security_agent.py").write_text(custom_agent_code, encoding="utf-8")

    mock_llm = MockLlmClient()
    loader = PluginLoader()
    agents = loader.load_from_directory(str(plugins_dir), mock_llm)

    assert len(agents) == 1
    manifest = agents[0].manifest()
    assert manifest.id == "custom-security-agent"
    assert "security" in manifest.capabilities
    assert manifest.version == "2.0.0"
