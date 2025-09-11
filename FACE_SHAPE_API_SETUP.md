# Face Shape Detection API Setup Guide

This guide will help you set up Face++ API for real face shape detection in your optics store application.

## Face++ API

### **Free Tier:**
- **Cost**: Completely free
- **Usage**: Limited usage with shared QPS (Queries Per Second) quotas
- **API Keys**: 1 API key allowed
- **FaceSets**: Up to 1,000 FaceSets (each can store 10,000 face tokens)

### **Paid Plans:**
- **Pay-As-You-Go**: ¥0.01 per call (≈ $0.0014 USD)
- **Subscription**: ¥150/day, ¥750/week, or ¥2,000/month for 1 QPS quota

### **Features:**
- 83-point facial landmarks for accurate analysis
- Detailed face analysis and attributes
- High accuracy face shape detection
- Real-time processing

### **Setup Steps:**
1. Go to [Face++ Developer Portal](https://www.faceplusplus.com/)
2. Create an account and verify your email
3. Create a new application
4. Get your API Key and API Secret
5. Add them to your `.env` file:
   ```
   FACEPLUSPLUS_API_KEY="your_api_key_here"
   FACEPLUSPLUS_API_SECRET="your_api_secret_here"
   ```

## How It Works

The application uses:
1. **Face++ API** (if credentials are provided)
2. **Mock Data** (fallback for testing when no API keys)

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/face-shape`
3. Upload a clear photo of your face
4. Click "تحليل شكل الوجه" (Analyze Face Shape)
5. Check the results and API source

## API Response

The API returns:
- **Face Shape**: Oval, Round, Square, Heart, Diamond, Rectangle
- **Confidence**: Percentage accuracy (70-100%)
- **Recommendations**: Personalized glasses suggestions in Arabic
- **Landmarks**: Facial measurements and points
- **Source**: Which API was used for analysis

## Troubleshooting

### No API Keys Set
- The system will use mock data for testing
- Results will be random but functional

### API Errors
- Check your API keys are correct
- Verify you haven't exceeded free tier limits
- Check the console for detailed error messages

### Low Accuracy
- Ensure the uploaded image is clear and well-lit
- Face should be looking directly at the camera
- Avoid sunglasses or hats that obscure facial features

## Production Considerations

1. **Rate Limiting**: Implement rate limiting to stay within free tiers
2. **Caching**: Cache results to reduce API calls
3. **Error Handling**: Graceful fallbacks when APIs are unavailable
4. **Privacy**: Ensure user images are handled securely
5. **Monitoring**: Track API usage and costs

## Cost Optimization

- **Face++**: Monitor usage to avoid exceeding free limits
- **Pay-As-You-Go**: Only ¥0.01 per call (very affordable)
- **Caching**: Store results to avoid duplicate API calls
- **Image Optimization**: Compress images before sending to APIs

## Security

- Never commit API keys to version control
- Use environment variables for all API credentials
- Consider implementing user consent for face analysis
- Follow GDPR/privacy regulations for face data processing
