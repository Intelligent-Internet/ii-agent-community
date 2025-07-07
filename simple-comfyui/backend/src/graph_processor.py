"""Graph processing engine with topological sorting and execution."""

from typing import Dict, List, Set, Tuple, Optional, Any, Callable, AsyncGenerator
from collections import defaultdict, deque
import asyncio
import logging

from .models import (
    GraphDefinition, Node, Edge, NodeType, ValidationResult, ValidationError,
    ExecutionResult, NodeData, ConnectionType
)
from .services import ServiceManager

logger = logging.getLogger(__name__)


class GraphProcessor:
    """Handles graph validation, topological sorting, and execution."""
    
    def __init__(self, service_manager: ServiceManager, base_url: str = None):
        self.service_manager = service_manager
        self.base_url = base_url
    
    def _convert_to_full_url(self, url_or_path: str) -> str:
        """Convert relative URLs to full URLs for AI services."""
        if url_or_path.startswith('http'):
            return url_or_path
        elif url_or_path.startswith('/'):
            return f"{self.base_url}{url_or_path}"
        else:
            return f"{self.base_url}/{url_or_path}"
        
    def validate_graph(self, graph: GraphDefinition) -> ValidationResult:
        """Validate the entire graph structure."""
        errors = []
        
        # Validate edges
        edge_errors = self._validate_edges(graph)
        errors.extend(edge_errors)
        
        # Validate nodes
        node_errors = self._validate_nodes(graph)
        errors.extend(node_errors)
        
        # Validate graph structure (cycles, etc.)
        graph_errors = self._validate_graph_structure(graph)
        errors.extend(graph_errors)
        
        return ValidationResult(valid=len(errors) == 0, errors=errors)
    
    def _validate_edges(self, graph: GraphDefinition) -> List[ValidationError]:
        """Validate edge connections and compatibility."""
        errors = []
        node_map = {node.id: node for node in graph.nodes}
        
        for edge in graph.edges:
            # Check if source and target nodes exist
            if edge.source not in node_map:
                errors.append(ValidationError(
                    type="edge",
                    message=f"Source node '{edge.source}' not found",
                    edge_id=edge.id
                ))
                continue
                
            if edge.target not in node_map:
                errors.append(ValidationError(
                    type="edge",
                    message=f"Target node '{edge.target}' not found",
                    edge_id=edge.id
                ))
                continue
            
            source_node = node_map[edge.source]
            target_node = node_map[edge.target]
            
            # Validate connection type compatibility
            connection_valid = self._validate_connection_type(source_node, target_node)
            if not connection_valid:
                errors.append(ValidationError(
                    type="edge",
                    message=f"Invalid connection from {source_node.type} to {target_node.type}",
                    edge_id=edge.id
                ))
        
        return errors
    
    def _validate_connection_type(self, source: Node, target: Node) -> bool:
        """Check if connection between two node types is valid."""
        valid_connections = {
            # Source -> Target
            (NodeType.TEXT, NodeType.TEXT): True,
            (NodeType.TEXT, NodeType.IMAGE): True,
            (NodeType.TEXT, NodeType.VIDEO): True,
            (NodeType.IMAGE, NodeType.TEXT): True,
            (NodeType.IMAGE, NodeType.IMAGE): True,  # For text + image -> image workflows
            (NodeType.IMAGE, NodeType.VIDEO): True,
        }
        
        return valid_connections.get((source.type, target.type), False)
    
    def _validate_nodes(self, graph: GraphDefinition) -> List[ValidationError]:
        """Validate individual nodes."""
        errors = []
        
        # Create adjacency map for input validation
        incoming_edges = defaultdict(list)
        for edge in graph.edges:
            incoming_edges[edge.target].append(edge)
        
        for node in graph.nodes:
            # Check if nodes with no inputs have required data
            if node.id not in incoming_edges:
                if node.type == NodeType.TEXT and not node.data.text:
                    errors.append(ValidationError(
                        type="node",
                        message="Text node without inputs must have text data",
                        node_id=node.id
                    ))
                elif node.type in [NodeType.IMAGE, NodeType.VIDEO] and not node.data.file_url:
                    errors.append(ValidationError(
                        type="node",
                        message=f"{node.type.value.title()} node without inputs must have file data",
                        node_id=node.id
                    ))
            
            # Validate input count for nodes with specific requirements
            input_count = len(incoming_edges[node.id])
            if node.type == NodeType.TEXT and input_count > 0:
                # Text nodes can have multiple text inputs for combination
                pass
            elif node.type == NodeType.IMAGE and input_count > 2:
                errors.append(ValidationError(
                    type="node",
                    message="Image nodes can have at most 2 inputs (text + image)",
                    node_id=node.id
                ))
            elif node.type == NodeType.VIDEO and input_count > 2:
                errors.append(ValidationError(
                    type="node",
                    message="Video nodes can have at most 2 inputs (text + image)",
                    node_id=node.id
                ))
        
        return errors
    
    def _validate_graph_structure(self, graph: GraphDefinition) -> List[ValidationError]:
        """Validate graph-level properties like cycles."""
        errors = []
        
        # Check for cycles using DFS
        if self._has_cycles(graph):
            errors.append(ValidationError(
                type="graph",
                message="Graph contains cycles which would prevent execution"
            ))
        
        return errors
    
    def _has_cycles(self, graph: GraphDefinition) -> bool:
        """Detect cycles in the graph using DFS."""
        # Build adjacency list
        adj = defaultdict(list)
        for edge in graph.edges:
            adj[edge.source].append(edge.target)
        
        # Track node states: 0=unvisited, 1=visiting, 2=visited
        state = {node.id: 0 for node in graph.nodes}
        
        def dfs(node_id: str) -> bool:
            # Skip if node doesn't exist (handled by edge validation)
            if node_id not in state:
                return False
                
            if state[node_id] == 1:  # Currently visiting - cycle detected
                return True
            if state[node_id] == 2:  # Already visited
                return False
            
            state[node_id] = 1  # Mark as visiting
            
            for neighbor in adj[node_id]:
                if dfs(neighbor):
                    return True
            
            state[node_id] = 2  # Mark as visited
            return False
        
        # Check all nodes
        for node in graph.nodes:
            if state[node.id] == 0 and dfs(node.id):
                return True
        
        return False
    
    def _topological_sort(self, graph: GraphDefinition) -> List[str]:
        """Perform topological sort to determine execution order."""
        # Build adjacency list and in-degree count
        adj = defaultdict(list)
        in_degree = {node.id: 0 for node in graph.nodes}
        
        for edge in graph.edges:
            adj[edge.source].append(edge.target)
            in_degree[edge.target] += 1
        
        # Kahn's algorithm
        queue = deque([node_id for node_id, degree in in_degree.items() if degree == 0])
        result = []
        
        while queue:
            node_id = queue.popleft()
            result.append(node_id)
            
            for neighbor in adj[node_id]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return result
    
    async def execute_graph(self, graph: GraphDefinition) -> ExecutionResult:
        """Execute the graph in topological order."""
        try:
            # Validate graph first
            validation = self.validate_graph(graph)
            if not validation.valid:
                return ExecutionResult(
                    success=False,
                    nodes=graph.nodes,
                    errors=[f"{err.type}: {err.message}" for err in validation.errors]
                )
            
            # Get execution order
            execution_order = self._topological_sort(graph)
            
            # Create node map for easy access
            node_map = {node.id: node for node in graph.nodes}
            
            # Build edge maps for efficient lookup
            incoming_edges = defaultdict(list)
            for edge in graph.edges:
                incoming_edges[edge.target].append(edge)
            
            errors = []
            
            # Execute nodes in topological order
            for node_id in execution_order:
                node = node_map[node_id]
                
                try:
                    await self._execute_node(node, incoming_edges[node_id], node_map)
                except Exception as e:
                    error_msg = f"Error executing node {node_id}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    node.data.error = str(e)
            
            return ExecutionResult(
                success=len(errors) == 0,
                nodes=list(node_map.values()),
                errors=errors
            )
            
        except Exception as e:
            logger.error(f"Graph execution failed: {str(e)}")
            return ExecutionResult(
                success=False,
                nodes=graph.nodes,
                errors=[f"Graph execution failed: {str(e)}"]
            )

    async def execute_graph_streaming(self, graph: GraphDefinition) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute the graph in topological order, yielding node results as they complete."""
        try:
            # Validate graph first
            validation = self.validate_graph(graph)
            if not validation.valid:
                yield {
                    "type": "error",
                    "errors": [f"{err.type}: {err.message}" for err in validation.errors]
                }
                return
            
            # Yield initial status
            yield {
                "type": "start",
                "total_nodes": len(graph.nodes),
                "message": "Starting workflow execution..."
            }
            
            # Get execution order
            execution_order = self._topological_sort(graph)
            
            # Create node map for easy access
            node_map = {node.id: node for node in graph.nodes}
            
            # Build edge maps for efficient lookup
            incoming_edges = defaultdict(list)
            for edge in graph.edges:
                incoming_edges[edge.target].append(edge)
            
            errors = []
            completed_nodes = 0
            
            # Execute nodes in topological order
            for node_id in execution_order:
                node = node_map[node_id]
                
                # Yield node start event
                yield {
                    "type": "node_start",
                    "node_id": node_id,
                    "node_type": node.type.value,
                    "progress": completed_nodes / len(graph.nodes),
                    "message": f"Executing {node.type.value} node: {node_id}"
                }
                
                try:
                    await self._execute_node(node, incoming_edges[node_id], node_map)
                    
                    # Yield node completion event
                    completed_nodes += 1
                    yield {
                        "type": "node_complete",
                        "node_id": node_id,
                        "node_type": node.type.value,
                        "result": node.data.result,
                        "error": node.data.error,
                        "progress": completed_nodes / len(graph.nodes),
                        "message": f"Completed {node.type.value} node: {node_id}"
                    }
                    
                except Exception as e:
                    error_msg = f"Error executing node {node_id}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    node.data.error = str(e)
                    completed_nodes += 1
                    
                    # Yield node error event
                    yield {
                        "type": "node_error",
                        "node_id": node_id,
                        "node_type": node.type.value,
                        "error": str(e),
                        "progress": completed_nodes / len(graph.nodes),
                        "message": f"Error in {node.type.value} node: {node_id}"
                    }
            
            # Yield final completion event
            yield {
                "type": "complete",
                "success": len(errors) == 0,
                "total_nodes": len(graph.nodes),
                "completed_nodes": completed_nodes,
                "errors": errors,
                "message": f"Workflow execution {'completed successfully' if len(errors) == 0 else 'completed with errors'}"
            }
            
        except Exception as e:
            logger.error(f"Graph execution failed: {str(e)}")
            yield {
                "type": "error",
                "errors": [f"Graph execution failed: {str(e)}"]
            }

    async def _execute_node(self, node: Node, incoming_edges: List[Edge], node_map: Dict[str, Node]):
        """Execute a single node based on its type and inputs."""
        logger.info(f"Executing node {node.id} of type {node.type}")
        
        # Clear previous results and errors
        node.data.result = None
        node.data.error = None
        
        # Collect inputs from connected nodes
        text_inputs = []
        image_input = None
        
        for edge in incoming_edges:
            source_node = node_map[edge.source]
            
            if source_node.type == NodeType.TEXT:
                if source_node.data.result:
                    text_inputs.append(source_node.data.result)
                elif source_node.data.text:
                    text_inputs.append(source_node.data.text)
            elif source_node.type == NodeType.IMAGE:
                if source_node.data.result:
                    image_input = source_node.data.result
                elif source_node.data.file_url:
                    image_input = source_node.data.file_url
        
        # Add node's own data if no inputs
        if not incoming_edges:
            if node.type == NodeType.TEXT and node.data.text:
                text_inputs.append(node.data.text)
            elif node.type in [NodeType.IMAGE, NodeType.VIDEO] and node.data.file_url:
                image_input = node.data.file_url
        
        # Determine the type of operation based on inputs and target
        try:
            result = await self._process_node_operation(node, text_inputs, image_input)
            node.data.result = result
            logger.info(f"Node {node.id} executed successfully")
        except Exception as e:
            logger.error(f"Node {node.id} execution failed: {str(e)}")
            node.data.error = str(e)
            raise
    
    async def _process_node_operation(self, node: Node, text_inputs: List[str], image_input: Optional[str]) -> Any:
        """Process the specific operation for this node."""
        
        # Convert image_input to full URL if it's a relative path
        if image_input:
            image_input = self._convert_to_full_url(image_input)
        
        # Determine operation type
        if node.type == NodeType.TEXT:
            if len(text_inputs) > 1:
                # Multiple text inputs -> combine/summarize
                return await self.service_manager.process_text_to_text(text_inputs, "combine")
            elif len(text_inputs) == 1 and image_input:
                # Text + Image -> Text (QA)
                return await self.service_manager.process_image_to_text(
                    image_input, text_inputs[0]
                )
            elif image_input and not text_inputs:
                # Image only -> Text (description)
                return await self.service_manager.process_image_to_text(image_input)
            elif len(text_inputs) == 1:
                # Single text input - pass through or process
                return text_inputs[0]
            else:
                raise ValueError("Text node has no valid inputs")
        
        elif node.type == NodeType.IMAGE:
            if len(text_inputs) == 1 and not image_input:
                # Text -> Image
                return await self.service_manager.process_text_to_image(text_inputs[0])
            elif len(text_inputs) == 1 and image_input:
                # Text + Image -> Image (editing)
                return await self.service_manager.process_text_image_to_image(
                    text_inputs[0], image_input
                )
            elif image_input and not text_inputs:
                # Image passthrough
                return image_input
            else:
                raise ValueError("Image node has no valid inputs")
        
        elif node.type == NodeType.VIDEO:
            if len(text_inputs) == 1 and not image_input:
                # Text -> Video
                return await self.service_manager.process_text_to_video(text_inputs[0])
            elif len(text_inputs) == 1 and image_input:
                # Text + Image -> Video
                return await self.service_manager.process_image_to_video(
                    image_input, text_inputs[0]
                )
            elif image_input and not text_inputs:
                # Image -> Video
                return await self.service_manager.process_image_to_video(
                    image_input, "Create a video from this image with natural movement"
                )
            else:
                raise ValueError("Video node has no valid inputs")
        
        else:
            raise ValueError(f"Unknown node type: {node.type}")