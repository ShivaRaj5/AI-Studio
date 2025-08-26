# AI Studio

A modern React web application that simulates an AI-powered image style generation studio. Built with React, TypeScript, and TailwindCSS.

## 🎯 Features

### Core Functionality
- **Image Upload & Preview**: Support for PNG/JPG files up to 10MB with automatic client-side downscaling
- **Prompt Input**: Text-based description of desired style transformation
- **Style Selection**: Multiple style options including Editorial, Streetwear, Vintage, Minimalist, and Artistic
- **Live Preview Summary**: Real-time display of image + prompt + style combination

### AI Generation (Mock API)
- **Simulated API**: Mock endpoint that processes generation requests
- **Loading States**: Visual feedback during generation with spinner
- **Error Handling**: 20% simulated error rate with automatic retry (max 3 attempts)
- **Request Abort**: Ability to cancel in-flight generation requests
- **Exponential Backoff**: Smart retry mechanism for failed requests

### History Management
- **Local Storage**: Persistent storage of last 5 generations
- **Quick Restore**: Click any history item to restore prompt and style settings
- **Metadata Display**: Shows generation date, prompt, and style for each item

### Accessibility
- **Keyboard Navigation**: Full keyboard support with visible focus states
- **ARIA Labels**: Proper accessibility attributes for screen readers
- **Focus Management**: Clear visual indicators for interactive elements

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **State Management**: React Hooks (useState, useCallback, useEffect)
- **File Processing**: HTML5 Canvas API for image downscaling
- **Storage**: localStorage for persistence

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-studio
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## 🎨 Usage Guide

### 1. Upload an Image
- Click the upload area or drag & drop an image
- Supported formats: PNG, JPG
- Maximum size: 10MB
- Images are automatically downscaled to ≤1920px if needed

### 2. Describe Your Vision
- Enter a detailed prompt describing the desired transformation
- Be specific about style, mood, colors, or artistic direction
- Press Enter to quickly generate when ready

### 3. Choose a Style
- Select from predefined style options:
  - **Editorial**: Professional, magazine-style aesthetics
  - **Streetwear**: Urban, contemporary fashion vibes
  - **Vintage**: Retro, classic, nostalgic feel
  - **Minimalist**: Clean, simple, uncluttered design
  - **Artistic**: Creative, expressive, artistic interpretation

### 4. Generate & Wait
- Click "Generate Image" to start the process
- Watch the loading spinner and status updates
- Generation typically takes 1-2 seconds
- If errors occur, the system automatically retries

### 5. Manage Results
- Generated images appear in the history sidebar
- Click any history item to restore those settings
- History is automatically saved and persists between sessions

## 🔧 Technical Implementation

### Image Processing
- Client-side downscaling using HTML5 Canvas
- Maintains aspect ratio while limiting maximum dimension to 1920px
- Converts to JPEG format with 80% quality for optimal balance

### Mock API Simulation
- Simulates real-world API behavior with delays and errors
- 20% error rate to test error handling
- Exponential backoff retry mechanism (1s, 2s, 4s delays)
- AbortController support for request cancellation

### State Management
- React hooks for local state management
- useCallback for performance optimization
- useEffect for side effects and localStorage persistence
- Proper cleanup and error boundary handling

### Responsive Design
- Mobile-first responsive layout
- Grid-based layout that adapts to screen size
- Touch-friendly interface elements
- Optimized for both desktop and mobile use

## 🎯 Future Enhancements

- **Real API Integration**: Replace mock API with actual AI service
- **Advanced Image Processing**: More sophisticated image manipulation options
- **User Accounts**: Authentication and cloud storage
- **Social Features**: Sharing and community galleries
- **Advanced Styles**: Custom style creation and training
- **Batch Processing**: Multiple image generation
- **Export Options**: Various output formats and resolutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by AI-powered creative tools
- Designed for accessibility and user experience
- Optimized for performance and maintainability
