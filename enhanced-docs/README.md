# Enhanced Google Docs Clone

<img width="1370" alt="Screenshot 2025-07-08 at 22 00 23" src="https://github.com/user-attachments/assets/cdc40123-e3f7-4942-a9a8-ba7cae2b2665" />
<img width="1339" alt="Screenshot 2025-07-08 at 22 01 01" src="https://github.com/user-attachments/assets/edd52781-dd16-475e-8d6f-5315ce0089be" />
<img width="1382" alt="Screenshot 2025-07-08 at 22 00 39" src="https://github.com/user-attachments/assets/461a0dd1-01d2-4c4d-b2ef-4432a253a3d9" />


A collaborative document editor with AI-powered features built with Next.js, Socket.io, and OpenAI GPT-4o. Create, edit, and enhance your documents with the power of artificial intelligence and real-time collaboration.

![Enhanced Docs](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-green?style=for-the-badge&logo=socket.io)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-orange?style=for-the-badge&logo=openai)

## ✨ Features

### 📝 Core Document Features
- **Rich Text Editor**: Full formatting toolbar with bold, italic, underline, alignment, and more
- **Document Management**: Create, edit, save, and organize documents
- **Auto-save**: Real-time document saving with status indicators
- **Professional UI**: Modern, clean design inspired by Google Docs

### 👥 Real-time Collaboration
- **Multi-user Editing**: Multiple users can edit the same document simultaneously
- **Live User Count**: See how many users are currently viewing/editing
- **User Presence**: Visual indicators showing active users with unique colors
- **Share Functionality**: Easy document sharing with shareable links
- **Real-time Sync**: Changes appear instantly across all connected clients

### 🤖 AI-Powered Features
- **Text Enhancement**: Highlight any text to see AI enhancement options
- **AI Text Generation**: Press `Ctrl+M` to generate new content with AI
- **Smart Suggestions**: Pre-built prompts for common writing tasks
- **Context-aware**: AI understands document context for better suggestions
- **GPT-4o Integration**: Powered by OpenAI's latest and most capable model

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Efficient workflow with keyboard shortcuts
- **Smooth Animations**: Professional transitions and micro-interactions
- **Accessibility**: Built with accessibility best practices

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **bun** package manager
- **OpenAI API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd enhanced-docs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables) section)

4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

### Required Variables

```env
# OpenAI API Configuration (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional Variables

```env
# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Development Settings
NODE_ENV=development
```

### Getting Your OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the generated key and add it to your `.env.local` file

**Important**: Keep your API key secure and never commit it to version control.

### Environment Variable Details

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key for AI features | ✅ Yes | - |
| `NEXTAUTH_URL` | Base URL for authentication | ❌ No | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | ❌ No | Auto-generated |
| `NODE_ENV` | Environment mode | ❌ No | `development` |

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Database (if using Prisma)
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
```

## 🏗️ Project Structure

```
enhanced-docs/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── ai/         # AI-related endpoints
│   │   │   └── documents/  # Document CRUD operations
│   │   ├── document/       # Document editor pages
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── ...            # Feature-specific components
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility functions
│   ├── services/          # Business logic
│   └── utils/             # Helper functions
├── pages/
│   └── api/
│       └── socket.ts      # Socket.io server
├── public/                # Static assets
├── .env.local            # Environment variables (create this)
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## 🔌 API Endpoints

### Document Management
- `GET /api/documents` - Get all documents
- `GET /api/documents/[id]` - Get specific document
- `PUT /api/documents/[id]` - Update document
- `POST /api/documents` - Create new document

### AI Features
- `POST /api/ai/enhance` - Enhance selected text
- `POST /api/ai/generate` - Generate new content

### Real-time Communication
- `WebSocket /api/socket` - Socket.io connection for real-time features

## 🎯 Usage Guide

### Creating Documents
1. Click **"New Document"** on the homepage
2. Start typing in the editor
3. Use the formatting toolbar for rich text editing
4. Documents auto-save as you type

### Real-time Collaboration
1. Share the document URL with collaborators
2. Multiple users can edit simultaneously
3. See live user count and presence indicators
4. Changes sync in real-time across all clients

### AI Features

#### Text Enhancement
1. Select any text in the document
2. A toolbar will appear near your cursor
3. Choose enhancement options (improve, expand, etc.)
4. AI will enhance the selected text

#### AI Text Generation
1. Press `Ctrl+M` anywhere in the document
2. Enter a prompt describing what you want to write
3. Optionally provide additional context
4. Click **"Generate Text"** or use quick suggestions
5. Generated content will be inserted at cursor position

### Keyboard Shortcuts
- `Ctrl+M` - Open AI text generation modal
- `Ctrl+B` - Bold text
- `Ctrl+I` - Italic text
- `Ctrl+U` - Underline text
- `Ctrl+S` - Save document (auto-save is enabled)

## 🚀 Deployment

### Development Deployment
```bash
npm run build
npm start
```

### Production Deployment

#### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "enhanced-docs" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Environment Variables for Production
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
NEXTAUTH_URL=https://yourdomain.com
```

### Platform-Specific Deployment

#### Vercel (Note: WebSocket limitations)
⚠️ **Important**: Vercel doesn't support WebSocket connections. Real-time collaboration features won't work on Vercel. Consider using Railway, Render, or DigitalOcean instead.

#### Railway
1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

#### Render
1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

## 🛠️ Development

### Setting up Development Environment

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd enhanced-docs
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

### Code Style and Linting
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

### Testing
```bash
# Run tests (if configured)
npm test

# Run tests in watch mode
npm run test:watch
```

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

### Next.js
Next.js configuration is in `next.config.js`. Key settings:
- TypeScript support
- Tailwind CSS integration
- API routes configuration

### Socket.io
Real-time features are powered by Socket.io. The server is configured in `pages/api/socket.ts`.

## 🐛 Troubleshooting

### Common Issues

#### "OpenAI API key not found"
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Restart the development server after adding environment variables

#### "Socket connection failed"
- Check if port 3000 is available
- Ensure no firewall is blocking the connection
- Verify Socket.io server is running

#### "Build fails"
- Clear Next.js cache: `rm -rf .next`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`

#### Real-time features not working
- Verify Socket.io connection in browser dev tools
- Check server logs for Socket.io errors
- Ensure multiple users are using different browser sessions/incognito windows

### Performance Issues
- Check browser console for errors
- Monitor network tab for failed requests
- Verify OpenAI API rate limits

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add JSDoc comments for functions
- Test real-time features with multiple browser sessions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Socket.io](https://socket.io/) - Real-time communication
- [OpenAI](https://openai.com/) - AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn/ui](https://ui.shadcn.com/) - UI components

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing issues in the repository
3. Create a new issue with detailed information
4. Include error messages, browser console logs, and steps to reproduce

---

**Happy writing with AI! 🚀✨**
