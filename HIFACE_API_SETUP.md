# Hiface Face Shape Detection API Setup

## Overview
Hiface is a specialized API for face shape detection that provides accurate facial analysis including face shape classification, landmarks, and attributes. It's designed specifically for beauty, fashion, and wellness applications.

## Features
- **Face Shape Detection**: Oval, Round, Square, Heart, Diamond, Rectangular
- **Facial Landmarks**: Detailed facial feature points
- **Attributes**: Age, gender, emotion analysis
- **Privacy-Focused**: No image storage, GDPR compliant
- **Easy Integration**: RESTful API with JSON responses

## Getting Started

### 1. Sign Up for Hiface API
1. Visit [Hiface.app](https://hiface.app/face-shape-detection-api/)
2. Create an account
3. Get your API key from the dashboard

### 2. Configure Environment Variables
Add your Hiface API key to your `.env` file:

```env
HIFACE_API_KEY="your_hiface_api_key_here"
```

### 3. API Usage
The API is already integrated in your application at `/api/face-shape`. It will:
- Accept image URLs via POST request
- Validate the image URL
- Call Hiface API for face shape detection
- Return face shape, confidence, and recommendations

## API Response Format
```json
{
  "success": true,
  "faceShape": "Oval",
  "confidence": 92,
  "recommendations": ["...", "..."],
  "landmarks": {...},
  "attributes": {...},
  "source": "hiface",
  "debugInfo": {...}
}
```

## Pricing
- Check [Hiface pricing page](https://hiface.app/pricing) for current rates
- Typically offers free tier for testing
- Pay-as-you-go pricing for production use

## Supported Face Shapes
- **Oval**: Balanced proportions, wider at cheekbones
- **Round**: Similar width and length, soft curves
- **Square**: Strong jawline, similar width and length
- **Heart**: Wide forehead, narrow jaw, pointed chin
- **Diamond**: Wide cheekbones, narrow forehead and jaw
- **Rectangular**: Longer face, similar width throughout

## Error Handling
The API includes comprehensive error handling for:
- Invalid image URLs
- No faces detected
- API rate limits
- Network errors
- Invalid API keys

## Testing
1. Upload an image to `/face-shape`
2. Check browser console for detailed logs
3. Verify face shape detection accuracy
4. Test with different face shapes

## Support
- Documentation: [Hiface API Docs](https://hiface.app/docs)
- Support: Contact Hiface support team
- GitHub: Check for any open-source alternatives if needed
