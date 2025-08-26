import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'

interface Generation {
  id: string
  imageUrl: string
  prompt: string
  style: string
  createdAt: string
}

interface MockApiResponse {
  id: string
  imageUrl: string
  prompt: string
  style: string
  createdAt: string
}

interface MockApiError {
  message: string
}

const STYLE_OPTIONS = [
  { value: 'editorial', label: 'Editorial' },
  { value: 'streetwear', label: 'Streetwear' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'artistic', label: 'Artistic' }
]

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0].value)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load generations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('aiStudioGenerations')
    if (saved) {
      try {
        setGenerations(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved generations:', e)
      }
    }
  }, [])

  // Save generations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aiStudioGenerations', JSON.stringify(generations))
  }, [generations])

  const downscaleImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        const maxSize = 1920
        let { width, height } = img
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      setError('Please select a valid PNG or JPG image')
      return
    }

    // Check file size (10MB = 10 * 1024 * 1024 bytes)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setSelectedFile(file)
    setIsProcessingFile(true)

    try {
      const downscaledUrl = await downscaleImage(file)
      setPreviewUrl(downscaledUrl)
    } catch {
      setError('Failed to process image')
    } finally {
      setIsProcessingFile(false)
    }
  }, [downscaleImage])

  const createMockGeneratedImage = useCallback(async (imageDataUrl: string, style: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Set canvas size
        canvas.width = 512
        canvas.height = 512
        
        // Draw the original image, maintaining aspect ratio
        const scale = Math.min(512 / img.width, 512 / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const x = (512 - scaledWidth) / 2
        const y = (512 - scaledHeight) / 2
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
        
        // Apply style-specific effects
        if (style === 'vintage') {
          // Add vintage sepia effect
          ctx.fillStyle = 'rgba(112, 66, 20, 0.3)'
          ctx.fillRect(0, 0, 512, 512)
        } else if (style === 'artistic') {
          // Add artistic contrast
          ctx.filter = 'contrast(1.2) saturate(1.3)'
        } else if (style === 'minimalist') {
          // Add minimalist desaturation
          ctx.filter = 'grayscale(0.7) brightness(1.1)'
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      
      img.src = imageDataUrl
    })
  }, [])

  const mockApiCall = useCallback(async (
    imageDataUrl: string, 
    prompt: string, 
    style: string,
    signal: AbortSignal
  ): Promise<MockApiResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    
    // Check if request was aborted
    if (signal.aborted) {
      throw new Error('Request aborted')
    }

    // Simulate 20% error rate
    if (Math.random() < 0.2) {
      const error: MockApiError = { message: 'Model overloaded' }
      throw error
    }

    // Create a mock generated image by applying a simple filter to the original
    const mockGeneratedImageUrl = await createMockGeneratedImage(imageDataUrl, style)

    // Generate mock response
    const mockResponse: MockApiResponse = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl: mockGeneratedImageUrl,
      prompt,
      style,
      createdAt: new Date().toISOString()
    }

    return mockResponse
  }, [])

  const generateImage = useCallback(async () => {
    if (!selectedFile || !prompt.trim()) {
      setError('Please select an image and enter a prompt')
      return
    }

    setIsGenerating(true)
    setError(null)
    setRetryCount(0)

    const attemptGeneration = async (attempt: number = 1): Promise<void> => {
      try {
        abortControllerRef.current = new AbortController()
        
        const response = await mockApiCall(
          previewUrl,
          prompt.trim(),
          selectedStyle,
          abortControllerRef.current.signal
        )

        const newGeneration: Generation = {
          id: response.id,
          imageUrl: response.imageUrl,
          prompt: response.prompt,
          style: response.style,
          createdAt: response.createdAt
        }

        setGenerations(prev => [newGeneration, ...prev.slice(0, 4)])
        setIsGenerating(false)
        abortControllerRef.current = null

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (errorMessage === 'Request aborted') {
          setIsGenerating(false)
          return
        }

        if (attempt < 3 && errorMessage === 'Model overloaded') {
          setRetryCount(attempt)
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return attemptGeneration(attempt + 1)
        }

        setError(`Generation failed: ${errorMessage}`)
        setIsGenerating(false)
      }
    }

    attemptGeneration()
  }, [selectedFile, prompt, selectedStyle, previewUrl, mockApiCall])

  const abortGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
    }
  }, [])

  const restoreFromHistory = useCallback((generation: Generation) => {
    setPrompt(generation.prompt)
    setSelectedStyle(generation.style)
    // Note: We can't restore the original image, but we can show the generated result
    setPreviewUrl(generation.imageUrl)
  }, [])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isGenerating) {
      generateImage()
    }
  }, [generateImage, isGenerating])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Studio</h1>
          <p className="text-gray-600">Transform your images with AI-powered style generation</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" role="main">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6" aria-label="Main content area">
            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Upload & Preview</h2>
              
              {!previewUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    aria-describedby="file-upload-help"
                    disabled={isProcessingFile}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer block ${isProcessingFile ? 'opacity-50' : ''}`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !isProcessingFile && fileInputRef.current?.click()}
                  >
                    {isProcessingFile ? (
                      <div className="text-gray-400 mb-2">
                        <svg className="animate-spin mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      {isProcessingFile ? 'Processing image...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={clearFile}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    File: {selectedFile?.name} ({formatFileSize(selectedFile?.size || 0)})
                  </p>
                </div>
              )}
            </div>

            {/* Prompt & Style Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Prompt & Style</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your vision
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the style, mood, or transformation you want..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    aria-describedby="prompt-help"
                  />
                  <p id="prompt-help" className="text-xs text-gray-500 mt-1">
                    Press Enter to generate (when ready)
                  </p>
                </div>

                <div>
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    id="style"
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {STYLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Summary */}
              {previewUrl && prompt && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preview Summary</h3>
                  <div className="flex items-start space-x-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">{prompt}</p>
                      <p className="text-xs text-gray-600 capitalize">{selectedStyle} style</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <button
                onClick={isGenerating ? abortGeneration : generateImage}
                disabled={!selectedFile || !prompt.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isGenerating
                    ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>
                      {retryCount > 0 ? `Retrying (${retryCount}/3)...` : 'Generating...'}
                    </span>
                  </div>
                ) : (
                  'Generate Image'
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1" aria-label="Generation history">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>
              
              {generations.length === 0 ? (
                <p className="text-gray-500 text-sm">No generations yet. Create your first one!</p>
              ) : (
                <div className="space-y-3">
                  {generations.map((generation) => (
                    <button
                      key={generation.id}
                      onClick={() => restoreFromHistory(generation)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      <div className="relative w-full h-24 mb-2 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={generation.imageUrl}
                          alt="Generated image"
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            setLoadedImages(prev => new Set(prev).add(generation.id))
                          }}
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const placeholder = document.createElement('div')
                              placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs'
                              placeholder.textContent = 'Image Preview'
                              parent.appendChild(placeholder)
                            }
                            // Mark as loaded even if it's an error
                            setLoadedImages(prev => new Set(prev).add(generation.id))
                          }}
                        />
                        {/* Loading indicator - hidden when image is loaded */}
                        {!loadedImages.has(generation.id) && (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 font-medium line-clamp-2 mb-1">
                        {generation.prompt}
                      </p>
                      <p className="text-xs text-gray-600 capitalize mb-1">
                        {generation.style} style
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(generation.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
