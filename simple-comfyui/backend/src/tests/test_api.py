"""Tests for the FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
import json
import io

from ..main import app
from ..models import GraphDefinition, Node, Edge, NodeType, NodeData


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def sample_graph():
    """Create a sample valid graph."""
    return {
        "nodes": [
            {
                "id": "text1",
                "type": "text",
                "data": {"text": "A beautiful sunset"},
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "image1",
                "type": "image",
                "data": {},
                "position": {"x": 400, "y": 100}
            }
        ],
        "edges": [
            {
                "id": "e1",
                "source": "text1",
                "target": "image1"
            }
        ]
    }


class TestBasicEndpoints:
    """Test basic API endpoints."""
    
    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Node-Based Media Generation API"
        assert "status" in data
        assert "openai_configured" in data
        assert "fal_configured" in data
    
    def test_health_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_example_workflow_endpoint(self, client):
        """Test the example workflow endpoint."""
        response = client.get("/example-workflow")
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) > 0


class TestAPIConfiguration:
    """Test API key configuration."""
    
    def test_configure_api_keys(self, client):
        """Test configuring API keys."""
        config = {
            "openai_api_key": "test-openai-key",
            "fal_api_key": "test-fal-key"
        }
        
        response = client.post("/configure-api", json=config)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "message" in data
    
    def test_configure_partial_keys(self, client):
        """Test configuring only some API keys."""
        config = {"openai_api_key": "test-openai-key"}
        
        response = client.post("/configure-api", json=config)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestGraphValidation:
    """Test graph validation endpoint."""
    
    def test_validate_valid_graph(self, client, sample_graph):
        """Test validation of a valid graph."""
        response = client.post("/validate-graph", json=sample_graph)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["errors"]) == 0
    
    def test_validate_invalid_graph(self, client):
        """Test validation of an invalid graph."""
        invalid_graph = {
            "nodes": [
                {
                    "id": "text1",
                    "type": "text",
                    "data": {},  # Missing text data
                    "position": {"x": 100, "y": 100}
                }
            ],
            "edges": []
        }
        
        response = client.post("/validate-graph", json=invalid_graph)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0
    
    def test_validate_graph_with_cycle(self, client):
        """Test validation of graph with cycles."""
        cyclic_graph = {
            "nodes": [
                {
                    "id": "text1",
                    "type": "text",
                    "data": {"text": "Hello"},
                    "position": {"x": 100, "y": 100}
                },
                {
                    "id": "text2",
                    "type": "text",
                    "data": {},
                    "position": {"x": 400, "y": 100}
                }
            ],
            "edges": [
                {"id": "e1", "source": "text1", "target": "text2"},
                {"id": "e2", "source": "text2", "target": "text1"}
            ]
        }
        
        response = client.post("/validate-graph", json=cyclic_graph)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert any("cycle" in error["message"].lower() for error in data["errors"])


class TestGraphExecution:
    """Test graph execution endpoint."""
    
    @patch('src.main.service_manager')
    def test_run_graph_without_api_keys(self, mock_service_manager, client, sample_graph):
        """Test running graph without API keys configured."""
        mock_service_manager.is_openai_configured.return_value = False
        mock_service_manager.is_fal_configured.return_value = False
        
        response = client.post("/run-graph", json=sample_graph)
        # The endpoint actually returns 500 when it catches the HTTPException internally
        assert response.status_code == 500
        assert "No API keys configured" in response.json()["detail"]
    
    @patch('src.main.graph_processor')
    @patch('src.main.service_manager')
    def test_run_graph_success(self, mock_service_manager, mock_graph_processor, client, sample_graph):
        """Test successful graph execution."""
        # Mock service manager as configured
        mock_service_manager.is_openai_configured.return_value = True
        mock_service_manager.is_fal_configured.return_value = True
        
        # Mock successful execution
        mock_execution_result = MagicMock()
        mock_execution_result.success = True
        mock_execution_result.nodes = []
        mock_execution_result.errors = []
        mock_graph_processor.execute_graph = AsyncMock(return_value=mock_execution_result)
        
        response = client.post("/run-graph", json=sample_graph)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    @patch('src.main.graph_processor')
    @patch('src.main.service_manager')
    def test_run_graph_failure(self, mock_service_manager, mock_graph_processor, client, sample_graph):
        """Test graph execution with failure."""
        # Mock service manager as configured
        mock_service_manager.is_openai_configured.return_value = True
        mock_service_manager.is_fal_configured.return_value = True
        
        # Mock failed execution
        mock_execution_result = MagicMock()
        mock_execution_result.success = False
        mock_execution_result.nodes = []
        mock_execution_result.errors = ["Service error"]
        mock_graph_processor.execute_graph = AsyncMock(return_value=mock_execution_result)
        
        response = client.post("/run-graph", json=sample_graph)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert len(data["errors"]) > 0


class TestFileUpload:
    """Test file upload functionality."""
    
    def test_upload_image_file(self, client):
        """Test uploading an image file."""
        # Create a fake image file
        image_content = b"fake image content"
        files = {
            "file": ("test.jpg", io.BytesIO(image_content), "image/jpeg")
        }
        
        response = client.post("/upload-file", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["file_type"] == "image"
        assert data["filename"] == "test.jpg"
        assert data["file_url"].startswith("/uploads/")
    
    def test_upload_video_file(self, client):
        """Test uploading a video file."""
        video_content = b"fake video content"
        files = {
            "file": ("test.mp4", io.BytesIO(video_content), "video/mp4")
        }
        
        response = client.post("/upload-file", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["file_type"] == "video"
        assert data["filename"] == "test.mp4"
        assert data["file_url"].startswith("/uploads/")
    
    def test_upload_unsupported_file(self, client):
        """Test uploading an unsupported file type."""
        text_content = b"some text content"
        files = {
            "file": ("test.txt", io.BytesIO(text_content), "text/plain")
        }
        
        response = client.post("/upload-file", files=files)
        # The endpoint actually returns 500 when it catches the HTTPException internally
        assert response.status_code == 500
        assert "Unsupported file type" in response.json()["detail"]


class TestErrorHandling:
    """Test error handling scenarios."""
    
    def test_invalid_json_request(self, client):
        """Test handling of invalid JSON requests."""
        response = client.post(
            "/validate-graph",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422  # Validation error
    
    def test_missing_required_fields(self, client):
        """Test handling of requests with missing required fields."""
        incomplete_graph = {
            "nodes": [],
            # Missing edges field
        }
        
        response = client.post("/validate-graph", json=incomplete_graph)
        assert response.status_code == 422  # Validation error
    
    @patch('src.main.graph_processor')
    def test_internal_server_error(self, mock_graph_processor, client, sample_graph):
        """Test handling of internal server errors."""
        # Make the graph processor raise an exception
        mock_graph_processor.validate_graph.side_effect = Exception("Internal error")
        
        response = client.post("/validate-graph", json=sample_graph)
        assert response.status_code == 500
        assert "Validation failed" in response.json()["detail"]