# 🔗 EquiChain - Secure & Transparent Welfare Benefits Distribution

<div align="center">

![EquiChain Logo](https://img.shields.io/badge/EquiChain-Platform-blue?style=for-the-badge&logo=blockchain)
[![Demo Video](https://img.shields.io/badge/🎥-Watch_Demo-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/1gEFAl9BvDBSo0df8nMobA0yazXbRtpCR/view?usp=drive_link)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)](https://www.python.org/)

</div>

---

<div align="center">

**🚀 Revolutionizing Government Welfare Distribution with AI & Blockchain Technology**

*Empowering transparent, secure, and efficient benefit distribution through cutting-edge technology*

</div>

---

## 📋 Table of Contents

- [🎥 Demo Video](#-demo-video)
- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [📦 Installation](#-installation)
- [🏃‍♂️ Quick Start](#️-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📞 Support](#-support)

## 🎥 Demo Video

<div align="center">

**Watch our comprehensive demo to see EquiChain in action!**

[![Demo Video Thumbnail](https://img.shields.io/badge/🎬-Watch_Full_Demo-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/1gEFAl9BvDBSo0df8nMobA0yazXbRtpCR/view?usp=drive_link)

*Experience the future of welfare distribution with AI-powered verification and blockchain transparency*

</div>

## ✨ Features

### 🔐 AI-Powered Identity Verification
- 📄 **Document Processing**: Upload Aadhaar, PAN, and Ration cards for automated verification
- 👁️ **OCR Technology**: Azure Computer Vision for accurate text extraction
- 🎭 **Face Detection**: YOLOv8-based face detection and extraction
- 🧠 **Intelligent Analysis**: Google Gemini AI for structured data extraction

### ⛓️ Blockchain Integration
- 🔒 **Immutable Records**: All verification data stored on blockchain
- 🔍 **Transparent Verification**: Public verification portal for claim authenticity
- 🛡️ **Fraud Prevention**: Tamper-proof verification system
- ⚡ **Smart Contracts**: Automated eligibility checks and benefit distribution

### 🏛️ Government Welfare Schemes
- 🏢 **Multiple Schemes**: Support for various government welfare programs
- ✅ **Eligibility Checking**: Automated eligibility verification
- 📊 **Benefit Tracking**: Real-time benefit status monitoring
- 🌐 **Public Transparency**: Anyone can verify benefit claims

### 🔒 Security & Authentication
- 🔐 **Clerk Authentication**: Secure user authentication and management
- 👥 **Role-Based Access**: Separate portals for citizens and verifiers
- 🚪 **Protected Routes**: Secure access to sensitive information
- 🔒 **Data Privacy**: Encrypted document storage and processing

## 🛠️ Technology Stack

<div align="center">

### 🎨 Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.11-06B6D4?style=for-the-badge&logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Latest-000000?style=for-the-badge)

### 🔧 Backend & AI
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-Latest-000000?style=for-the-badge&logo=flask)
![Azure](https://img.shields.io/badge/Azure_Computer_Vision-Latest-0078D4?style=for-the-badge&logo=microsoftazure)
![Google AI](https://img.shields.io/badge/Google_Gemini_AI-Latest-4285F4?style=for-the-badge&logo=google)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Latest-00FFFF?style=for-the-badge)

### ⛓️ Blockchain
![Ethereum](https://img.shields.io/badge/Ethereum-Latest-3C3C3D?style=for-the-badge&logo=ethereum)
![Web3.js](https://img.shields.io/badge/Web3.js-Latest-F16822?style=for-the-badge&logo=web3.js)
![Ethers.js](https://img.shields.io/badge/Ethers.js-6.13.5-363636?style=for-the-badge)

### 🛠️ Development Tools
![ESLint](https://img.shields.io/badge/ESLint-9.9.0-4B32C3?style=for-the-badge&logo=eslint)
![PostCSS](https://img.shields.io/badge/PostCSS-8.4.47-DD3A0A?style=for-the-badge&logo=postcss)
![Bun](https://img.shields.io/badge/Bun-Latest-000000?style=for-the-badge&logo=bun)

</div>

## 📦 Installation

### 📋 Prerequisites

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python)
![Git](https://img.shields.io/badge/Git-Latest-F05032?style=for-the-badge&logo=git)

</div>

### 🎨 Frontend Setup

```bash
# 📥 Clone the repository
git clone <repository-url>
cd EquiChain-main

# 📦 Install dependencies
npm install

# ⚙️ Set up environment variables
cp .env.example .env
# Add your Clerk publishable key to .env

# 🚀 Start development server
npm run dev
```

### 🔧 Backend Setup

```bash
# 📁 Navigate to backend directory
cd backend

# 📦 Install Python dependencies
pip install flask flask-cors azure-cognitiveservices-vision-computervision
pip install ultralytics opencv-python-headless pillow google-genai

# 🔑 Set up environment variables for Azure and Gemini APIs
export AZURE_ENDPOINT="your-azure-endpoint"
export AZURE_KEY="your-azure-key"
export GEMINI_API_KEY="your-gemini-key"

# 🚀 Start the Flask server
python src/main.py
```

### ⛓️ Blockchain Setup

```bash
# 📁 Navigate to blockchain-logger directory
cd blockchain-logger

# 📦 Install dependencies
npm install

# ⚙️ Configure Web3 provider
# Update web3-utils.js with your Ethereum network configuration

# 🚀 Start blockchain logger
node server.js
```

## 🏃‍♂️ Quick Start

<div align="center">

### 🚀 Get Started in 5 Simple Steps

</div>

1. **🔐 Register/Login**: Create an account or sign in using Clerk authentication
2. **📄 Upload Documents**: Upload your Aadhaar, PAN, or Ration card documents
3. **🤖 AI Verification**: The system automatically processes and verifies your documents
4. **✅ Check Eligibility**: View your eligibility for various welfare schemes
5. **🔍 Public Verification**: Anyone can verify the authenticity of benefit claims

## 📁 Project Structure

```
🔗 EquiChain-main/
├── 📁 src/                    # Frontend source code
│   ├── 🧩 components/         # React components
│   ├── 📄 pages/             # Page components
│   ├── 🔄 context/           # React context providers
│   ├── 🪝 hooks/             # Custom React hooks
│   ├── 📚 lib/               # Utility libraries
│   ├── 📊 data/              # Static data and schemes
│   └── 🤖 main.py            # AI/ML processing server
├── 🔧 backend/               # Backend services
│   ├── 🖥️ server.js          # Express server
│   └── ⛓️ web3-utils.js      # Blockchain utilities
├── 📝 blockchain-logger/     # Blockchain logging service
├── 📤 uploads/               # Document upload directory
├── 👤 faces/                 # Extracted face images
└── 🌐 public/                # Static assets
```

## 🔧 Configuration

### 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# 🔐 Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# 👁️ Azure Computer Vision
AZURE_ENDPOINT=your_azure_endpoint
AZURE_KEY=your_azure_key

# 🧠 Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# ⛓️ Blockchain Configuration
ETHEREUM_NETWORK=your_ethereum_network
CONTRACT_ADDRESS=your_smart_contract_address
```

## 🚀 Deployment

### 🌐 Frontend Deployment

```bash
# 🏗️ Build for production
npm run build

# 🚀 Deploy to your preferred hosting service
# (Vercel, Netlify, AWS, etc.)
```

### 🔧 Backend Deployment

```bash
# 🚀 Deploy Flask app to your preferred hosting service
# (Heroku, AWS, Google Cloud, etc.)
```

## 🤝 Contributing

<div align="center">

**We welcome contributions from the community! 🎉**

</div>

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

### 📋 Contribution Guidelines

- 🎯 Follow the existing code style
- 📝 Add tests for new features
- 📚 Update documentation as needed
- 🐛 Report bugs using the issue tracker


- **👁️ Azure Computer Vision** for OCR capabilities
- **🧠 Google Gemini AI** for intelligent data processing
- **🎭 YOLOv8** for face detection
- **🔐 Clerk** for authentication services
- **⛓️ Ethers.js** for blockchain integration
- **🎨 shadcn/ui** for beautiful UI components
- **⚡ Vite** for lightning-fast development

## 📞 Support

<div align="center">

**Need help? We're here to assist you! 🤝**

</div>

### 📧 Get Support

- 🐛 **Bug Reports**: Create an issue in the GitHub repository
- 💡 **Feature Requests**: Submit your ideas through GitHub issues
- 📚 **Documentation**: Check our comprehensive guides
- 🎥 **Tutorials**: Watch the demo video for usage examples

### 🔗 Useful Links

- 📖 [Documentation](https://github.com/your-repo/docs)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)
- 📧 [Contact Team](mailto:support@equichain.com)

---

<div align="center">

**🔗 EquiChain** - Revolutionizing welfare distribution with AI and blockchain technology.

*Built with ❤️ for a more transparent and efficient future*

[![GitHub Stars](https://img.shields.io/github/stars/your-repo/equichain?style=social)](https://github.com/your-repo/equichain)
[![GitHub Forks](https://img.shields.io/github/forks/your-repo/equichain?style=social)](https://github.com/your-repo/equichain)
[![GitHub Issues](https://img.shields.io/github/issues/your-repo/equichain)](https://github.com/your-repo/equichain/issues)

</div>
