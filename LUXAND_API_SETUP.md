# Luxand.cloud Face Detection API Setup

## Overview
Luxand.cloud is a reliable face detection API that provides facial landmark detection, age/gender analysis, and emotion detection. It offers a free tier with 500 requests per month and has working authentication.

## Features
- **Face Detection**: Detect faces in images
- **Facial Landmarks**: Detailed facial feature points for face shape analysis
- **Age & Gender Detection**: Demographic analysis
- **Emotion Analysis**: Facial expression recognition
- **Free Tier**: 500 requests/month (no credit card required)
- **Working Authentication**: Reliable signup and API key generation

## Getting Started

### 1. Sign Up for Luxand.cloud API
1. Visit [Luxand.cloud](https://luxand.cloud/)
2. Click "Sign Up" or "Get Started"
3. Create a free account (no credit card required)
4. Verify your email if required
5. Get your API key from the dashboard
6. Free tier includes 500 requests per month

### 2. Configure Environment Variables
Add your Luxand.cloud API key to your `.env` file:

```env
LUXAND_API_KEY="your_luxand_api_key_here"
```

### 3. API Usage
The API is integrated in your application at `/api/face-shape`. It will:
- Accept image URLs via POST request
- Validate the image URL
- Call Luxand.cloud API for face detection and landmarks
- Use our custom algorithm to determine face shape
- Return face shape, confidence, and recommendations

## API Response Format
```json
{
  "success": true,
  "faceShape": "Oval",
  "confidence": 85,
  "recommendations": ["...", "..."],
  "landmarks": {...},
  "attributes": {...},
  "source": "luxand",
  "debugInfo": {...}
}
```

## Pricing
- **Free Tier**: 500 requests/month (no credit card required)
- **Paid Plans**: Check [Luxand.cloud pricing](https://luxand.cloud/pricing) for current rates
- **Pay-as-you-go**: Available for additional usage

## Face Shape Detection Algorithm
Our custom algorithm uses Luxand.cloud landmarks to calculate:
- **Face Length**: Distance from nose to chin × 2.2
- **Face Width**: Maximum of jaw, cheekbone, and forehead width
- **Ratios**: Length/width, cheekbone/jaw, forehead/jaw ratios
- **Classification**: Square, Round, Oval, Heart, Diamond, Rectangle

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
- Missing landmark data

## Testing
1. Upload an image to `/face-shape`
2. Check browser console for detailed logs
3. Verify face shape detection accuracy
4. Test with different face shapes

## Advantages over Previous APIs
- **Working Authentication**: Reliable signup process
- **Good Free Tier**: 500 requests/month
- **No Credit Card**: Required for free tier
- **Reliable Service**: Stable API with good uptime
- **Good Documentation**: Clear API documentation
- **Facial Landmarks**: Detailed landmark detection

## API Endpoint
- **URL**: `https://api.luxand.cloud/photo/faces`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `token: your_api_key`
- **Body**: 
  ```json
  {
    "photo": "image_url",
    "return_landmarks": 1,
    "return_attributes": 1
  }
  ```

## Support
- Documentation: [Luxand.cloud API Docs](https://luxand.cloud/docs)
- Support: Contact Luxand.cloud support team
- Free tier: Perfect for testing and small projects
