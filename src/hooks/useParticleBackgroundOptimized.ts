'use client'
import { useEffect, useRef } from 'react'

interface UseParticleBackgroundOptions {
  color?: string
  opacity?: number
  quality?: 'low' | 'medium' | 'high'
  maxFPS?: number
}

export function useParticleBackgroundOptimized(options: UseParticleBackgroundOptions = {}) {
  const { 
    color = '#346d22', 
    opacity = 0.25, 
    quality = 'medium',
    maxFPS = 60 
  } = options
  
  const rafRef = useRef<number | undefined>(undefined)
  const lastFrameTime = useRef<number>(0)
  const frameInterval = useRef<number>(1000 / maxFPS)

  useEffect(() => {
    // Check if canvas already exists (avoid duplicates)
    if (document.getElementById('particle-bg')) {
      return
    }

    // Performance-based quality settings
    const qualitySettings = {
      low: { scale: 0.5, complexity: 0.5 },
      medium: { scale: 0.75, complexity: 0.75 },
      high: { scale: 1.0, complexity: 1.0 }
    }
    
    const settings = qualitySettings[quality]
    
    const canvas = document.createElement('canvas')
    canvas.id = 'particle-bg'
    
    // Use device pixel ratio for crisp rendering but limit for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const scale = settings.scale * dpr
    
    canvas.width = window.innerWidth * scale
    canvas.height = window.innerHeight * scale
    canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:${opacity}`
    document.body.appendChild(canvas)

    const glContext = canvas.getContext('webgl', {
      alpha: true,
      antialias: false, // Disable for performance
      depth: false,
      stencil: false,
      powerPreference: 'default', // Use integrated GPU if available
      failIfMajorPerformanceCaveat: true
    })
    
    if (!glContext) {
      document.body.removeChild(canvas)
      return
    }
    const gl = glContext

    let program: WebGLProgram, startTime = Date.now()

    const vs = `attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.,1.);}`
    
    // Optimized fragment shader with reduced complexity
    const fs = `
#ifdef GL_ES
precision mediump float; // Use mediump for better performance
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_baseColor;
uniform float u_complexity;

// Simplified hash function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Optimized noise function
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // Smooth interpolation
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Simplified particle field
float particleField(vec2 p, float time) {
  float density = 0.0;
  
  // Reduce iterations based on complexity setting
  int iterations = int(2.0 + u_complexity * 2.0);
  
  for(int i = 0; i < 4; i++) {
    if(i >= iterations) break;
    
    float scale = pow(2.0, float(i));
    vec2 pos = p * scale + time * 0.05 * scale;
    density += noise(pos) / scale;
  }
  
  return density;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * (4.0 + u_complexity * 4.0); // Adjust detail based on complexity
  
  float time = u_time * 0.2; // Slower animation for better performance
  
  float particles = particleField(p, time);
  
  // Simplified contour calculation
  float levels = 8.0 + u_complexity * 10.0;
  float contourValue = particles * levels;
  float contour = abs(fract(contourValue) - 0.5);
  
  float lineWidth = 0.03;
  float line = 1.0 - smoothstep(0.0, lineWidth, contour);
  
  // Simplified sparkle effect
  float sparkle = 0.0;
  if(u_complexity > 0.5) {
    vec2 sparklePos = p * 15.0 + time;
    float sparkleNoise = hash(floor(sparklePos));
    if(sparkleNoise > 0.95) {
      float dist = length(fract(sparklePos) - 0.5);
      sparkle = exp(-dist * 15.0) * 0.3;
    }
  }
  
  float intensity = line + sparkle;
  
  // Edge fade for smooth blending
  vec2 edge = abs(uv - 0.5) * 2.0;
  float edgeFade = 1.0 - smoothstep(0.7, 1.0, max(edge.x, edge.y));
  intensity *= edgeFade;
  
  gl_FragColor = vec4(u_baseColor, intensity * 0.6);
}
`

    function cs(t: number, s: string) {
      const sh = gl.createShader(t)!
      gl.shaderSource(sh, s)
      gl.compileShader(sh)
      
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(sh))
        return null
      }
      return sh
    }

    const vs_shader = cs(gl.VERTEX_SHADER, vs)
    const fs_shader = cs(gl.FRAGMENT_SHADER, fs)
    
    if (!vs_shader || !fs_shader) {
      document.body.removeChild(canvas)
      return
    }

    program = gl.createProgram()!
    gl.attachShader(program, vs_shader)
    gl.attachShader(program, fs_shader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      document.body.removeChild(canvas)
      return
    }

    gl.useProgram(program)

    // Setup geometry (fullscreen quad)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW)

    const pos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    // Cache uniform locations for better performance
    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      baseColor: gl.getUniformLocation(program, 'u_baseColor'),
      complexity: gl.getUniformLocation(program, 'u_complexity')
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth * scale
      canvas.height = window.innerHeight * scale
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    // Optimized render loop with frame rate limiting
    function render(currentTime: number) {
      // Frame rate limiting
      if (currentTime - lastFrameTime.current >= frameInterval.current) {
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        
        // Update uniforms
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
        gl.uniform1f(uniforms.time, (currentTime - startTime) * 0.001)
        gl.uniform1f(uniforms.complexity, settings.complexity)
        
        // Convert hex color to RGB (cached calculation)
        const r = parseInt(color.slice(1, 3), 16) / 255
        const g = parseInt(color.slice(3, 5), 16) / 255
        const b = parseInt(color.slice(5, 7), 16) / 255
        gl.uniform3f(uniforms.baseColor, r, g, b)
        
        // Optimized blending
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        
        lastFrameTime.current = currentTime
      }
      
      rafRef.current = requestAnimationFrame(render)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    rafRef.current = requestAnimationFrame(render)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
      const existingCanvas = document.getElementById('particle-bg')
      if (existingCanvas) {
        document.body.removeChild(existingCanvas)
      }
    }
  }, [color, opacity, quality, maxFPS])
}
