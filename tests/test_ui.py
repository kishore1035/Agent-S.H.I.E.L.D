import pytest
from io import StringIO
from rich.console import Console
from nexus.app_store import AgentManifest
from nexus.router import Subtask
from nexus.trust import SignedReceipt
from nexus.ui import render_agent_table, render_plan_tree, render_receipt_panel

def test_rich_ui_renderers():
    output = StringIO()
    console = Console(file=output, force_terminal=True, color_system="standard")

    # 1. Agent Table
    agents = [
        AgentManifest(
            id="coding-agent",
            name="Coding Specialist",
            capabilities=["code", "python"],
            version="1.0.0",
            timeout_secs=60.0,
        )
    ]
    render_agent_table(agents, console=console)
    text = output.getvalue()
    assert "Nexus Worker App Store" in text
    assert "coding-agent" in text
    assert "python" in text

    # 2. Plan Tree
    subtasks = [
        Subtask(id="st-1", description="Parse dataset", tags=["data"]),
        Subtask(id="st-2", description="Train model", tags=["code"]),
    ]
    render_plan_tree(subtasks, console=console)
    tree_text = output.getvalue()
    assert "Execution Plan DAG" in tree_text
    assert "Parse dataset" in tree_text

    # 3. Receipt Panel
    receipt = SignedReceipt(
        task_id="task-100",
        payload_digest="a" * 64,
        public_key="b" * 64,
        signature="c" * 128,
        timestamp="2026-10-21T00:00:00Z",
    )
    render_receipt_panel(receipt, console=console)
    receipt_text = output.getvalue()
    assert "Cryptographic Execution Receipt" in receipt_text
    assert "task-100" in receipt_text
