from .base import Agent, AgentOutput
from nexus.app_store import AgentManifest
from nexus.blackboard import Blackboard


class CodingAgent(Agent):
    """Specialized agent for writing and repairing executable code."""

    def manifest(self) -> AgentManifest:
        return AgentManifest(
            id="coding-agent",
            name="Coding Specialist",
            capabilities=["code", "python", "rust", "fix", "script"],
            version="1.0.0",
            timeout_secs=60.0,
        )

    async def execute(self, task: str, blackboard: Blackboard) -> AgentOutput:
        prompt = f"Write clean, executable Python code for: {task}"
        system = "You are an expert software developer. Return working code without fluff."
        code = await self.llm.complete(prompt, system=system)

        await blackboard.set("coding-agent:output", {"code": code}, author="coding-agent")

        return AgentOutput(
            agent_id="coding-agent",
            result=code,
            is_code=True,
        )
