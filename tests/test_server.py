from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport
from nexus.server.app import create_app
from nexus.app_store import AppStore, AgentManifest
from nexus.blackboard import Blackboard

@pytest.mark.asyncio
async def test_server_routes():
    store = AppStore()
    store.register(AgentManifest(
        id="test-agent",
        name="Test Worker",
        capabilities=["test"],
        version="1.0.0",
    ))
    bb = Blackboard()
    await bb.set("system:status", "online", author="init")

    app = create_app(app_store=store, blackboard=bb)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root HTML
        resp = await client.get("/")
        assert resp.status_code == 200
        assert "Nexus" in resp.text

        # 2. API Agents
        resp_agents = await client.get("/api/agents")
        assert resp_agents.status_code == 200
        data_agents = resp_agents.json()
        assert len(data_agents) == 1
        assert data_agents[0]["id"] == "test-agent"

        # 3. API Blackboard
        resp_bb = await client.get("/api/blackboard")
        assert resp_bb.status_code == 200
        data_bb = resp_bb.json()
        assert len(data_bb) == 1
        assert data_bb[0]["key"] == "system:status"


@pytest.mark.asyncio
async def test_server_spa_serving():
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Verify SPA Root serving
        resp = await client.get("/")
        assert resp.status_code == 200
        assert "Nexus" in resp.text

        dist_path = Path(__file__).resolve().parents[1] / "frontend" / "dist"
        if (dist_path / "index.html").exists():
            assert "root" in resp.text
            # Verify static assets mounting
            assets_dir = dist_path / "assets"
            if assets_dir.is_dir():
                js_files = list(assets_dir.glob("*.js"))
                if js_files:
                    asset_resp = await client.get(f"/assets/{js_files[0].name}")
                    assert asset_resp.status_code == 200
                    assert len(asset_resp.text) > 0
                css_files = list(assets_dir.glob("*.css"))
                if css_files:
                    css_resp = await client.get(f"/assets/{css_files[0].name}")
                    assert css_resp.status_code == 200
                    assert len(css_resp.text) > 0

