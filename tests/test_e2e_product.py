import json
import pytest
from click.testing import CliRunner
from nexus.cli import cli

def test_cli_demo_command():
    runner = CliRunner()
    result = runner.invoke(cli, ["demo", "--scenario", "self-heal"])
    assert result.exit_code == 0
    assert "Self-Healing Security Guard Demo" in result.output
    assert "Broken Input Code" in result.output
    assert "Healed & Verified Output" in result.output

def test_cli_run_with_persistence(tmp_path):
    db_file = str(tmp_path / "cli_blackboard.db")
    receipt_file = str(tmp_path / "cli_receipt.json")
    runner = CliRunner()

    result = runner.invoke(cli, [
        "run",
        "Clean dataset and write python code",
        "--provider", "mock",
        "--persist", db_file,
        "--export-receipt", receipt_file,
    ])
    assert result.exit_code == 0
    assert "Task completed successfully" in result.output

    # Check persistence DB exists
    assert (tmp_path / "cli_blackboard.db").exists()
    assert (tmp_path / "cli_receipt.json").exists()

def test_cli_list_agents_rich():
    runner = CliRunner()
    result = runner.invoke(cli, ["list-agents"])
    assert result.exit_code == 0
    assert "Nexus Worker App Store" in result.output
    assert "coding-agent" in result.output
