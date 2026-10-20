from .base import Agent, AgentOutput
from nexus.app_store import AgentManifest
from nexus.blackboard import Blackboard


class ResearchAgent(Agent):
    """Specialized agent for web/document research, synthesis, and summarization."""

    def manifest(self) -> AgentManifest:
        return AgentManifest(
            id="research-agent",
            name="Research Specialist",
            capabilities=["research", "docs", "summary", "analyze", "report"],
            version="1.0.0",
            timeout_secs=45.0,
        )

    async def execute(self, task: str, blackboard: Blackboard) -> AgentOutput:
        prompt = f"Conduct comprehensive research and provide concise synthesis for: {task}"
        system = "You are a senior research analyst. Focus on facts, evidence, and structured summaries."
        summary = await self.llm.complete(prompt, system=system)

        await blackboard.set("research-agent:output", {"summary": summary}, author="research-agent")

        return AgentOutput(
            agent_id="research-agent",
            result=summary,
            is_code=False,
        )
