from .base import Agent, AgentOutput
from nexus.app_store import AgentManifest
from nexus.blackboard import Blackboard


class OpsAgent(Agent):
    """Specialized agent for system configuration, shell scripts, and deployments."""

    def manifest(self) -> AgentManifest:
        return AgentManifest(
            id="ops-agent",
            name="Ops Specialist",
            capabilities=["ops", "bash", "deploy", "config", "docker", "k8s"],
            version="1.0.0",
            timeout_secs=45.0,
        )

    async def execute(self, task: str, blackboard: Blackboard) -> AgentOutput:
        prompt = f"Write operational shell automation or deployment instructions for: {task}"
        system = "You are a Site Reliability and DevOps engineer. Ensure high safety and idempotency."
        ops_res = await self.llm.complete(prompt, system=system)

        await blackboard.set("ops-agent:output", {"ops": ops_res}, author="ops-agent")

        return AgentOutput(
            agent_id="ops-agent",
            result=ops_res,
            is_code=True,
        )
