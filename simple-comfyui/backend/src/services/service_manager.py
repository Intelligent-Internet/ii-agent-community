"""Service manager to coordinate all external service integrations."""

import logging
from typing import List, Optional
from .fal_service import FalService
from .openai_service import OpenAIService

logger = logging.getLogger(__name__)


class ServiceManager:
    """Manages all external service integrations."""
    
    def __init__(self, openai_api_key: Optional[str] = None, fal_api_key: Optional[str] = None):
        self.openai_service = OpenAIService(openai_api_key) if openai_api_key else None
        self.fal_service = FalService(fal_api_key) if fal_api_key else None
    
    def update_keys(self, openai_api_key: Optional[str] = None, fal_api_key: Optional[str] = None):
        """Update API keys for services."""
        if openai_api_key:
            self.openai_service = OpenAIService(openai_api_key)
        if fal_api_key:
            self.fal_service = FalService(fal_api_key)
    
    async def process_text_to_text(self, inputs: List[str], task: str = "combine") -> str:
        """Process text-to-text operations."""
        if not self.openai_service:
            raise Exception("OpenAI API key not configured")
        
        return await self.openai_service.text_to_text(inputs, task)
    
    async def process_text_to_image(self, prompt: str, aspect_ratio: str = "1:1") -> str:
        """Process text-to-image operations."""
        if not self.fal_service:
            raise Exception("fal.ai API key not configured")
        
        return await self.fal_service.text_to_image(prompt, aspect_ratio)
    
    async def process_text_to_video(
        self, 
        prompt: str, 
        aspect_ratio: str = "16:9", 
        resolution: str = "720p", 
        duration: str = "5"
    ) -> str:
        """Process text-to-video operations."""
        if not self.fal_service:
            raise Exception("fal.ai API key not configured")
        
        return await self.fal_service.text_to_video(prompt, aspect_ratio, resolution, duration)
    
    async def process_text_image_to_image(self, prompt: str, image_url: str) -> str:
        """Process text+image-to-image operations."""
        if not self.fal_service:
            raise Exception("fal.ai API key not configured")
        
        return await self.fal_service.text_image_to_image(prompt, image_url)
    
    async def process_image_to_video(
        self, 
        image_url: str, 
        prompt: Optional[str] = None, 
        resolution: str = "720p", 
        duration: str = "5"
    ) -> str:
        """Process image-to-video operations."""
        if not self.fal_service:
            raise Exception("fal.ai API key not configured")
        
        return await self.fal_service.image_to_video(image_url, prompt, resolution, duration)
    
    async def process_image_to_text(self, image_url: str, prompt: Optional[str] = None) -> str:
        """Process image-to-text operations."""
        if not self.openai_service:
            raise Exception("OpenAI API key not configured")
        
        if prompt:
            return await self.openai_service.text_image_to_text(image_url, prompt)
        else:
            return await self.openai_service.image_to_text(image_url)
    
    async def upload_file_to_fal(self, file_path: str) -> str:
        """Upload file to fal.ai storage."""
        if not self.fal_service:
            raise Exception("fal.ai API key not configured")
        
        return await self.fal_service.upload_file(file_path)
    
    def is_openai_configured(self) -> bool:
        """Check if OpenAI service is configured."""
        return self.openai_service is not None
    
    def is_fal_configured(self) -> bool:
        """Check if fal.ai service is configured."""
        return self.fal_service is not None