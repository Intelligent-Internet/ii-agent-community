"""Data models for the node-based media generation application."""

from typing import Dict, List, Any, Optional, Union, Literal
from pydantic import BaseModel, Field
from enum import Enum


class NodeType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"


class ConnectionType(str, Enum):
    TEXT_TO_TEXT = "text_to_text"
    TEXT_TO_IMAGE = "text_to_image"
    TEXT_TO_VIDEO = "text_to_video"
    TEXT_IMAGE_TO_IMAGE = "text_image_to_image"
    TEXT_IMAGE_TO_VIDEO = "text_image_to_video"
    IMAGE_TO_VIDEO = "image_to_video"
    TEXT_IMAGE_TO_TEXT = "text_image_to_text"
    IMAGE_TO_TEXT = "image_to_text"


class NodeData(BaseModel):
    """Base data for all node types."""
    text: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None  # 'image' or 'video'
    result: Optional[Any] = None
    error: Optional[str] = None


class Node(BaseModel):
    """Node definition in the workflow graph."""
    id: str
    type: NodeType
    data: NodeData
    position: Dict[str, float] = Field(default_factory=dict)


class Edge(BaseModel):
    """Edge connection between nodes."""
    id: str
    source: str  # source node id
    target: str  # target node id
    sourceHandle: Optional[str] = None  # output handle
    targetHandle: Optional[str] = None  # input handle


class GraphDefinition(BaseModel):
    """Complete graph definition with nodes and edges."""
    nodes: List[Node]
    edges: List[Edge]


class ValidationError(BaseModel):
    """Validation error details."""
    type: Literal["edge", "node", "graph"]
    message: str
    node_id: Optional[str] = None
    edge_id: Optional[str] = None


class ValidationResult(BaseModel):
    """Result of graph validation."""
    valid: bool
    errors: List[ValidationError] = Field(default_factory=list)


class ExecutionResult(BaseModel):
    """Result of graph execution."""
    success: bool
    nodes: List[Node]
    errors: List[str] = Field(default_factory=list)


class FileUploadResponse(BaseModel):
    """Response for file upload."""
    file_url: str
    file_type: str
    filename: str


class APIConfig(BaseModel):
    """API configuration for external services."""
    openai_api_key: Optional[str] = None
    fal_api_key: Optional[str] = None


# Service-specific request/response models

class TextToTextRequest(BaseModel):
    """Request for text-to-text processing."""
    inputs: List[str]
    task: str = "combine"  # or "summarize"


class TextToImageRequest(BaseModel):
    """Request for text-to-image generation."""
    prompt: str
    aspect_ratio: str = "1:1"
    num_images: int = 1


class TextToVideoRequest(BaseModel):
    """Request for text-to-video generation."""
    prompt: str
    aspect_ratio: str = "16:9"
    resolution: str = "720p"
    duration: str = "5"


class TextImageToImageRequest(BaseModel):
    """Request for text+image to image editing."""
    prompt: str
    image_url: str


class ImageToVideoRequest(BaseModel):
    """Request for image-to-video generation."""
    image_url: str
    prompt: Optional[str] = None
    resolution: str = "720p"
    duration: str = "5"


class ImageToTextRequest(BaseModel):
    """Request for image-to-text analysis."""
    image_url: str
    prompt: Optional[str] = None


class ServiceResponse(BaseModel):
    """Generic service response."""
    success: bool
    result: Any = None
    error: Optional[str] = None