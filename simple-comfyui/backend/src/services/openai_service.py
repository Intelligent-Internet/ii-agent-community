"""OpenAI service integration for text processing and image analysis."""

import openai
import logging
from typing import List, Optional
import base64
import httpx
import asyncio
import functools

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for interacting with OpenAI APIs."""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
    
    async def _run_sync_in_executor(self, func, *args, **kwargs):
        """Run synchronous OpenAI calls in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, functools.partial(func, *args, **kwargs))
    
    async def text_to_text(self, inputs: List[str], task: str = "combine") -> str:
        """Process multiple text inputs into a single output."""
        try:
            if task == "combine":
                prompt = f"""Please combine and synthesize the following text inputs into a coherent, comprehensive response:

{chr(10).join([f"Input {i+1}: {text}" for i, text in enumerate(inputs)])}

Create a well-structured response that incorporates the key information from all inputs."""
            elif task == "summarize":
                prompt = f"""Please summarize the following text inputs into a concise summary:

{chr(10).join([f"Input {i+1}: {text}" for i, text in enumerate(inputs)])}

Provide a clear, concise summary that captures the main points."""
            else:
                prompt = f"""Process the following text inputs according to the task '{task}':

{chr(10).join([f"Input {i+1}: {text}" for i, text in enumerate(inputs)])}"""
            
            logger.info(f"Processing {len(inputs)} text inputs with task: {task}")
            
            response = await self._run_sync_in_executor(
                self.client.chat.completions.create,
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7
            )
            
            result = response.choices[0].message.content
            logger.info("Text processing completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI text-to-text failed: {str(e)}")
            raise Exception(f"Text processing failed: {str(e)}")
    
    async def image_to_text(self, image_url: str, prompt: Optional[str] = None) -> str:
        """Analyze image and generate text description or answer questions."""
        try:
            logger.info(f"Analyzing image: {image_url}")
            
            # Prepare the content array
            content = []
            
            if prompt:
                content.append({"type": "text", "text": prompt})
                logger.info(f"With prompt: {prompt[:100]}...")
            else:
                content.append({
                    "type": "text", 
                    "text": "Please provide a detailed description of this image, including objects, people, setting, colors, and any text visible in the image."
                })
            
            # Add the image
            content.append({
                "type": "image_url",
                "image_url": {"url": image_url}
            })
            
            response = await self._run_sync_in_executor(
                self.client.chat.completions.create,
                model="gpt-4o",
                messages=[{"role": "user", "content": content}],
                max_tokens=500
            )
            
            result = response.choices[0].message.content
            logger.info("Image analysis completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI image-to-text failed: {str(e)}")
            raise Exception(f"Image analysis failed: {str(e)}")
    
    async def text_image_to_text(self, image_url: str, text_prompt: str) -> str:
        """Answer questions about an image using text prompt."""
        try:
            logger.info(f"Analyzing image with prompt: {text_prompt[:100]}...")
            
            content = [
                {"type": "text", "text": text_prompt},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
            
            response = await self._run_sync_in_executor(
                self.client.chat.completions.create,
                model="gpt-4o",
                messages=[{"role": "user", "content": content}],
                max_tokens=500
            )
            
            result = response.choices[0].message.content
            logger.info("Image QA completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI text+image-to-text failed: {str(e)}")
            raise Exception(f"Image QA failed: {str(e)}")
    
    async def _image_url_to_base64(self, image_url: str) -> str:
        """Convert image URL to base64 data URI."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                response.raise_for_status()
                
                # Get content type
                content_type = response.headers.get("content-type", "image/jpeg")
                
                # Encode to base64
                image_data = base64.b64encode(response.content).decode('utf-8')
                
                return f"data:{content_type};base64,{image_data}"
                
        except Exception as e:
            logger.error(f"Failed to convert image URL to base64: {str(e)}")
            # Return original URL as fallback
            return image_url