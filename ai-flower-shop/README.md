# 🌸 AI Flower Shop

<img width="1360" alt="Screenshot 2025-07-08 at 21 58 38" src="https://github.com/user-attachments/assets/6d1173c7-b70b-44d0-9785-8eb6ef75347d" />

<img width="1255" alt="Screenshot 2025-07-08 at 21 59 02" src="https://github.com/user-attachments/assets/33a3cb59-b06b-4b18-9573-129377b188d7" />


An intelligent e-commerce platform that combines AI-powered product recommendations with a seamless shopping experience. Customers can chat with an AI assistant to discover the perfect flowers for any occasion.

## ✨ Features

- **🤖 AI Assistant**: Intelligent chat interface for product discovery and recommendations
- **🔍 Vector Search**: Semantic product search using OpenAI embeddings
- **🛒 E-commerce**: Complete shopping cart and checkout functionality
- **💳 Stripe Integration**: Secure payment processing
- **📱 Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui
- **💾 Database**: PostgreSQL with Prisma ORM

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- OpenAI API key
- Stripe account (for payments)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-flower-shop
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Database URL (PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# NextAuth (optional)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# App Configuration
NODE_ENV=development
```

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with sample products
curl -X POST http://localhost:3000/api/seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Detailed Setup Instructions

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

#### Stripe Keys
1. Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in to your account
3. In test mode, go to Developers > API keys
4. Copy both the Publishable key and Secret key
5. Add them to your `.env.local` file

### Database Configuration

#### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create a database
createdb ai_flower_shop

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/ai_flower_shop"
```

#### Option 2: Cloud Database (Recommended)
Use services like:
- [Neon](https://neon.tech/) (Free tier available)
- [Supabase](https://supabase.com/) (Free tier available)
- [Railway](https://railway.app/) (Free tier available)

### Project Structure

```
ai-flower-shop/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   │   ├── chat/       # AI chat endpoints
│   │   │   ├── products/   # Product management
│   │   │   ├── cart/       # Shopping cart
│   │   │   └── checkout/   # Payment processing
│   │   ├── chat/           # AI assistant page
│   │   ├── cart/           # Shopping cart page
│   │   └── page.tsx        # Main shop page
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utility functions
│   │   ├── vector-db.ts   # Vector database implementation
│   │   ├── db.ts          # Database connection
│   │   └── sample-data.ts # Sample product data
│   └── generated/         # Prisma generated files
├── prisma/
│   └── schema.prisma      # Database schema
├── .env.local            # Environment variables
└── README.md
```

## 🤖 AI Assistant Usage

### Chat Interface
- **Dedicated Page**: Visit `/chat` for the full AI assistant experience
- **Natural Language**: Ask questions like "I need flowers for a wedding"
- **Product Recommendations**: AI suggests relevant products with pricing
- **Add to Cart**: AI can add recommended items directly to your cart

### Example Queries
```
"I want red roses for a romantic dinner"
"Show me flowers for a birthday party"
"What flowers are good for sympathy?"
"Add sunflowers to my cart"
```

## 🛠 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npx prisma studio          # Open database browser
npx prisma db push         # Push schema changes
npx prisma generate        # Generate Prisma client

# Seed database
curl -X POST http://localhost:3000/api/seed
```

### Adding New Products

1. **Via Database**: Add products directly to the database
2. **Via API**: Use the `/api/products` endpoint
3. **Via Seeding**: Update `src/lib/sample-data.ts` and re-seed

The vector database will automatically index new products for AI search.

## 🔍 Vector Database

The AI assistant uses a vector database for semantic product search:

- **Technology**: OpenAI text-embedding-3-small model
- **Storage**: In-memory with auto-initialization from database
- **Search**: Cosine similarity for finding relevant products
- **Auto-sync**: Automatically loads products when vector store is empty

## 💳 Payment Processing

Stripe integration includes:

- **Test Mode**: Safe testing with test cards
- **Webhooks**: Automatic order confirmation
- **Security**: PCI-compliant payment processing
- **Tax Calculation**: 8% sales tax included

### Test Cards
```
# Successful payment
4242 4242 4242 4242

# Declined payment
4000 0000 0000 0002
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: For static deployment
- **Railway**: Full-stack deployment
- **Heroku**: Traditional hosting

## 🐛 Troubleshooting

### Common Issues

#### Vector Database Empty
```bash
# Re-seed the database
curl -X POST http://localhost:3000/api/seed
```

#### Prisma Client Issues
```bash
# Regenerate Prisma client
npx prisma generate
```

#### Environment Variables
- Ensure all required variables are set in `.env.local`
- Restart the development server after changes

#### Database Connection
- Verify DATABASE_URL format
- Check database server is running
- Ensure database exists

## 📝 API Documentation

### Chat API
```
POST /api/chat
{
  "message": "I want red roses",
  "history": []
}
```

### Products API
```
GET /api/products        # Get all products
POST /api/products       # Create product
PUT /api/products/:id    # Update product
DELETE /api/products/:id # Delete product
```

### Cart API
```
GET /api/cart           # Get cart contents
POST /api/cart/add      # Add item to cart
DELETE /api/cart/:id    # Remove item from cart
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub

---

Built with ❤️ using Next.js, OpenAI, and Stripe
