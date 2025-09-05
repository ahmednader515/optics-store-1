"use client"

import React from 'react'

type VirtualTryOnFullscreenProps = {
  overlayImageUrl?: string
}

type Point = { x: number; y: number }

export default function VirtualTryOnFullscreen({ overlayImageUrl }: VirtualTryOnFullscreenProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const overlayRef = React.useRef<HTMLDivElement | null>(null)

  const [isStarting, setIsStarting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isFrontCamera, setIsFrontCamera] = React.useState(true)
  const [autoFollow, setAutoFollow] = React.useState<boolean>(false)
  const autoFollowRef = React.useRef<boolean>(false)
  const detectorRef = React.useRef<any>(null)
  const landmarkerRef = React.useRef<any>(null)
  const rafRef = React.useRef<number | null>(null)
  const [videoElement, setVideoElement] = React.useState<HTMLVideoElement | null>(null)

  // Callback ref for video element
  const videoCallbackRef = React.useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      videoRef.current = node
      setVideoElement(node)
      console.log('Video element callback ref set:', node)
    }
  }, [])

  // Show overlay only when a face is detected
  const [isFaceDetected, setIsFaceDetected] = React.useState<boolean>(false)
  const faceDetectedRef = React.useRef<boolean>(false)

  // Displayed overlay state (smoothed each frame)
  const displayedPosRef = React.useRef<Point>({ x: 120, y: 120 })
  const displayedScaleRef = React.useRef<number>(1.1)
  const displayedRotRef = React.useRef<number>(0)
  const lastFrameTimeRef = React.useRef<number>(0)

  // Overlay transform state
  const [position, setPosition] = React.useState<Point>({ x: 120, y: 120 })
  const [scale] = React.useState(1.1)
  const [rotation] = React.useState(0)

  // Smoothing refs for auto-follow
  const smoothPosRef = React.useRef<Point>({ x: 120, y: 120 })
  const smoothScaleRef = React.useRef<number>(1.1)
  const smoothRotRef = React.useRef<number>(0)
  const smoothWidthRef = React.useRef<number>(352)

  // Heuristics for overlay fitting
  const overlayAspectApprox = 0.38 // approximate height/width of the glasses overlay
  const baseWidthMultiplier = 2.35 // base overlay width relative to eye distance
  const [sizeScale, setSizeScale] = React.useState(1.0) // user-adjustable scale factor
  const verticalOffsetRatio = 0.15 // fraction of width to raise from mid-eye level

  const isDraggingRef = React.useRef(false)
  const dragStartRef = React.useRef<Point | null>(null)
  const startPosRef = React.useRef<Point>({ x: 0, y: 0 })

  // Responsive: use a taller preview on small screens
  const [isSmallScreen, setIsSmallScreen] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mql = window.matchMedia('(max-width: 640px)')
    const update = () => setIsSmallScreen(mql.matches)
    update()
    mql.addEventListener?.('change', update)
    return () => mql.removeEventListener?.('change', update)
  }, [])

  // Performance optimization: reduce detection frequency on mobile
  const detectionIntervalRef = React.useRef<number>(0)
  const lastDetectionTimeRef = React.useRef<number>(0)

  // keep refs in sync to avoid stale closure in RAF loop
  const sizeScaleRef = React.useRef<number>(1.0)
  React.useEffect(() => {
    autoFollowRef.current = autoFollow
    sizeScaleRef.current = sizeScale
  }, [autoFollow, sizeScale])

  React.useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle video element when it becomes available
  React.useEffect(() => {
    if (videoElement && streamRef.current && !videoElement.srcObject) {
      console.log('Video element available, setting up with existing stream')
      setupVideoElement(videoElement, streamRef.current)
    }
  }, [videoElement])


  async function startCamera() {
    setError(null)
    setIsStarting(true)
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: isFrontCamera ? 'user' : 'environment',
        width: { ideal: isSmallScreen ? 640 : 1280 },
        height: { ideal: isSmallScreen ? 480 : 720 },
      },
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Camera stream acquired:', stream)
      console.log('Video tracks:', stream.getVideoTracks())
      streamRef.current = stream
      
      // If video element is already available, set it up immediately
      if (videoElement) {
        console.log('Video element already available, setting up')
        setupVideoElement(videoElement, stream)
      } else {
        console.log('Video element not yet available, will be set up when ready')
      }
      
      await initTrackers()
    } catch (err) {
      console.error('Camera error:', err)
      setError('لا يمكن الوصول إلى الكاميرا. تأكد من السماح بالوصول إلى الكاميرا.')
      setIsStarting(false)
      return
    }
    setIsStarting(false)
  }

  const setupVideoElement = (video: HTMLVideoElement, stream: MediaStream) => {
    console.log('Setting up video element with stream')
    video.srcObject = stream
    
    // Wait for video to be ready
    video.onloadedmetadata = () => {
      console.log('Video metadata loaded, attempting to play')
      video.play()
        .then(() => console.log('Video playing successfully'))
        .catch(err => console.error('Video play failed:', err))
    }
    
    video.oncanplay = () => {
      console.log('Video can play')
    }
    
    video.onerror = (e) => {
      console.error('Video error:', e)
    }
    
    try {
      video.play()
      console.log('Video play initiated')
    } catch (err) {
      console.log('Initial play failed, will retry on loadedmetadata:', err)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  async function initTrackers() {
    // Prefer MediaPipe FaceLandmarker
    try {
      const vision = await import('@mediapipe/tasks-vision')
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      const originalConsoleError = console.error
      console.error = (...args: unknown[]) => {
        const first = args[0]
        if (typeof first === 'string' && first.startsWith('INFO: Created TensorFlow Lite XNNPACK delegate')) return
        // @ts-expect-error passthrough
        return originalConsoleError.apply(console, args as Parameters<typeof console.error>)
      }
      try {
        landmarkerRef.current = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
      } finally {
        console.error = originalConsoleError
      }
      setAutoFollow(true)
      autoFollowRef.current = true
      return
    } catch {
      // fall back to FaceDetector if available
    }

    const FaceDetectorCtor = (globalThis as any).FaceDetector
    if (FaceDetectorCtor) {
      detectorRef.current = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1, detectLandmarks: true })
      setAutoFollow(true)
    } else {
      setAutoFollow(false)
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (autoFollow) return
    isDraggingRef.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    startPosRef.current = { ...position }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (autoFollow) return
    if (!isDraggingRef.current) return
    if (!dragStartRef.current) return
    const deltaX = e.clientX - dragStartRef.current.x
    const deltaY = e.clientY - dragStartRef.current.y
    setPosition({
      x: startPosRef.current.x + deltaX,
      y: startPosRef.current.y + deltaY,
    })
  }

  function onPointerUp() {
    isDraggingRef.current = false
    dragStartRef.current = null
  }

  // RAF loop for face detection and overlay positioning
  React.useEffect(() => {
    if (!videoElement || !containerRef.current || !overlayRef.current) return

    const video = videoElement
    const container = containerRef.current
    const overlayEl = overlayRef.current
    // prepare overlay element for frequent transforms
    overlayEl.style.transformOrigin = 'top left'
    overlayEl.style.willChange = 'transform,width'

    function detectAndPosition() {
      if (!video || video.readyState !== 4) {
        rafRef.current = requestAnimationFrame(detectAndPosition)
        return
      }

      const now = Date.now()
      const timeSinceLastDetection = now - lastDetectionTimeRef.current
      const shouldDetect = timeSinceLastDetection >= detectionIntervalRef.current

      if (shouldDetect && autoFollowRef.current) {
        lastDetectionTimeRef.current = now
        detectionIntervalRef.current = isSmallScreen ? 200 : 100 // slower on mobile

        if (landmarkerRef.current) {
          // MediaPipe FaceLandmarker
          try {
            const results = landmarkerRef.current.detectForVideo(video, now)
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0]
              const leftEye = landmarks[33] // left eye center
              const rightEye = landmarks[263] // right eye center
              const nose = landmarks[1] // nose tip

              if (leftEye && rightEye && nose) {
                const leftCenter = { x: leftEye.x * video.videoWidth, y: leftEye.y * video.videoHeight }
                const rightCenter = { x: rightEye.x * video.videoWidth, y: rightEye.y * video.videoHeight }
                const mid = { x: (leftCenter.x + rightCenter.x) / 2, y: (leftCenter.y + rightCenter.y) / 2 }

                const eyeDist = Math.sqrt(
                  Math.pow(rightCenter.x - leftCenter.x, 2) + Math.pow(rightCenter.y - leftCenter.y, 2)
                )

                // Map to overlay transform: width scaled relative to eye distance
                const desiredOverlayWidth = eyeDist * baseWidthMultiplier * sizeScaleRef.current
                const targetScale = desiredOverlayWidth / 320
                const targetRot = (Math.atan2(rightCenter.y - leftCenter.y, rightCenter.x - leftCenter.x) * 180) / Math.PI
                
                // Calculate position relative to container
                const containerRect = container.getBoundingClientRect()
                const scaleCover = Math.max(containerRect.width / video.videoWidth, containerRect.height / video.videoHeight)
                const offsetX = (containerRect.width - video.videoWidth * scaleCover) / 2
                const offsetY = (containerRect.height - video.videoHeight * scaleCover) / 2
                
                let targetX = offsetX + mid.x * scaleCover - (desiredOverlayWidth * scaleCover) / 2
                let targetY = offsetY + mid.y * scaleCover - (desiredOverlayWidth * overlayAspectApprox * verticalOffsetRatio * scaleCover)

                // Mirror X position for front camera
                if (isFrontCamera) {
                  targetX = containerRect.width - targetX - (desiredOverlayWidth * scaleCover)
                }

                // Smooth the values
                const smoothing = 0.15
                smoothPosRef.current.x += (targetX - smoothPosRef.current.x) * smoothing
                smoothPosRef.current.y += (targetY - smoothPosRef.current.y) * smoothing
                smoothScaleRef.current += (targetScale - smoothScaleRef.current) * smoothing
                smoothRotRef.current += (targetRot - smoothRotRef.current) * smoothing

                // Target values updated; flag face present
                setIsFaceDetected(true)
                faceDetectedRef.current = true
              }
            } else {
              setIsFaceDetected(false)
              faceDetectedRef.current = false
            }
          } catch (err) {
            console.warn('MediaPipe detection error:', err)
          }
        } else if (detectorRef.current) {
          // FaceDetector fallback
          detectorRef.current.detect(video)
            .then((faces) => {
              if (faces && faces.length > 0) {
                const containerRect = container.getBoundingClientRect()
                const scaleCover = Math.max(containerRect.width / video.videoWidth, containerRect.height / video.videoHeight)
                const offsetX = (containerRect.width - video.videoWidth * scaleCover) / 2
                const offsetY = (containerRect.height - video.videoHeight * scaleCover) / 2

                let detectedThisFrame = false
                const box = faces[0].boundingBox
                const faceWidth = box.width * scaleCover
                let w = faceWidth * 1.35 * sizeScaleRef.current
                let x = offsetX + box.x * scaleCover + (box.width * scaleCover) / 2 - w / 2
                let y = offsetY + box.y * scaleCover + (box.height * scaleCover) * 0.08

                // Mirror X position for front camera
                if (isFrontCamera) {
                  x = containerRect.width - x - w
                }

                smoothPosRef.current.x += (x - smoothPosRef.current.x) * 0.2
                smoothPosRef.current.y += (y - smoothPosRef.current.y) * 0.2
                smoothWidthRef.current += (w - smoothWidthRef.current) * 0.2

                // Target values updated; flag face present
                setIsFaceDetected(true)
                faceDetectedRef.current = true
                detectedThisFrame = true
              }

              if (!detectedThisFrame) {
                setIsFaceDetected(false)
                faceDetectedRef.current = false
              }
            })
            .catch((err) => {
              console.warn('FaceDetector error:', err)
            })
        }
      }

      // Always update overlay at full rAF rate for smooth rendering
      const last = lastFrameTimeRef.current || now
      const dt = now - last
      lastFrameTimeRef.current = now
      const smoothingMs = isSmallScreen ? 120 : 80
      const alpha = 1 - Math.exp(-dt / smoothingMs)

      // Exponential smoothing toward current targets
      displayedPosRef.current.x += (smoothPosRef.current.x - displayedPosRef.current.x) * alpha
      displayedPosRef.current.y += (smoothPosRef.current.y - displayedPosRef.current.y) * alpha
      // smoothScaleRef holds scale factor for MediaPipe path; for FaceDetector path we derive from width
      const currentScale = smoothWidthRef.current ? (smoothWidthRef.current / 320) : smoothScaleRef.current
      displayedScaleRef.current += (currentScale - displayedScaleRef.current) * alpha
      displayedRotRef.current += (smoothRotRef.current - displayedRotRef.current) * alpha

      const overlayWidth = displayedScaleRef.current * 320
      overlayEl.style.width = `${overlayWidth}px`
      overlayEl.style.transform = `translate3d(${displayedPosRef.current.x}px, ${displayedPosRef.current.y}px, 0) rotate(${displayedRotRef.current}deg)`

      rafRef.current = requestAnimationFrame(detectAndPosition)
    }

    rafRef.current = requestAnimationFrame(detectAndPosition)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isSmallScreen, isFrontCamera, videoElement])

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  if (isStarting) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <p>جاري تشغيل الكاميرا...</p>
          <p className="text-sm text-gray-400 mt-2">تحقق من وحدة التحكم للمزيد من التفاصيل</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {/* Camera container - full screen */}
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden bg-black"
      >
        <video
          ref={videoCallbackRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          style={{ 
            transform: isFrontCamera ? 'scaleX(-1)' as any : undefined,
          }}
        />
        
        

        {/* Draggable overlay */}
        <div
          role="img"
          aria-label="glasses-overlay"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          ref={overlayRef}
          className="absolute left-0 top-0 cursor-move touch-none select-none"
          style={{
            display: isFaceDetected ? 'block' : 'none',
            transform: `translate3d(${displayedPosRef.current.x}px, ${displayedPosRef.current.y}px, 0) rotate(${displayedRotRef.current}deg)`,
            transformOrigin: 'top left',
            willChange: 'transform,width',
          }}
        >
          {overlayImageUrl && overlayImageUrl.trim() !== '' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={overlayImageUrl}
              alt="glasses overlay"
              className="pointer-events-none select-none"
              style={{ width: 320, height: 'auto', opacity: 0.92, transform: isFrontCamera ? 'scaleX(-1)' as any : undefined }}
            />
          ) : (
            <svg width="320" height="120" viewBox="0 0 320 120" className="h-auto w-80">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.35" />
                </filter>
              </defs>
              <g filter="url(#shadow)" opacity="0.9">
                <rect x="10" y="40" rx="18" ry="18" width="120" height="60" fill="rgba(0,0,0,0.6)" />
                <rect x="190" y="40" rx="18" ry="18" width="120" height="60" fill="rgba(0,0,0,0.6)" />
                <rect x="130" y="62" width="60" height="10" fill="rgba(0,0,0,0.6)" />
                <circle cx="70" cy="70" r="25" fill="transparent" />
                <circle cx="250" cy="70" r="25" fill="transparent" />
              </g>
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
