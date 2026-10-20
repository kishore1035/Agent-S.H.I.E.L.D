from .base import Agent, AgentOutput
from nexus.app_store import AgentManifest
from nexus.blackboard import Blackboard


class DataAgent(Agent):
    """Specialized agent for dataset manipulation, SQL, CSV parsing, and metrics."""

    def manifest(self) -> AgentManifest:
        return AgentManifest(
            id="data-agent",
            name="Data Specialist",
            capabilities=["data", "csv", "json", "sql", "transform", "metrics"],
            version="1.0.0",
            timeout_secs=45.0,
        )

    async def execute(self, task: str, blackboard: Blackboard) -> AgentOutput:
        prompt = f"Perform data analysis, extraction, or transformation for: {task}"
        system = "You are an expert data engineer and scientist. Deliver structured data outputs."
        data_res = await self.llm.complete(prompt, system=system)

        await blackboard.set("data-agent:output", {"data": data_res}, author="data-agent")

        return AgentOutput(
            agent_id="data-agent",
            result=data_res,
            is_code=False,
        )
