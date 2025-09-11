# Betaface API Setup

## Overview
Betaface is a reliable face detection API that provides comprehensive facial analysis including 123 facial landmarks, age/gender detection, and emotion analysis. It offers a free tier and has working authentication.

## Features
- **Face Detection**: Detect faces in images
- **123 Facial Landmarks**: Detailed facial feature points for accurate face shape analysis
- **Age & Gender Detection**: Demographic analysis
- **Emotion Analysis**: Facial expression recognition
- **Free Tier**: Available for testing and development
- **Working Authentication**: Reliable signup and API key generation

## Getting Started

### 1. Sign Up for Betaface API
1. Visit [Betaface API](https://www.betafaceapi.com/wpa/)
2. Click "Sign Up" or "Get Started"
3. Create a free account (no credit card required)
4. Verify your email if required
5. Get your API key and secret from the dashboard
6. Free tier is available for testing

### 2. Configure Environment Variables
Add your Betaface API credentials to your `.env` file:

```env
BETAFACE_API_KEY="your_betaface_api_key_here"
BETAFACE_API_SECRET="your_betaface_api_secret_here"
```

### 3. API Usage
The API is integrated in your application at `/api/face-shape`. It will:
- Accept image URLs via POST request
- Validate the image URL
- Call Betaface API for face detection and landmarks
- Convert Betaface landmarks to our standard format
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
  "source": "betaface",
  "debugInfo": {...}
}
```

## Pricing
- **Free Tier**: Available for testing and development
- **Paid Plans**: Check [Betaface pricing](https://www.betafaceapi.com/pricing) for current rates
- **Pay-as-you-go**: Available for additional usage

## Face Shape Detection Algorithm
Our custom algorithm uses Betaface landmarks to calculate:
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
- **123 Landmarks**: More detailed facial feature detection
- **No Credit Card**: Required for free tier
- **Reliable Service**: Stable API with good uptime
- **Good Documentation**: Clear API documentation
- **Comprehensive Analysis**: Age, gender, emotion detection

## API Endpoint
- **URL**: `https://www.betafaceapi.com/api/v2/media`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
- **Body**: 
  ```json
  {
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "image_url": "image_url",
    "detection_flags": "basicpoints,propoints,classifiers,content",
    "original_filename": "face_image.jpg"
  }
  ```

## Landmark Conversion
Betaface uses a different landmark structure than our algorithm expects. The API includes a conversion function that maps Betaface landmarks to our standard format:
- `contour_chin` → `contour_chin`
- `contour_left1` → `contour_left1`
- `contour_right1` → `contour_right1`
- `contour_left6` → `contour_left6`
- `contour_right6` → `contour_right6`
- `contour_left9` → `contour_left9`
- `contour_right9` → `contour_right9`
- `left_eye_center` → `left_eye_center`
- `right_eye_center` → `right_eye_center`
- `nose_tip` → `nose_tip`

## Support
- Documentation: [Betaface API Docs](https://www.betafaceapi.com/docs)
- Support: Contact Betaface support team
- Free tier: Perfect for testing and small projects
