import asyncio
from typing import Sequence
from .planner import Subtask
from nexus.app_store import AppStore
from nexus.agents.base import Agent, AgentOutput
from nexus.blackboard import Blackboard
from nexus.error import RouterError, WorkerError


class RouterSupervisor:
    """Supervises agent execution lifecycles, monitoring health and performing failovers."""

    def __init__(self, app_store: AppStore):
        self.app_store = app_store

    def select_worker(self, subtask: Subtask, failed_workers: Sequence[str] = ()) -> str:
        candidates = [
            w for w in self.app_store.list()
            if w.id not in failed_workers
        ]

        if not candidates:
            raise RouterError(
                f"No available workers for subtask '{subtask.id}'. Failed: {list(failed_workers)}"
            )

        # Score candidates by matching tags
        req_tags_lower = [t.lower() for t in subtask.tags]
        scored: list[tuple[int, str]] = []

        for worker in candidates:
            worker_caps = [c.lower() for c in worker.capabilities]
            score = sum(1 for tag in req_tags_lower if tag in worker_caps)
            if score > 0:
                scored.append((score, worker.id))

        if not scored:
            # Fallback to any active worker if no direct tag match
            return candidates[0].id

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1]

    async def execute_subtask(
        self,
        subtask: Subtask,
        agent_map: dict[str, Agent],
        blackboard: Blackboard,
    ) -> AgentOutput:
        failed_workers: list[str] = []

        while True:
            worker_id = self.select_worker(subtask, failed_workers=failed_workers)
            agent = agent_map.get(worker_id)
            if not agent:
                failed_workers.append(worker_id)
                continue

            manifest = agent.manifest()
            timeout = manifest.timeout_secs

            try:
                # Execute agent with health timeout
                output = await asyncio.wait_for(
                    agent.execute(subtask.description, blackboard),
                    timeout=timeout,
                )
                return output
            except Exception as e:
                # Agent died or timed out: log failover and re-route
                failed_workers.append(worker_id)
                await blackboard.set(
                    f"router:failover:{subtask.id}",
                    {"failed_worker": worker_id, "error": str(e)},
                    author="router-supervisor",
                )
