# Rosto.io Face Detection API Setup

## Overview
Rosto.io is a face detection API that provides facial landmark detection, age/gender analysis, and emotion detection. It offers a generous free tier with 1,000 requests per month and doesn't require a credit card for signup.

## Features
- **Face Detection**: Detect faces in images
- **Facial Landmarks**: Detailed facial feature points for face shape analysis
- **Age & Gender Detection**: Demographic analysis
- **Emotion Analysis**: Facial expression recognition
- **Free Tier**: 1,000 requests/month (no credit card required)
- **Reasonable Pricing**: Affordable paid plans

## Getting Started

### 1. Sign Up for Rosto.io API
1. Visit [Rosto.io](https://www.rosto.io/)
2. Create a free account (no credit card required)
3. Get your API key from the dashboard
4. Free tier includes 1,000 requests per month

### 2. Configure Environment Variables
Add your Rosto.io API key to your `.env` file:

```env
ROSTO_API_KEY="your_rosto_api_key_here"
```

### 3. API Usage
The API is integrated in your application at `/api/face-shape`. It will:
- Accept image URLs via POST request
- Validate the image URL
- Call Rosto.io API for face detection and landmarks
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
  "source": "rosto",
  "debugInfo": {...}
}
```

## Pricing
- **Free Tier**: 1,000 requests/month (no credit card required)
- **Paid Plans**: Check [Rosto.io pricing](https://www.rosto.io/pricing) for current rates
- **Pay-as-you-go**: Available for additional usage

## Face Shape Detection Algorithm
Our custom algorithm uses Rosto.io landmarks to calculate:
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

## Advantages over Face++ API
- **Better free tier**: 1,000 vs 500 requests/month
- **No credit card required**: Unlike Face++ paid plans
- **More reliable landmarks**: Better facial feature detection
- **Reasonable pricing**: More affordable than specialized APIs
- **Good documentation**: Clear API documentation

## Support
- Documentation: [Rosto.io API Docs](https://www.rosto.io/docs)
- Support: Contact Rosto.io support team
- Free tier: Perfect for testing and small projects
