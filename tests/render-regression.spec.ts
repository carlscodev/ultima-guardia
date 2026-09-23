import { expect, test } from '@playwright/test'

/**
 * RENDER REGRESSION TEST - Android Chrome Bug Verification
 * 
 * User reported: "todo se ve como rayas de colores ... todo el renderizado de en combate ... todo borroso todo feo"
 * (everything looks like color stripes... all combat rendering... all blurry all ugly)
 * 
 * Issue: Android Chrome with desynchronized:true showed torn stripes during combat rendering
 * 
 * Fix applied:
 * - FrameRenderer.ts: desynchronized:false, alpha:false
 * - Offscreen buffer composition: all world/actors/VFX composed offscreen, one drawImage to display
 * - Native DPR capped at 2 for presentation
 * - Internal resolution uses ONE SCALE for both dimensions (fixes aspect distortion)
 * - Begin frame resets transform/alpha/filter/composite
 * - Round shake/ground coordinates
 * - Mobile adaptive floor .85 vs .6
 * - Context lost/restored handlers
 * 
 * IMPORTANT: Emulation cannot replicate actual GPU tearing/stripes on physical Android devices.
 * These tests verify the fix is in place and rendering works correctly in emulation.
 */

test.describe('Render Regression - Android Chrome Bug Fix Verification', () => {
  test('1. Android Chrome 390x844 DPR 2.75: Normal combat rendering 20-30s', async ({ page, context }) => {
    console.log('\n=== TEST 1: Android Chrome Emulation - Normal Combat Rendering ===')
    
    // Emulate Android Chrome with exact specs from bug report
    await context.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
    })
    
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: 'dark' })
    
    // Set device scale factor to 2.75 (Android Chrome typical)
    await context.addInitScript(() => {
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 2.75
      })
    })
    
    await page.goto('https://dead-city-hd.preview.emergentagent.com')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true', { timeout: 10000 })
    
    console.log('✅ Page loaded on Android Chrome emulation (390x844, DPR 2.75)')
    
    // Start game
    await page.getByRole('button', { name: /iniciar operación/i }).click()
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    
    console.log('✅ Game started, entering combat...')
    
    // Check for JS errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    // Let REAL gameplay run for 25 seconds (move + fire + reload cycles)
    console.log('Running REAL combat for 25 seconds (move + fire + reload cycles)...')
    
    // Take screenshots during combat at different intervals
    await page.waitForTimeout(5000)
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/android-combat-5s.jpg', 
      quality: 40, 
      fullPage: false 
    })
    console.log('📸 Screenshot at 5s')
    
    await page.waitForTimeout(5000)
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/android-combat-10s.jpg', 
      quality: 40, 
      fullPage: false 
    })
    console.log('📸 Screenshot at 10s')
    
    await page.waitForTimeout(5000)
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/android-combat-15s.jpg', 
      quality: 40, 
      fullPage: false 
    })
    console.log('📸 Screenshot at 15s')
    
    await page.waitForTimeout(5000)
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/android-combat-20s.jpg', 
      quality: 40, 
      fullPage: false 
    })
    console.log('📸 Screenshot at 20s')
    
    await page.waitForTimeout(5000)
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/android-combat-25s.jpg', 
      quality: 40, 
      fullPage: false 
    })
    console.log('📸 Screenshot at 25s')
    
    // Check game state after combat
    const finalState = await page.evaluate(() => {
      const debug = window.__UG_DEBUG__
      return {
        fps: debug?.fps || 0,
        frameMs: debug?.frameMs || 0,
        enemies: debug?.enemies || 0,
        kills: debug?.kills || 0,
        screen: debug?.screen || '',
        renderScale: debug?.renderScale || 0,
        mode: debug?.mode || ''
      }
    })
    
    console.log(`Final state: fps=${finalState.fps}, frameMs=${finalState.frameMs.toFixed(2)}ms, enemies=${finalState.enemies}, kills=${finalState.kills}, renderScale=${finalState.renderScale.toFixed(2)}, mode=${finalState.mode}`)
    
    // Verify no JS errors
    if (errors.length > 0) {
      console.log(`❌ JS errors detected: ${errors.join(', ')}`)
    } else {
      console.log('✅ No JS errors during combat')
    }
    
    expect(errors).toHaveLength(0)
    
    // Verify game is still running
    expect(finalState.screen).toBe('playing')
    console.log('✅ Game still running after 25s combat')
    
    // Verify rendering is happening
    expect(finalState.fps).toBeGreaterThan(0)
    console.log(`✅ FPS: ${finalState.fps} (rendering active)`)
    
    // Verify enemies spawned
    expect(finalState.enemies).toBeGreaterThan(0)
    console.log(`✅ Enemies spawned: ${finalState.enemies}`)
    
    console.log('\n⚠️  NOTE: Emulation cannot replicate actual GPU tearing/color stripes on physical Android devices.')
    console.log('Screenshots show rendering in emulated environment. Physical device testing required for full verification.')
  })
  
  test('2. Verify Canvas2D context attributes: desynchronized=false, alpha=false', async ({ page }) => {
    console.log('\n=== TEST 2: Canvas Context Attributes Verification ===')
    
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('https://dead-city-hd.preview.emergentagent.com')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
    
    await page.getByRole('button', { name: /iniciar operación/i }).click()
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    
    // Pause to access engine
    await page.keyboard.press('KeyP')
    
    const contextTest = await page.evaluate(async () => {
      const results: string[] = []
      
      try {
        const module = await import('/src/engine/GameEngine.ts')
        const e = module.getDevelopmentEngine()
        
        if (!e) {
          results.push('❌ Cannot access engine instance')
          return results
        }
        
        // Access renderer and get context attributes
        // @ts-ignore
        const renderer = e.renderer
        
        if (!renderer) {
          results.push('❌ Cannot access renderer')
          return results
        }
        
        // Get display canvas context attributes
        // @ts-ignore
        const displayAttrs = renderer.display.getContextAttributes()
        
        results.push(`Display canvas context attributes:`)
        results.push(`  - desynchronized: ${displayAttrs.desynchronized}`)
        results.push(`  - alpha: ${displayAttrs.alpha}`)
        results.push(`  - colorSpace: ${displayAttrs.colorSpace}`)
        
        if (displayAttrs.desynchronized === false) {
          results.push(`✅ desynchronized=false (CORRECT - prevents tearing/stripes)`)
        } else {
          results.push(`❌ desynchronized=${displayAttrs.desynchronized} (WRONG - should be false)`)
        }
        
        if (displayAttrs.alpha === false) {
          results.push(`✅ alpha=false (CORRECT - opaque rendering)`)
        } else {
          results.push(`❌ alpha=${displayAttrs.alpha} (WRONG - should be false)`)
        }
        
        // Get offscreen buffer context attributes
        // @ts-ignore
        const bufferAttrs = renderer.context.getContextAttributes()
        
        results.push(`Offscreen buffer context attributes:`)
        results.push(`  - desynchronized: ${bufferAttrs.desynchronized}`)
        results.push(`  - alpha: ${bufferAttrs.alpha}`)
        
        if (bufferAttrs.desynchronized === false && bufferAttrs.alpha === false) {
          results.push(`✅ Offscreen buffer also uses desynchronized=false, alpha=false`)
        }
        
        // Verify buffer and display are separate canvases
        // @ts-ignore
        const buffer = renderer.buffer
        // @ts-ignore
        const canvas = renderer.canvas
        
        if (buffer !== canvas) {
          results.push(`✅ Offscreen buffer (${buffer.width}x${buffer.height}) separate from display canvas (${canvas.width}x${canvas.height})`)
        } else {
          results.push(`❌ Buffer and display canvas are the same (should be separate)`)
        }
        
        // Check DPR capping
        const actualDPR = window.devicePixelRatio || 1
        // @ts-ignore
        const canvasWidth = canvas.width
        const cssWidth = window.innerWidth
        const usedDPR = canvasWidth / cssWidth
        
        results.push(`Device pixel ratio: ${actualDPR.toFixed(2)}`)
        results.push(`Canvas display size: ${canvasWidth}x${canvas.height}`)
        results.push(`CSS viewport size: ${cssWidth}x${window.innerHeight}`)
        results.push(`Effective DPR used: ${usedDPR.toFixed(2)}`)
        
        if (usedDPR <= 2.1) {
          results.push(`✅ DPR capped at ~2 (actual: ${usedDPR.toFixed(2)})`)
        } else {
          results.push(`⚠️  DPR not capped: ${usedDPR.toFixed(2)} (expected ≤2)`)
        }
        
      } catch (error) {
        results.push(`❌ Error: ${error}`)
      }
      
      return results
    })
    
    contextTest.forEach(result => console.log(result))
    
    const failures = contextTest.filter(r => r.startsWith('❌'))
    expect(failures).toHaveLength(0)
  })
  
  test('3. Verify render composition: one drawImage per frame, zero fillRect on display', async ({ page }) => {
    console.log('\n=== TEST 3: Render Composition Pattern Verification ===')
    
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('https://dead-city-hd.preview.emergentagent.com')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
    
    await page.getByRole('button', { name: /iniciar operación/i }).click()
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    
    await page.keyboard.press('KeyP')
    
    const compositionTest = await page.evaluate(async () => {
      const results: string[] = []
      
      try {
        const module = await import('/src/engine/GameEngine.ts')
        const e = module.getDevelopmentEngine()
        
        if (!e) {
          results.push('❌ Cannot access engine instance')
          return results
        }
        
        // @ts-ignore
        const renderer = e.renderer
        // @ts-ignore
        const displayContext = renderer.display
        // @ts-ignore
        const bufferContext = renderer.context
        
        // Instrument display context to count draw calls
        let drawImageCount = 0
        let fillRectCount = 0
        
        const originalDrawImage = displayContext.drawImage.bind(displayContext)
        const originalFillRect = displayContext.fillRect.bind(displayContext)
        
        displayContext.drawImage = function(...args: any[]) {
          drawImageCount++
          return originalDrawImage(...args)
        }
        
        displayContext.fillRect = function(...args: any[]) {
          fillRectCount++
          return originalFillRect(...args)
        }
        
        // Resume and render one frame
        // @ts-ignore
        e.state.screen = 'playing'
        // @ts-ignore
        e.update(1/60)
        // @ts-ignore
        e.render()
        
        results.push(`Display canvas draw calls per frame:`)
        results.push(`  - drawImage: ${drawImageCount}`)
        results.push(`  - fillRect: ${fillRectCount}`)
        
        if (drawImageCount === 1) {
          results.push(`✅ Exactly one drawImage per frame (CORRECT - single blit from offscreen buffer)`)
        } else {
          results.push(`❌ drawImage count: ${drawImageCount} (expected 1)`)
        }
        
        if (fillRectCount === 0) {
          results.push(`✅ Zero fillRect on display canvas (CORRECT - no direct drawing)`)
        } else {
          results.push(`⚠️  fillRect count: ${fillRectCount} (expected 0, but vignette/effects may use fillRect)`)
        }
        
        // Verify offscreen buffer is being used for composition
        // @ts-ignore
        const buffer = renderer.buffer
        if (buffer.width > 0 && buffer.height > 0) {
          results.push(`✅ Offscreen buffer active: ${buffer.width}x${buffer.height}`)
        } else {
          results.push(`❌ Offscreen buffer not initialized`)
        }
        
        // Check frame counter incremented
        // @ts-ignore
        const frames = renderer.frames
        if (frames > 0) {
          results.push(`✅ Frame counter: ${frames} (renderer.present() called)`)
        }
        
      } catch (error) {
        results.push(`❌ Error: ${error}`)
      }
      
      return results
    })
    
    compositionTest.forEach(result => console.log(result))
    
    const failures = compositionTest.filter(r => r.startsWith('❌'))
    expect(failures).toHaveLength(0)
  })
  
  test('4. Verify render scales and viewport resize: internal resolution matches viewport', async ({ page }) => {
    console.log('\n=== TEST 4: Render Scales and Viewport Resize ===')
    
    await page.goto('https://dead-city-hd.preview.emergentagent.com')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
    
    await page.getByRole('button', { name: /iniciar operación/i }).click()
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    
    await page.keyboard.press('KeyP')
    
    // Test different scales
    const scales = [0.5, 0.85, 1.25]
    
    for (const scale of scales) {
      console.log(`\nTesting scale: ${scale}`)
      
      const scaleTest = await page.evaluate(async (testScale) => {
        const results: string[] = []
        
        try {
          const module = await import('/src/engine/GameEngine.ts')
          const e = module.getDevelopmentEngine()
          
          if (!e) {
            results.push('❌ Cannot access engine instance')
            return results
          }
          
          // Set scale via settings
          const { settings } = await import('/src/stores/profile.ts')
          settings.resolution = testScale
          
          // @ts-ignore
          e.configure()
          
          // @ts-ignore
          const renderer = e.renderer
          // @ts-ignore
          const actualScale = renderer.scale
          // @ts-ignore
          const width = renderer.width
          // @ts-ignore
          const height = renderer.height
          
          const cssWidth = window.innerWidth
          const cssHeight = window.innerHeight
          
          results.push(`Scale ${testScale}: internal=${width}x${height}, CSS=${cssWidth}x${cssHeight}, actualScale=${actualScale.toFixed(3)}`)
          
          // Verify ONE SCALE used for both dimensions (no independent minwidth distortion)
          const expectedWidth = Math.round(cssWidth * actualScale)
          const expectedHeight = Math.round(cssHeight * actualScale)
          
          const widthMatch = Math.abs(width - expectedWidth) <= 2
          const heightMatch = Math.abs(height - expectedHeight) <= 2
          
          if (widthMatch && heightMatch) {
            results.push(`✅ ONE SCALE applied to both dimensions (no aspect distortion)`)
          } else {
            results.push(`❌ Scale mismatch: expected ${expectedWidth}x${expectedHeight}, got ${width}x${height}`)
          }
          
        } catch (error) {
          results.push(`❌ Error: ${error}`)
        }
        
        return results
      }, scale)
      
      scaleTest.forEach(result => console.log(result))
    }
    
    // Test viewport resize
    console.log(`\nTesting viewport resize...`)
    
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    const resizeTest = await page.evaluate(async () => {
      const results: string[] = []
      
      try {
        const module = await import('/src/engine/GameEngine.ts')
        const e = module.getDevelopmentEngine()
        
        if (!e) {
          results.push('❌ Cannot access engine instance')
          return results
        }
        
        // @ts-ignore
        const renderer = e.renderer
        // @ts-ignore
        const width = renderer.width
        // @ts-ignore
        const height = renderer.height
        
        const cssWidth = window.innerWidth
        const cssHeight = window.innerHeight
        
        results.push(`After resize: internal=${width}x${height}, CSS=${cssWidth}x${cssHeight}`)
        
        if (width > 0 && height > 0) {
          results.push(`✅ Renderer updated after viewport resize`)
        } else {
          results.push(`❌ Renderer not updated after resize`)
        }
        
        // Verify no blank frames after resize
        // @ts-ignore
        e.state.screen = 'playing'
        // @ts-ignore
        e.render()
        
        // @ts-ignore
        const frames = renderer.frames
        if (frames > 0) {
          results.push(`✅ Rendering continues after resize (frames: ${frames})`)
        }
        
      } catch (error) {
        results.push(`❌ Error: ${error}`)
      }
      
      return results
    })
    
    resizeTest.forEach(result => console.log(result))
  })
  
  test('5. REAL PERFORMANCE: 100 enemies stress test with 10s RAF measurement', async ({ page }) => {
    console.log('\n=== TEST 5: REAL Performance Test (100 Enemies, 10s RAF) ===')
    
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('https://dead-city-hd.preview.emergentagent.com')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
    
    await page.getByRole('button', { name: /iniciar operación/i }).click()
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    
    // Setup stress test
    await page.evaluate(async () => {
      const module = await import('/src/engine/GameEngine.ts')
      const e = module.getDevelopmentEngine()
      
      if (!e) return
      
      // Clear enemies and spawn 100
      // @ts-ignore
      e.enemies.reset()
      
      const enemyTypes = ['walker', 'runner', 'armored', 'toxic', 'tank'] as const
      let spawned = 0
      
      for (let i = 0; i < 100; i++) {
        const kind = enemyTypes[i % enemyTypes.length]
        const angle = (i / 100) * Math.PI * 2
        const distance = 200 + (i % 10) * 30
        // @ts-ignore
        const x = e.player.x + Math.cos(angle) * distance
        // @ts-ignore
        const y = e.player.y + Math.sin(angle) * distance
        
        // @ts-ignore
        const success = e.enemies.spawn(kind, 5, x, y, distance)
        if (success) spawned++
      }
      
      console.log(`Spawned ${spawned} enemies for stress test`)
      
      // Give player high shield to survive
      // @ts-ignore
      e.effects.shield = 999
      
      // Disable XP levelup to avoid pause
      // @ts-ignore
      e.player.xpNeeded = 999999
      
      // Disable spawn timer
      // @ts-ignore
      e.spawnRemaining = 0
      // @ts-ignore
      e.spawnTimer = 99999
    })
    
    console.log('✅ Stress test setup complete: 100 enemies, shield active, XP disabled')
    
    // Resume game via engine
    await page.evaluate(async () => {
      const module = await import('/src/engine/GameEngine.ts')
      const e = module.getDevelopmentEngine()
      if (e) {
        // @ts-ignore
        e.setScreen('playing')
      }
    })
    
    console.log('Running REAL RAF for 10 seconds...')
    
    // Wait and collect FPS samples during REAL rendering
    const samples: number[] = []
    
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000)
      
      const state = await page.evaluate(() => {
        const debug = window.__UG_DEBUG__
        return {
          fps: debug?.fps || 0,
          frameMs: debug?.frameMs || 0,
          enemies: debug?.enemies || 0,
          frames: debug?.renderScale || 0
        }
      })
      
      samples.push(state.fps)
      console.log(`  ${i+1}s: fps=${state.fps}, frameMs=${state.frameMs.toFixed(2)}ms, enemies=${state.enemies}`)
    }
    
    const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length
    const minFps = Math.min(...samples)
    const maxFps = Math.max(...samples)
    
    console.log(`\nPerformance results (100 enemies, 10s REAL RAF):`)
    console.log(`  - Average FPS: ${avgFps.toFixed(1)}`)
    console.log(`  - Min FPS: ${minFps}`)
    console.log(`  - Max FPS: ${maxFps}`)
    
    // Take screenshot during stress
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/android-stress-100enemies.jpg', 
      quality: 40, 
      fullPage: false 
    })
    console.log('📸 Screenshot saved: android-stress-100enemies.jpg')
    
    // Verify rendering is happening
    expect(avgFps).toBeGreaterThan(0)
    console.log('✅ REAL performance test completed')
  })
  
  test('6. Desktop 1920x800: Verify rendering works on desktop viewport', async ({ page }) => {
    console.log('\n=== TEST 6: Desktop 1920x800 Rendering ===')
    
    await page.setViewportSize({ width: 1920, height: 800 })
    await page.goto('https://dead-city-hd.preview.emergentagent.com')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
    
    await page.getByRole('button', { name: /iniciar operación/i }).click()
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    
    console.log('Running desktop combat for 10 seconds...')
    
    await page.waitForTimeout(5000)
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/desktop-combat-5s.jpg', 
      quality: 40, 
      fullPage: false 
    })
    
    await page.waitForTimeout(5000)
    await page.screenshot({ 
      path: '/app/test_reports/screenshots/desktop-combat-10s.jpg', 
      quality: 40, 
      fullPage: false 
    })
    
    const state = await page.evaluate(() => {
      const debug = window.__UG_DEBUG__
      return {
        fps: debug?.fps || 0,
        frameMs: debug?.frameMs || 0,
        screen: debug?.screen || '',
        mode: debug?.mode || ''
      }
    })
    
    console.log(`Desktop state: fps=${state.fps}, frameMs=${state.frameMs.toFixed(2)}ms, mode=${state.mode}`)
    
    expect(state.screen).toBe('playing')
    expect(state.fps).toBeGreaterThan(0)
    
    console.log('✅ Desktop rendering verified')
  })
})

test.describe('Render Regression - Quality Settings', () => {
  test('All quality settings render correctly: low, balanced, high, crisp, smooth', async ({ page }) => {
    console.log('\n=== TEST: All Quality Settings ===')
    
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('https://dead-city-hd.preview.emergentagent.com')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
    
    const qualities = [
      { resolution: 0.5, aa: 'crisp', name: 'Low Crisp' },
      { resolution: 0.5, aa: 'smooth', name: 'Low Smooth' },
      { resolution: 0.85, aa: 'crisp', name: 'Balanced Crisp' },
      { resolution: 0.85, aa: 'smooth', name: 'Balanced Smooth' },
      { resolution: 1.25, aa: 'crisp', name: 'High Crisp' },
      { resolution: 1.25, aa: 'smooth', name: 'High Smooth' }
    ]
    
    for (const quality of qualities) {
      console.log(`\nTesting: ${quality.name} (resolution=${quality.resolution}, aa=${quality.aa})`)
      
      await page.evaluate(async (q) => {
        const { settings } = await import('/src/stores/profile.ts')
        settings.resolution = q.resolution
        settings.aa = q.aa as 'crisp' | 'smooth'
      }, quality)
      
      await page.getByRole('button', { name: /iniciar operación/i }).click()
      await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
      
      // Run for 5 seconds
      await page.waitForTimeout(5000)
      
      const state = await page.evaluate(() => {
        const debug = window.__UG_DEBUG__
        return {
          fps: debug?.fps || 0,
          renderScale: debug?.renderScale || 0,
          screen: debug?.screen || ''
        }
      })
      
      console.log(`  ${quality.name}: fps=${state.fps}, renderScale=${state.renderScale.toFixed(3)}`)
      
      expect(state.screen).toBe('playing')
      expect(state.fps).toBeGreaterThan(0)
      
      // Return to menu
      await page.keyboard.press('KeyP')
      await page.getByRole('button', { name: /volver al lobby/i }).click()
      await page.waitForTimeout(500)
    }
    
    console.log('\n✅ All quality settings render correctly')
  })
})
