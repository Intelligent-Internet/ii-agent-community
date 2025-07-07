"""Main FastAPI application for node-based media generation."""

import os
import logging
import json
from pathlib import Path
from datetime import timedelta
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import uvicorn
from typing import Optional, List

from .models import (
    GraphDefinition, ValidationResult, ExecutionResult, 
    FileUploadResponse, APIConfig
)
from .graph_processor import GraphProcessor
from .services import ServiceManager
from .database import engine, get_db, Base
from .user_models import (
    User, UserWorkflow, UserCreate, UserLogin, UserResponse, 
    WorkflowCreate, WorkflowUpdate, WorkflowResponse
)
from .auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES, Token
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Node-Based Media Generation API",
    description="A visual workflow editor for AI-powered media generation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# Mount static files for serving uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", None)
FAL_API_KEY = os.getenv("FAL_API_KEY", None)

service_manager = ServiceManager(OPENAI_API_KEY, FAL_API_KEY)
# Get base URL from environment or use default
BASE_URL = "http://localhost:8080"
graph_processor = GraphProcessor(service_manager, BASE_URL)


# Authentication endpoints

@app.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        # Check if username exists
        if db.query(User).filter(User.username == user.username).first():
            raise HTTPException(
                status_code=400,
                detail="Username already registered"
            )
        
        # Check if email exists
        if db.query(User).filter(User.email == user.email).first():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"New user registered: {user.username}")
        return db_user
        
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    try:
        user = authenticate_user(db, user_credentials.username, user_credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        logger.info(f"User logged in: {user.username}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

# User workflow endpoints

@app.get("/my-workflows", response_model=List[WorkflowResponse])
async def get_user_workflows(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's workflows."""
    workflows = db.query(UserWorkflow).filter(UserWorkflow.user_id == current_user.id).all()
    return workflows

@app.post("/save-workflow", response_model=WorkflowResponse)
async def save_workflow(
    workflow: WorkflowCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save a new workflow for the current user."""
    try:
        db_workflow = UserWorkflow(
            user_id=current_user.id,
            name=workflow.name,
            description=workflow.description,
            workflow_data=workflow.workflow_data,
            is_public=workflow.is_public
        )
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)
        
        logger.info(f"Workflow saved: {workflow.name} for user {current_user.username}")
        return db_workflow
        
    except Exception as e:
        logger.error(f"Failed to save workflow: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update-workflow/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_update: WorkflowUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing workflow."""
    try:
        db_workflow = db.query(UserWorkflow).filter(
            UserWorkflow.id == workflow_id,
            UserWorkflow.user_id == current_user.id
        ).first()
        
        if not db_workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Update fields
        update_data = workflow_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_workflow, field, value)
        
        db.commit()
        db.refresh(db_workflow)
        
        logger.info(f"Workflow updated: {db_workflow.name} for user {current_user.username}")
        return db_workflow
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workflow: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete-workflow/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a workflow."""
    try:
        db_workflow = db.query(UserWorkflow).filter(
            UserWorkflow.id == workflow_id,
            UserWorkflow.user_id == current_user.id
        ).first()
        
        if not db_workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        db.delete(db_workflow)
        db.commit()
        
        logger.info(f"Workflow deleted: {workflow_id} for user {current_user.username}")
        return {"message": "Workflow deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete workflow: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Node-Based Media Generation API",
        "version": "1.0.0",
        "status": "running",
        "openai_configured": service_manager.is_openai_configured(),
        "fal_configured": service_manager.is_fal_configured(),
        "authentication": "enabled"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "openai_configured": service_manager.is_openai_configured(),
        "fal_configured": service_manager.is_fal_configured()
    }


@app.post("/configure-api", response_model=dict)
async def configure_api(config: APIConfig):
    """Configure API keys for external services."""
    try:
        service_manager.update_keys(
            openai_api_key=config.openai_api_key,
            fal_api_key=config.fal_api_key
        )
        
        return {
            "success": True,
            "message": "API keys configured successfully",
            "openai_configured": service_manager.is_openai_configured(),
            "fal_configured": service_manager.is_fal_configured()
        }
    except Exception as e:
        logger.error(f"Failed to configure API keys: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Configuration failed: {str(e)}")


@app.post("/validate-graph", response_model=ValidationResult)
async def validate_graph(graph: GraphDefinition):
    """Validate a workflow graph structure."""
    try:
        logger.info(f"Validating graph with {len(graph.nodes)} nodes and {len(graph.edges)} edges")
        result = graph_processor.validate_graph(graph)
        return result
    except Exception as e:
        logger.error(f"Graph validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@app.post("/run-graph", response_model=ExecutionResult)
async def run_graph(graph: GraphDefinition):
    """Execute a workflow graph."""
    try:
        logger.info(f"Executing graph with {len(graph.nodes)} nodes and {len(graph.edges)} edges")
        
        # Check if required services are configured
        if not service_manager.is_openai_configured() and not service_manager.is_fal_configured():
            raise HTTPException(
                status_code=400, 
                detail="No API keys configured. Please configure OpenAI and/or fal.ai API keys first."
            )
        
        result = await graph_processor.execute_graph(graph)
        
        logger.info(f"Graph execution completed - Success: {result.success}")
        return result
        
    except Exception as e:
        logger.error(f"Graph execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")


@app.post("/run-graph-stream")
async def run_graph_stream(graph: GraphDefinition):
    """Execute a workflow graph with streaming results."""
    try:
        logger.info(f"Starting streaming execution of graph with {len(graph.nodes)} nodes and {len(graph.edges)} edges")
        
        # Check if required services are configured
        if not service_manager.is_openai_configured() and not service_manager.is_fal_configured():
            raise HTTPException(
                status_code=400, 
                detail="No API keys configured. Please configure OpenAI and/or fal.ai API keys first."
            )
        
        async def event_stream():
            """Generate Server-Sent Events for graph execution."""
            try:
                async for event in graph_processor.execute_graph_streaming(graph):
                    # Format as Server-Sent Events
                    event_data = json.dumps(event)
                    yield f"data: {event_data}\n\n"
            except Exception as e:
                logger.error(f"Streaming execution failed: {str(e)}")
                error_event = {
                    "type": "error",
                    "errors": [f"Streaming execution failed: {str(e)}"]
                }
                yield f"data: {json.dumps(error_event)}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to start streaming execution: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start streaming execution: {str(e)}")


@app.post("/upload-file", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a file (image or video) for use in workflows."""
    try:
        # Validate file type
        allowed_types = {
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/webm", "video/avi", "video/mov"
        }
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # Determine file type category
        file_type = "image" if file.content_type.startswith("image/") else "video"
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
        unique_filename = f"{file_type}_{hash(file.filename)}_{file.filename}"
        file_path = UPLOADS_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create file URL
        file_url = f"/uploads/{unique_filename}"
        
        logger.info(f"File uploaded successfully: {file_url}")
        
        return FileUploadResponse(
            file_url=file_url,
            file_type=file_type,
            filename=file.filename
        )
        
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/example-workflow")
async def get_example_workflow():
    """Get an example workflow for demonstration."""
    return {
        "nodes": [
            {
                "id": "text1",
                "type": "text",
                "data": {
                    "text": "A majestic mountain landscape at sunset"
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "image1",
                "type": "image",
                "data": {},
                "position": {"x": 400, "y": 100}
            },
            {
                "id": "text2",
                "type": "text",
                "data": {
                    "text": "What can you see in this image?"
                },
                "position": {"x": 100, "y": 300}
            },
            {
                "id": "text3",
                "type": "text",
                "data": {},
                "position": {"x": 700, "y": 200}
            }
        ],
        "edges": [
            {
                "id": "e1",
                "source": "text1",
                "target": "image1"
            },
            {
                "id": "e2",
                "source": "image1",
                "target": "text3"
            },
            {
                "id": "e3",
                "source": "text2",
                "target": "text3"
            }
        ]
    }


@app.get("/example-workflow/text-to-video")
async def get_text_to_video_example():
    """Get a text-to-video example workflow."""
    return {
        "nodes": [
            {
                "id": "text1",
                "type": "text",
                "data": {
                    "text": "A cute dog running and playing happily in a sunny garden with colorful flowers"
                },
                "position": {"x": 100, "y": 200}
            },
            {
                "id": "video1",
                "type": "video",
                "data": {},
                "position": {"x": 500, "y": 200}
            }
        ],
        "edges": [
            {
                "id": "e1",
                "source": "text1",
                "target": "video1"
            }
        ]
    }


@app.get("/example-workflow/text-image-to-video")
async def get_text_image_to_video_example():
    """Get a text+image-to-video example workflow."""
    return {
        "nodes": [
            {
                "id": "text1",
                "type": "text",
                "data": {
                    "text": "Beautiful mountain landscape at sunset"
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "image1",
                "type": "image",
                "data": {},
                "position": {"x": 400, "y": 100}
            },
            {
                "id": "text2",
                "type": "text",
                "data": {
                    "text": "The camera slowly pans across this serene landscape as gentle wind moves the grass"
                },
                "position": {"x": 100, "y": 300}
            },
            {
                "id": "video1",
                "type": "video",
                "data": {},
                "position": {"x": 700, "y": 200}
            }
        ],
        "edges": [
            {
                "id": "e1",
                "source": "text1",
                "target": "image1"
            },
            {
                "id": "e2",
                "source": "image1",
                "target": "video1"
            },
            {
                "id": "e3",
                "source": "text2",
                "target": "video1"
            }
        ]
    }


@app.get("/example-workflow/image-to-video")
async def get_image_to_video_example():
    """Get a text-to-image-to-video example workflow."""
    return {
        "nodes": [
            {
                "id": "text1",
                "type": "text",
                "data": {
                    "text": "A majestic eagle soaring over snow-capped mountains under a clear grey sky"
                },
                "position": {"x": 100, "y": 200}
            },
            {
                "id": "image1",
                "type": "image",
                "data": {},
                "position": {"x": 400, "y": 200}
            },
            {
                "id": "video1",
                "type": "video",
                "data": {},
                "position": {"x": 700, "y": 200}
            }
        ],
        "edges": [
            {
                "id": "e1",
                "source": "text1",
                "target": "image1"
            },
            {
                "id": "e2",
                "source": "image1",
                "target": "video1"
            }
        ]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)