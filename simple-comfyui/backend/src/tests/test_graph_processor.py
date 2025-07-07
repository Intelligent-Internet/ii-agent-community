"""Tests for graph processor functionality."""

import pytest
from unittest.mock import AsyncMock, MagicMock
import asyncio

from ..models import GraphDefinition, Node, Edge, NodeType, NodeData
from ..graph_processor import GraphProcessor
from ..services import ServiceManager


@pytest.fixture
def mock_service_manager():
    """Create a mock service manager."""
    manager = MagicMock(spec=ServiceManager)
    manager.process_text_to_text = AsyncMock(return_value="Combined text result")
    manager.process_text_to_image = AsyncMock(return_value="http://example.com/image.jpg")
    manager.process_text_to_video = AsyncMock(return_value="http://example.com/video.mp4")
    manager.process_text_image_to_image = AsyncMock(return_value="http://example.com/edited.jpg")
    manager.process_image_to_video = AsyncMock(return_value="http://example.com/video2.mp4")
    manager.process_image_to_text = AsyncMock(return_value="Image description")
    return manager


@pytest.fixture
def graph_processor(mock_service_manager):
    """Create a graph processor with mocked services."""
    return GraphProcessor(mock_service_manager)


class TestGraphValidation:
    """Test graph validation functionality."""
    
    def test_valid_simple_graph(self, graph_processor):
        """Test validation of a simple valid graph."""
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData(text="Hello")),
                Node(id="image1", type=NodeType.IMAGE, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="text1", target="image1")
            ]
        )
        
        result = graph_processor.validate_graph(graph)
        assert result.valid is True
        assert len(result.errors) == 0
    
    def test_invalid_missing_node(self, graph_processor):
        """Test validation with missing node reference."""
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData(text="Hello"))
            ],
            edges=[
                Edge(id="e1", source="text1", target="nonexistent")
            ]
        )
        
        result = graph_processor.validate_graph(graph)
        assert result.valid is False
        assert len(result.errors) == 1
        assert "not found" in result.errors[0].message
    
    def test_invalid_cycle(self, graph_processor):
        """Test validation with cyclic graph."""
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData(text="Hello")),
                Node(id="text2", type=NodeType.TEXT, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="text1", target="text2"),
                Edge(id="e2", source="text2", target="text1")
            ]
        )
        
        result = graph_processor.validate_graph(graph)
        assert result.valid is False
        assert any("cycle" in error.message.lower() for error in result.errors)
    
    def test_invalid_node_without_data(self, graph_processor):
        """Test validation of node without required input data."""
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData())  # No text data
            ],
            edges=[]
        )
        
        result = graph_processor.validate_graph(graph)
        assert result.valid is False
        assert any("must have text data" in error.message for error in result.errors)


class TestGraphExecution:
    """Test graph execution functionality."""
    
    @pytest.mark.asyncio
    async def test_simple_text_to_image(self, graph_processor, mock_service_manager):
        """Test simple text-to-image workflow."""
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData(text="A beautiful sunset")),
                Node(id="image1", type=NodeType.IMAGE, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="text1", target="image1")
            ]
        )
        
        result = await graph_processor.execute_graph(graph)
        
        assert result.success is True
        assert len(result.errors) == 0
        
        # Check that the image node got the result
        image_node = next(n for n in result.nodes if n.id == "image1")
        assert image_node.data.result == "http://example.com/image.jpg"
        
        # Verify service was called correctly
        mock_service_manager.process_text_to_image.assert_called_once_with("A beautiful sunset")
    
    @pytest.mark.asyncio
    async def test_text_combination(self, graph_processor, mock_service_manager):
        """Test multiple text inputs being combined."""
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData(text="Hello")),
                Node(id="text2", type=NodeType.TEXT, data=NodeData(text="World")),
                Node(id="text3", type=NodeType.TEXT, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="text1", target="text3"),
                Edge(id="e2", source="text2", target="text3")
            ]
        )
        
        result = await graph_processor.execute_graph(graph)
        
        assert result.success is True
        
        # Check that the target text node got the combined result
        text_node = next(n for n in result.nodes if n.id == "text3")
        assert text_node.data.result == "Combined text result"
        
        # Verify service was called with both inputs
        mock_service_manager.process_text_to_text.assert_called_once_with(["Hello", "World"], "combine")
    
    @pytest.mark.asyncio
    async def test_image_to_text(self, graph_processor, mock_service_manager):
        """Test image-to-text analysis."""
        graph = GraphDefinition(
            nodes=[
                Node(id="image1", type=NodeType.IMAGE, data=NodeData(file_url="http://example.com/input.jpg")),
                Node(id="text1", type=NodeType.TEXT, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="image1", target="text1")
            ]
        )
        
        result = await graph_processor.execute_graph(graph)
        
        assert result.success is True
        
        # Check that the text node got the description
        text_node = next(n for n in result.nodes if n.id == "text1")
        assert text_node.data.result == "Image description"
        
        # Verify service was called correctly
        mock_service_manager.process_image_to_text.assert_called_once_with("http://example.com/input.jpg")
    
    @pytest.mark.asyncio
    async def test_complex_workflow(self, graph_processor, mock_service_manager):
        """Test a complex multi-step workflow."""
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData(text="A mountain landscape")),
                Node(id="image1", type=NodeType.IMAGE, data=NodeData()),
                Node(id="text2", type=NodeType.TEXT, data=NodeData(text="What do you see?")),
                Node(id="text3", type=NodeType.TEXT, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="text1", target="image1"),  # text -> image
                Edge(id="e2", source="image1", target="text3"),  # image -> text
                Edge(id="e3", source="text2", target="text3")    # text + image -> text (QA)
            ]
        )
        
        result = await graph_processor.execute_graph(graph)
        
        assert result.success is True
        
        # Verify execution order and results
        image_node = next(n for n in result.nodes if n.id == "image1")
        text_result_node = next(n for n in result.nodes if n.id == "text3")
        
        assert image_node.data.result == "http://example.com/image.jpg"
        assert text_result_node.data.result == "Image description"
        
        # Verify correct service calls
        mock_service_manager.process_text_to_image.assert_called_once_with("A mountain landscape")
        mock_service_manager.process_image_to_text.assert_called_once_with(
            "http://example.com/image.jpg", "What do you see?"
        )
    
    @pytest.mark.asyncio
    async def test_execution_with_error(self, graph_processor, mock_service_manager):
        """Test execution when a service call fails."""
        # Make the text-to-image service fail
        mock_service_manager.process_text_to_image.side_effect = Exception("Service error")
        
        graph = GraphDefinition(
            nodes=[
                Node(id="text1", type=NodeType.TEXT, data=NodeData(text="Test")),
                Node(id="image1", type=NodeType.IMAGE, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="text1", target="image1")
            ]
        )
        
        result = await graph_processor.execute_graph(graph)
        
        assert result.success is False
        assert len(result.errors) > 0
        assert "Service error" in result.errors[0]
        
        # Check that the error is recorded in the node
        image_node = next(n for n in result.nodes if n.id == "image1")
        assert image_node.data.error is not None


class TestTopologicalSort:
    """Test topological sorting functionality."""
    
    def test_topological_sort_simple(self, graph_processor):
        """Test topological sort with simple linear chain."""
        graph = GraphDefinition(
            nodes=[
                Node(id="a", type=NodeType.TEXT, data=NodeData(text="A")),
                Node(id="b", type=NodeType.TEXT, data=NodeData()),
                Node(id="c", type=NodeType.TEXT, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="a", target="b"),
                Edge(id="e2", source="b", target="c")
            ]
        )
        
        order = graph_processor._topological_sort(graph)
        
        # Should be in dependency order: a -> b -> c
        assert order.index("a") < order.index("b")
        assert order.index("b") < order.index("c")
    
    def test_topological_sort_complex(self, graph_processor):
        """Test topological sort with complex dependencies."""
        graph = GraphDefinition(
            nodes=[
                Node(id="a", type=NodeType.TEXT, data=NodeData(text="A")),
                Node(id="b", type=NodeType.TEXT, data=NodeData(text="B")),
                Node(id="c", type=NodeType.TEXT, data=NodeData()),
                Node(id="d", type=NodeType.TEXT, data=NodeData())
            ],
            edges=[
                Edge(id="e1", source="a", target="c"),
                Edge(id="e2", source="b", target="c"),
                Edge(id="e3", source="c", target="d")
            ]
        )
        
        order = graph_processor._topological_sort(graph)
        
        # a and b should come before c, c should come before d
        assert order.index("a") < order.index("c")
        assert order.index("b") < order.index("c")
        assert order.index("c") < order.index("d")