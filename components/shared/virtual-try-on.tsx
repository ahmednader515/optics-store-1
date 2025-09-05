"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

type VirtualTryOnProps = {
  overlayImageUrl?: string
  fullScreen?: boolean
  showSizeControls?: boolean
  expandContainer?: boolean
}

type Point = { x: number; y: number }

export default function VirtualTryOn({ overlayImageUrl, fullScreen = false, showSizeControls = true, expandContainer = false }: VirtualTryOnProps) {
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
    const update = () => {
      const newIsSmallScreen = mql.matches
      if (newIsSmallScreen !== isSmallScreen) {
        setIsSmallScreen(newIsSmallScreen)
        // Reset smoothing values when screen size changes to prevent lag
        smoothPosRef.current = { x: 120, y: 120 }
        smoothScaleRef.current = 1.1
        smoothRotRef.current = 0
        displayedPosRef.current = { x: 120, y: 120 }
        displayedScaleRef.current = 1.1
        displayedRotRef.current = 0
        // Reset performance monitoring to avoid false performance drops
        frameTimeHistoryRef.current = []
        lastDetectionTimeRef.current = 0
      }
    }
    update()
    mql.addEventListener?.('change', update)
    return () => mql.removeEventListener?.('change', update)
  }, [isSmallScreen])

  // Performance optimization: reduce detection frequency on mobile
  const detectionIntervalRef = React.useRef<number>(0)
  const lastDetectionTimeRef = React.useRef<number>(0)
  
  // Performance monitoring and adaptive quality
  const frameTimeHistoryRef = React.useRef<number[]>([])
  const performanceModeRef = React.useRef<'high' | 'medium' | 'low'>('high')
  const adaptiveDetectionIntervalRef = React.useRef<number>(33) // Start with 30fps
  const adaptiveSmoothingRef = React.useRef<number>(80) // Start with medium smoothing

  // Device detection and performance optimization
  const [devicePerformance, setDevicePerformance] = React.useState<'high' | 'medium' | 'low'>('high')
  
  React.useEffect(() => {
    // Detect device performance capabilities - ignore screen size, focus on actual device capabilities
    const detectPerformance = () => {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2
      const hasWebGL = !!gl
      
      // Only set to low if truly low-end (no WebGL AND low CPU cores)
      // All other devices get high performance regardless of screen size
      if (!hasWebGL && isLowEnd) {
        return 'low'
      } else {
        return 'high' // Default to high performance for all devices with decent hardware
      }
    }
    
    const perf = detectPerformance()
    setDevicePerformance(perf)
    performanceModeRef.current = perf
    
    // Set high performance settings for all devices (except truly low-end)
    if (perf === 'low') {
      adaptiveDetectionIntervalRef.current = 66 // 15fps detection for truly low-end devices only
      adaptiveSmoothingRef.current = 100
    } else {
      // High performance for all other devices regardless of screen size
      adaptiveDetectionIntervalRef.current = 33 // 30fps detection
      adaptiveSmoothingRef.current = 80 // Fast smoothing
    }
  }, [])

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

  // Ensure the video element receives the stream after start completes
  React.useEffect(() => {
    if (!isStarting && videoRef.current && streamRef.current) {
      const v = videoRef.current
      const s = streamRef.current
      if (v.srcObject !== s) {
        v.srcObject = s
      }
      v.play().catch(() => {})
    }
  }, [isStarting])

  async function startCamera() {
    setError(null)
    setIsStarting(true)
    // In fullScreen, keep constraints lean to avoid black frames on some devices
    const videoConstraints: MediaTrackConstraints = fullScreen
      ? { facingMode: isFrontCamera ? 'user' : 'environment' }
      : { facingMode: isFrontCamera ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    const constraints: MediaStreamConstraints = { audio: false, video: videoConstraints }
    // Acquire camera only — show error ONLY if this step fails
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch {
          // Some browsers may defer play; ignore if stream is present
        }
        // Extra safety: try again after metadata
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {})
        }
      }
    } catch {
      setError('تعذر الوصول إلى الكاميرا. الرجاء التحقق من الأذونات.')
    }

    // Initialize trackers (do not surface camera error if tracking fails)
    try {
      await initTrackers()
    } catch {
      // ignore tracker init errors; UI can still work without auto-follow
    }
    startDetectLoop()
    setIsStarting(false)
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
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
    if (!isDraggingRef.current || !dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setPosition({ x: startPosRef.current.x + dx, y: startPosRef.current.y + dy })
  }

  function onPointerUp(e: React.PointerEvent) {
    if (autoFollow) return
    isDraggingRef.current = false
    dragStartRef.current = null
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }

  function startDetectLoop() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    let lastFrameTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS
    
    const loop = async () => {
      const now = performance.now()
      
      // Frame rate limiting for consistent performance
      if (now - lastFrameTime < frameInterval) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }
      lastFrameTime = now
      
      if (!videoRef.current || !overlayRef.current || !autoFollowRef.current) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }
      
      const container = containerRef.current
      const overlayEl = overlayRef.current
      const video = videoRef.current
      if (!container || !overlayEl || !video) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Performance monitoring
      const frameTime = now - (lastFrameTime || now)
      frameTimeHistoryRef.current.push(frameTime)
      if (frameTimeHistoryRef.current.length > 60) {
        frameTimeHistoryRef.current.shift()
      }
      
      // Adaptive performance adjustment - only reduce for truly poor performance, ignore screen size
      if (frameTimeHistoryRef.current.length >= 30) {
        const avgFrameTime = frameTimeHistoryRef.current.reduce((a, b) => a + b, 0) / frameTimeHistoryRef.current.length
        
        // Use consistent thresholds regardless of device type or screen size
        const poorPerformanceThreshold = 30 // Higher threshold to avoid reducing performance unnecessarily
        const goodPerformanceThreshold = 15
        
        if (avgFrameTime > poorPerformanceThreshold && performanceModeRef.current !== 'low') {
          // Only reduce performance if truly struggling (very high frame times)
          if (performanceModeRef.current === 'high') {
            performanceModeRef.current = 'medium'
            adaptiveDetectionIntervalRef.current = 50
            adaptiveSmoothingRef.current = 90
          } else if (performanceModeRef.current === 'medium') {
            performanceModeRef.current = 'low'
            adaptiveDetectionIntervalRef.current = 80
            adaptiveSmoothingRef.current = 120
          }
        } else if (avgFrameTime < goodPerformanceThreshold && performanceModeRef.current !== 'high') {
          // Increase quality when performance is good
          if (performanceModeRef.current === 'low') {
            performanceModeRef.current = 'medium'
            adaptiveDetectionIntervalRef.current = 50
            adaptiveSmoothingRef.current = 90
          } else if (performanceModeRef.current === 'medium') {
            performanceModeRef.current = 'high'
            adaptiveDetectionIntervalRef.current = 33
            adaptiveSmoothingRef.current = 80
          }
        }
      }

      // Use adaptive detection interval
      const shouldDetect = now - lastDetectionTimeRef.current >= adaptiveDetectionIntervalRef.current
      
      if (shouldDetect) {
        lastDetectionTimeRef.current = now
        
        try {
          const containerRect = container.getBoundingClientRect()
          const cw = containerRect.width
          const ch = containerRect.height
          const vw = video.videoWidth || cw
          const vh = video.videoHeight || ch

          // Compute object-cover mapping
          const scaleCover = Math.max(cw / vw, ch / vh)
          const displayedW = vw * scaleCover
          const displayedH = vh * scaleCover
          const offsetX = (cw - displayedW) / 2
          const offsetY = (ch - displayedH) / 2

          let targetX = smoothPosRef.current.x
          let targetY = smoothPosRef.current.y
          let targetScale = smoothScaleRef.current
          let targetRot = smoothRotRef.current

          let detectedThisFrame = false

          if (landmarkerRef.current) {
            const results = await landmarkerRef.current.detectForVideo(video, now)
            const lm = results?.faceLandmarks?.[0]
            if (lm && lm.length) {
              detectedThisFrame = true
              // Select eye corner landmarks by indices
              // Left eye outer (36x?), we use known FaceMesh indices
              const idx = {
                leftOuter: 33,
                leftInner: 133,
                rightOuter: 362,
                rightInner: 263,
              }
              const getCoord = (i: number) => ({ x: lm[i].x * displayedW + offsetX, y: lm[i].y * displayedH + offsetY })
              const L = getCoord(idx.leftOuter)
              const Li = getCoord(idx.leftInner)
              const R = getCoord(idx.rightOuter)
              const Ri = getCoord(idx.rightInner)
              const leftCenter = { x: (L.x + Li.x) / 2, y: (L.y + Li.y) / 2 }
              const rightCenter = { x: (R.x + Ri.x) / 2, y: (R.y + Ri.y) / 2 }

              const mid = { x: (leftCenter.x + rightCenter.x) / 2, y: (leftCenter.y + rightCenter.y) / 2 }
              const eyeDist = Math.hypot(rightCenter.x - leftCenter.x, rightCenter.y - leftCenter.y)
              const angleRad = Math.atan2(rightCenter.y - leftCenter.y, rightCenter.x - leftCenter.x)

              // Map to overlay transform: width scaled relative to eye distance
              const desiredOverlayWidth = eyeDist * baseWidthMultiplier * sizeScaleRef.current
              targetScale = desiredOverlayWidth / 320
              targetRot = (angleRad * 180) / Math.PI
              targetX = mid.x - (desiredOverlayWidth / 2)
              targetY = mid.y - (desiredOverlayWidth * verticalOffsetRatio)

              // Mirror compensation for front camera (since video is visual-mirrored)
              // Container is mirrored for front camera, so no further X flip needed

              // Clamp inside container bounds based on overlay size
              const overlayHeight = desiredOverlayWidth * overlayAspectApprox
              const maxX = cw - desiredOverlayWidth
              const maxY = ch - overlayHeight
              targetX = Math.max(0, Math.min(targetX, maxX))
              targetY = Math.max(0, Math.min(targetY, maxY))
            }
          } else if (detectorRef.current) {
            const faces = await detectorRef.current.detect(video)
            if (faces && faces.length > 0) {
              detectedThisFrame = true
              const box = faces[0].boundingBox
              const faceWidth = box.width * scaleCover
              let w = faceWidth * 1.35 * sizeScaleRef.current
              let x = offsetX + box.x * scaleCover + (box.width * scaleCover) / 2 - w / 2
              let y = offsetY + box.y * scaleCover + (box.height * scaleCover) * 0.08
              // Container is mirrored for front camera, so no X flip here
              targetX = x
              targetY = y
              targetScale = w / 320
              targetRot = 0
            }
          }

          // Update face detected state if changed
          if (faceDetectedRef.current !== detectedThisFrame) {
            faceDetectedRef.current = detectedThisFrame
            setIsFaceDetected(detectedThisFrame)
          }

          // Update target values for smoothing
          smoothPosRef.current = { x: targetX, y: targetY }
          smoothScaleRef.current = targetScale
          smoothRotRef.current = targetRot
        } catch {
          // ignore detection errors per frame
        }
      }

      // Always update overlay at full rAF rate for smooth rendering
      const last = lastFrameTimeRef.current || now
      const dt = now - last
      lastFrameTimeRef.current = now
      
      // Use adaptive smoothing based on performance - more responsive on mobile
      const smoothingMs = adaptiveSmoothingRef.current
      const alpha = 1 - Math.exp(-dt / smoothingMs)

      // Exponential smoothing toward target with improved stability
      const posDiffX = smoothPosRef.current.x - displayedPosRef.current.x
      const posDiffY = smoothPosRef.current.y - displayedPosRef.current.y
      const scaleDiff = smoothScaleRef.current - displayedScaleRef.current
      const rotDiff = smoothRotRef.current - displayedRotRef.current
      
      // More responsive smoothing for mobile screen sizes
      const isMobileScreen = isSmallScreen
      const positionThreshold = isMobileScreen ? 0.05 : 0.1
      const scaleThreshold = isMobileScreen ? 0.0005 : 0.001
      const rotationThreshold = isMobileScreen ? 0.05 : 0.1
      
      // Use more aggressive smoothing on mobile for better responsiveness
      const smoothingFactor = isMobileScreen ? 1.2 : 1.0
      const adjustedAlpha = Math.min(alpha * smoothingFactor, 1.0)
      
      // Apply smoothing with adaptive thresholds and mobile-optimized alpha
      if (Math.abs(posDiffX) > positionThreshold) {
        displayedPosRef.current.x += posDiffX * adjustedAlpha
      }
      if (Math.abs(posDiffY) > positionThreshold) {
        displayedPosRef.current.y += posDiffY * adjustedAlpha
      }
      if (Math.abs(scaleDiff) > scaleThreshold) {
        displayedScaleRef.current += scaleDiff * adjustedAlpha
      }
      if (Math.abs(rotDiff) > rotationThreshold) {
        displayedRotRef.current += rotDiff * adjustedAlpha
      }

      // Optimize CSS transforms for better performance
      const overlayWidth = displayedScaleRef.current * 320
      const transform = `translate3d(${Math.round(displayedPosRef.current.x)}px, ${Math.round(displayedPosRef.current.y)}px, 0) rotate(${Math.round(displayedRotRef.current * 10) / 10}deg)`
      
      // Only update DOM if values have changed significantly
      if (overlayEl.style.transform !== transform) {
        overlayEl.style.transform = transform
      }
      if (overlayEl.style.width !== `${overlayWidth}px`) {
        overlayEl.style.width = `${overlayWidth}px`
      }
      
      // Set transform origin once
      if (overlayEl.style.transformOrigin !== 'top left') {
        overlayEl.style.transformOrigin = 'top left'
      }
      
      // Optimize will-change property
      if (overlayEl.style.willChange !== 'transform') {
        overlayEl.style.willChange = 'transform'
      }
      
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="px-3 text-sm text-red-600">{error}</div>
      )}

      <div
        ref={containerRef}
        className={fullScreen ? "relative h-full w-full overflow-hidden bg-black" : "relative w-full overflow-hidden rounded-md border bg-black"}
        style={fullScreen ? { transform: isFrontCamera ? 'scaleX(-1)' as any : undefined } : (
          expandContainer
            ? { transform: isFrontCamera ? 'scaleX(-1)' as any : undefined, height: '100vh' }
            : { 
                aspectRatio: isSmallScreen ? '9 / 16' : '16 / 9', 
                transform: isFrontCamera ? 'scaleX(-1)' as any : undefined,
                minHeight: isSmallScreen ? '400px' : undefined,
                maxHeight: isSmallScreen ? '60vh' : undefined
              }
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          style={undefined}
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
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            // Performance optimizations
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            // Reduce repaints
            contain: 'layout style paint',
            // Hardware acceleration hints
            WebkitTransform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            WebkitPerspective: '1000px',
          }}
        >
          {overlayImageUrl && overlayImageUrl.trim() !== '' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={overlayImageUrl}
              alt="glasses"
              className="pointer-events-none"
              style={{ 
                width: 320, 
                height: 'auto', 
                opacity: 0.92,
                // Performance optimizations for image
                imageRendering: 'auto',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
            />
          ) : (
            <svg width="320" height="120" viewBox="0 0 320 120">
              <defs>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
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

      {showSizeControls && (
        <div className="flex flex-col gap-2 px-2">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSizeScale(Math.min(2.0, sizeScale + 0.2))}
              className="h-12 w-12 p-0 bg-orange-600 hover:bg-orange-700 hover:text-white text-white border-orange-600 disabled:bg-gray-400 disabled:border-gray-400"
              disabled={sizeScale >= 2.0}
            >
              +
            </Button>
            <div className="text-center min-w-[60px]">
              <div className="text-sm font-medium">{Math.round(sizeScale * 100)}%</div>
              <div className="text-xs text-muted-foreground">حجم النظارات</div>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSizeScale(Math.max(0.5, sizeScale - 0.2))}
              className="h-12 w-12 p-0 bg-orange-600 hover:bg-orange-700 hover:text-white text-white border-orange-600 disabled:bg-gray-400 disabled:border-gray-400"
              disabled={sizeScale <= 0.5}
            >
              −
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


