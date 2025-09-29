'use client'
import { useEffect, useRef } from 'react'

interface ParticleBackgroundProps {
  color?: string
  opacity?: number
}

export default function ParticleBackground({ 
  color = '#32CD32', 
  opacity = 0.7 
}: ParticleBackgroundProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number>(Date.now())
  const currentColorRef = useRef<[number, number, number]>([0.2, 1.0, 0.2])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Convert hex color to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      return [r, g, b]
    }

    currentColorRef.current = hexToRgb(color)

    // Initialize WebGL
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
    if (!gl) {
      console.warn('WebGL not supported, particle background disabled')
      return
    }
    glRef.current = gl

    // Vertex shader - minimal
    const vs = `attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.,1.);}`

    // Fragment shader - exact from working synced-particle.html
    const fs = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_baseColor;
uniform vec3 u_flowColor;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
            mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.1)), u.x), u.y);
}

vec2 curlNoise(vec2 p) {
  float eps = 0.1;
  float n1 = noise(p + vec2(eps, 0.0));
  float n2 = noise(p - vec2(eps, 0.0));
  float n3 = noise(p + vec2(0.0, eps));
  float n4 = noise(p - vec2(0.0, eps));
  
  float dx = (n1 - n2) / (2.0 * eps);
  float dy = (n3 - n4) / (2.0 * eps);
  
  return vec2(dy, -dx);
}

float particleField(vec2 p, float time) {
  vec2 flow = curlNoise(p * 0.5 + time * 0.1);
  vec2 particlePos = p + flow * 2.0;
  
  float density = 0.0;
  
  for(int i = 0; i < 4; i++) {
    float scale = pow(2.0, float(i));
    vec2 pos = particlePos * scale + time * 0.05 * scale;
    
    float cluster = noise(pos * 0.3);
    float particles = noise(pos) * cluster;
    
    density += particles / scale;
  }
  
  return density;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 8.0;
  
  float time = u_time * 0.3;
  
  float particles = particleField(p, time);
  
  vec2 flow = curlNoise(p * 0.2 + time * 0.1);
  particles += 0.3 * noise(p + flow * 3.0 + time * 0.2);
  
  float levels = 18.0;
  float contourValue = particles * levels;
  float contour = abs(fract(contourValue) - 0.5);
  
  float lineWidth = 0.02 + 0.01 * sin(time + contourValue);
  float line = 1.0 - smoothstep(0.0, lineWidth, contour);
  
  float sparkle = 0.0;
  vec2 sparklePos = p * 20.0 + time * 2.0;
  float sparkleNoise = hash(floor(sparklePos));
  if(sparkleNoise > 0.98) {
    float dist = length(fract(sparklePos) - 0.5);
    sparkle = exp(-dist * 20.0) * 0.5;
  }
  
  float intensity = line + sparkle;
  
  float flowIntensity = length(flow) * 0.5;
  vec3 color = mix(u_baseColor, u_flowColor, flowIntensity);
  
  float glow = exp(-contour * 8.0) * 0.1;
  intensity += glow;
  
  vec2 edge = abs(uv - 0.5) * 2.0;
  float edgeFade = 1.0 - smoothstep(0.8, 1.0, max(edge.x, edge.y));
  intensity *= edgeFade;
  
  gl_FragColor = vec4(color, intensity * 0.7);
}
`

    // Shader creation helper
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    // Create and link program
    const vertexShader = createShader(gl.VERTEX_SHADER, vs)
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fs)
    
    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders')
      return
    }

    const program = gl.createProgram()
    if (!program) return
    
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)
    programRef.current = program

    // Setup geometry (fullscreen quad)
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1
    ]), gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Resize handler
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    // Render loop
    const render = () => {
      if (!gl || !programRef.current) return

      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)

      // Update uniforms
      gl.uniform2f(gl.getUniformLocation(programRef.current, 'u_resolution'), canvas.width, canvas.height)
      gl.uniform1f(gl.getUniformLocation(programRef.current, 'u_time'), (Date.now() - startTimeRef.current) * 0.001)
      
      // Set dynamic colors
      const [r, g, b] = currentColorRef.current
      gl.uniform3f(gl.getUniformLocation(programRef.current, 'u_baseColor'), r, g, b)
      const flowColor: [number, number, number] = [r * 1.5, g, b * 1.5]
      gl.uniform3f(gl.getUniformLocation(programRef.current, 'u_flowColor'), flowColor[0], flowColor[1], flowColor[2])

      // Enable blending and draw
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animationRef.current = requestAnimationFrame(render)
    }

    // Initialize
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    render()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current)
      }
    }
  }, [color])

  // Update color when prop changes
  useEffect(() => {
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      return [r, g, b]
    }
    currentColorRef.current = hexToRgb(color)
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      style={{ opacity }}
    />
  )
}
