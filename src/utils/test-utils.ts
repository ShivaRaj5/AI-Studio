// Test utilities for AI Studio application

export const createMockFile = (name: string, _size: number, type: string): File => {
  const blob = new Blob(['mock content'], { type })
  return new File([blob], name, { type })
}

export const createMockImageFile = (name: string, size: number): File => {
  return createMockFile(name, size, 'image/jpeg')
}

export const mockGenerationData = {
  id: 'test_gen_123',
  imageUrl: 'https://picsum.photos/512/512?random=123',
  prompt: 'Test prompt for demonstration',
  style: 'editorial',
  createdAt: new Date().toISOString()
}

export const simulateApiDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const simulateApiError = (): Promise<never> => {
  return Promise.reject(new Error('Model overloaded'))
}

export const generateMockImageUrl = (seed: number): string => {
  return `https://picsum.photos/512/512?random=${seed}`
} 