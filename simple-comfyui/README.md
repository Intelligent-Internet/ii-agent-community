# 🎬 Media Workflow Generator

A simplified node-based media generation web application inspired by ComfyUI that allows users to visually connect nodes to create custom AI-powered workflows for text, image, and video processing.

## ✨ Features

- **Visual Node Editor**: Drag-and-drop interface for building workflows
- **Multiple Node Types**: Text, Image, and Video nodes with various capabilities
- **AI-Powered Processing**: Integration with OpenAI and Fal.ai for content generation
- **Flexible Connections**: Support for complex workflow patterns
- **Real-time Preview**: See your workflow results as you build
- **Modern Tech Stack**: Built with React, Vite, Python, and Bun

## 🏗️ Architecture

The application consists of:
- **Frontend**: React + Vite application with node-based UI
- **Backend**: Python FastAPI server handling AI integrations
- **AI Services**: OpenAI for text processing, Fal.ai for image/video generation

## 📋 Node Types & Connections

### Node Types
- **Text Node**: Contains a text input box for prompts and descriptions
- **Image Node**: Accepts uploaded images or displays AI-generated images
- **Video Node**: Accepts uploaded videos or displays AI-generated videos

### Supported Connections
The system executes workflows from left to right and supports these connection patterns:

| Input → Output | Description |
|----------------|-------------|
| Text(s) → Text | Combine multiple text nodes into summarization or ideation output |
| Text → Image | Generate an image from a text prompt |
| Text → Video | Generate a video from a text prompt |
| Text + Image → Image | Apply text-based edits to an image (e.g., "Change the background to nightlife") |
| Text + Image → Video | Generate video from a text prompt using input image as starting frame |
| Image → Video | Generate a video from an image as the starting frame |
| Text + Image → Text | Ask questions about images or extract information using prompts |
| Image → Text | Automatically describe or caption images |

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Bun** (latest version)
- **Python** (3.8 or higher)
- **API Keys**:
  - OpenAI API key
  - Fal.ai API key

### 1. Clone the Repository

```bash
git clone https://github.com/Intelligent-Internet/ii-agent-community
cd ii-agent-community/simple-comfyui
```

### 2. Environment Setup

#### Frontend Configuration

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8080
```

#### Backend Configuration

You have two options for configuring the backend:

**Option A: Environment File (Recommended)**

Create a `.env` file in the `backend/` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
FAL_API_KEY=your_fal_ai_api_key_here
```

**Option B: UI Configuration**

Alternatively, you can configure API keys directly through the application's Configuration Page in the web interface after starting the application.

### 3. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m src.main
```

The backend server will start on `http://localhost:8080`

### 4. Frontend Setup

Open a new terminal:

```bash
cd frontend
bun install
bun run dev
```

The frontend application will start on `http://localhost:5173`
