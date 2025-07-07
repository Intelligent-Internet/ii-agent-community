"""fal.ai service integration for image and video generation."""

import fal_client
import logging
from typing import Dict, Any, Optional
import asyncio
import functools
import requests
import base64

logger = logging.getLogger(__name__)


def get_base64(image_url: str) -> str:
    """Get base64 from image url."""
    response = requests.get(image_url)
    return base64.b64encode(response.content).decode("utf-8")

class FalService:
    """Service for interacting with fal.ai APIs."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Set the API key for fal_client
        import os
        os.environ["FAL_KEY"] = api_key
    
    async def _run_in_executor(self, func, *args, **kwargs):
        """Run blocking fal_client operations in executor."""
        loop = asyncio.get_event_loop()
        partial_func = functools.partial(func, *args, **kwargs)
        return await loop.run_in_executor(None, partial_func)
    
    async def text_to_image(self, prompt: str, aspect_ratio: str = "1:1", num_images: int = 1) -> str:
        """Generate image from text using Imagen4 Fast."""
        try:
            logger.info(f"Generating image with prompt: {prompt[:100]}...")
            
            result = await self._run_in_executor(
                fal_client.subscribe,
                "fal-ai/imagen4/preview/fast",
                {
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "num_images": num_images
                }
            )
            
            if result and "images" in result and len(result["images"]) > 0:
                image_url = result["images"][0]["url"]
                logger.info(f"Image generated successfully: {image_url}")
                return image_url
            else:
                raise Exception("No images returned from fal.ai")
                
        except Exception as e:
            logger.error(f"fal.ai text-to-image failed: {str(e)}")
            raise Exception(f"Image generation failed: {str(e)}")
    
    async def text_to_video(
        self, 
        prompt: str, 
        aspect_ratio: str = "16:9", 
        resolution: str = "720p", 
        duration: str = "5"
    ) -> str:
        """Generate video from text using Seedance."""
        try:
            logger.info(f"Generating video with prompt: {prompt[:100]}...")
            
            result = await self._run_in_executor(
                fal_client.subscribe,
                "fal-ai/bytedance/seedance/v1/lite/text-to-video",
                {
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "resolution": resolution,
                    "duration": duration
                }
            )
            
            if result and "video" in result and "url" in result["video"]:
                video_url = result["video"]["url"]
                logger.info(f"Video generated successfully: {video_url}")
                return video_url
            else:
                raise Exception("No video returned from fal.ai")
                
        except Exception as e:
            logger.error(f"fal.ai text-to-video failed: {str(e)}")
            raise Exception(f"Video generation failed: {str(e)}")
    
    async def text_image_to_image(self, prompt: str, image_url: str) -> str:
        """Edit image with text using FLUX Kontext."""
        # import ipdb; ipdb.set_trace()
        if "localhost" in image_url:
            image_url = get_base64(image_url)
        try:
            logger.info(f"Editing image with prompt: {prompt[:100]}...")
            
            result = await self._run_in_executor(
                fal_client.subscribe,
                "fal-ai/flux-pro/kontext",
                {
                    "prompt": prompt,
                    "image_url": image_url
                }
            )
            
            if result and "images" in result and len(result["images"]) > 0:
                edited_image_url = result["images"][0]["url"]
                logger.info(f"Image edited successfully: {edited_image_url}")
                return edited_image_url
            else:
                raise Exception("No edited image returned from fal.ai")
                
        except Exception as e:
            logger.error(f"fal.ai text+image-to-image failed: {str(e)}")
            raise Exception(f"Image editing failed: {str(e)}")
    
    async def image_to_video(
        self, 
        image_url: str, 
        prompt: Optional[str] = None, 
        resolution: str = "720p", 
        duration: str = "5"
    ) -> str:
        """Generate video from image using Seedance."""
        try:
            logger.info(f"Generating video from image: {image_url}")
            
            # Provide default prompt if none given since fal.ai requires it
            if not prompt:
                prompt = "Create a video from this image with natural movement"
            
            request_data = {
                "image_url": image_url,
                "prompt": prompt,
                "resolution": resolution,
                "duration": duration
            }
            
            logger.info(f"With prompt: {prompt[:100]}...")
            
            result = await self._run_in_executor(
                fal_client.subscribe,
                "fal-ai/bytedance/seedance/v1/lite/image-to-video",
                request_data
            )
            
            if result and "video" in result and "url" in result["video"]:
                video_url = result["video"]["url"]
                logger.info(f"Video generated successfully: {video_url}")
                return video_url
            else:
                raise Exception("No video returned from fal.ai")
                
        except Exception as e:
            logger.error(f"fal.ai image-to-video failed: {str(e)}")
            raise Exception(f"Video generation from image failed: {str(e)}")
    
    async def upload_file(self, file_path: str) -> str:
        """Upload file to fal.ai storage."""
        try:
            logger.info(f"Uploading file to fal.ai: {file_path}")
            
            url = await self._run_in_executor(
                fal_client.upload_file,
                file_path
            )
            
            logger.info(f"File uploaded successfully: {url}")
            return url
            
        except Exception as e:
            logger.error(f"fal.ai file upload failed: {str(e)}")
            raise Exception(f"File upload failed: {str(e)}")