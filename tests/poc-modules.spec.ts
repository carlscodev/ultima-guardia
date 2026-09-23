import { expect, test } from '@playwright/test'

test.describe('POC Module Tests - Campaign, Navigation, Camera', () => {
  test('Campaign: rounds 1-10, extraction phase, no round 11 in campaign mode', async ({ page }) => {
    await page.goto('/')
    
    // Test Campaign module in isolation using page.evaluate
    const campaignTests = await page.evaluate(async () => {
      const results: string[] = []
      
      try {
        // Dynamically import Campaign module
        const { Campaign } = await import('/src/engine/systems/Campaign.ts')
        
        // Test 1: Campaign mode initialization
        const campaign = new Campaign('campaign')
        if (campaign.mode !== 'campaign') {
          results.push('❌ Campaign mode initialization failed')
        } else {
          results.push('✅ Campaign mode initialized correctly')
        }
        
        // Test 2: Progress through rounds 1-10 (next() returns true all 10 times)
        let roundsPassed = true
        for (let i = 1; i <= 10; i++) {
          const canContinue = campaign.next()
          if (!canContinue) {
            results.push(`❌ Round ${i}: next() returned false, expected true for rounds 1-10`)
            roundsPassed = false
            break
          }
        }
        if (roundsPassed && campaign.wave === 10) {
          results.push('✅ Rounds 1-10 progression correct (next() returned true all 10 times)')
        } else if (roundsPassed) {
          results.push(`❌ After 10 calls to next(), wave should be 10, got: ${campaign.wave}`)
          roundsPassed = false
        }
        
        // Test 3: Calling next() AFTER round 10 completed returns false and enters extraction
        const canContinue11 = campaign.next()
        if (canContinue11) {
          results.push('❌ next() after round 10 should return false')
        } else {
          results.push('✅ next() after round 10 returns false')
        }
        
        if (campaign.phase !== 'extract') {
          results.push(`❌ Phase should be 'extract' after calling next() at wave 10, got: ${campaign.phase}`)
        } else {
          results.push('✅ Extraction phase activated after calling next() at wave 10')
        }
        
        // Test 4: Final flag at round 10
        if (!campaign.final) {
          results.push('❌ final flag should be true at round 10')
        } else {
          results.push('✅ final flag is true at round 10')
        }
        
        // Test 5: No round 11 in campaign mode (already tested above, wave stays at 10)
        if (campaign.wave !== 10) {
          results.push(`❌ Wave should stay at 10 after extraction phase, got: ${campaign.wave}`)
        } else {
          results.push('✅ No round 11 in campaign mode (wave stays at 10)')
        }
        
        // Test 6: Extraction within radius 72 for 4 seconds
        campaign.wave = 10
        campaign.phase = 'extract'
        campaign.extraction = 0
        
        // Inside extraction point (3030, 600) with radius < 72
        const insideX = 3030
        const insideY = 600
        
        // Simulate 3.5 seconds inside (should not complete)
        for (let i = 0; i < 7; i++) {
          const completed = campaign.tickExtraction(0.5, insideX, insideY)
          if (completed && i < 6) {
            results.push('❌ Extraction completed before 4 seconds')
            break
          }
        }
        
        if (campaign.extraction < 3.5 || campaign.extraction > 3.6) {
          results.push(`❌ Extraction timer incorrect: ${campaign.extraction}`)
        } else {
          results.push('✅ Extraction timer accumulates correctly')
        }
        
        // Complete extraction (4 seconds total)
        const completed = campaign.tickExtraction(0.5, insideX, insideY)
        if (!completed || campaign.phase !== 'complete') {
          results.push('❌ Extraction should complete after 4 seconds')
        } else {
          results.push('✅ Extraction completes after 4 seconds inside radius')
        }
        
        // Test 7: Extraction resets when leaving radius
        const campaign2 = new Campaign('campaign')
        campaign2.wave = 10
        campaign2.phase = 'extract'
        campaign2.extraction = 2.5
        
        // Move outside radius (> 72 units away)
        const outsideX = 3030 + 100
        const outsideY = 600
        campaign2.tickExtraction(0.5, outsideX, outsideY)
        
        if (campaign2.extraction !== 0) {
          results.push(`❌ Extraction should reset to 0 when leaving radius, got: ${campaign2.extraction}`)
        } else {
          results.push('✅ Extraction resets when leaving radius')
        }
        
        // Test 8: Infinite mode continues past round 10
        const infiniteCampaign = new Campaign('infinite')
        for (let i = 1; i <= 15; i++) {
          const canContinue = infiniteCampaign.next()
          if (!canContinue) {
            results.push(`❌ Infinite mode should continue past round 10, stopped at round ${i}`)
            break
          }
        }
        if (infiniteCampaign.wave === 15) {
          results.push('✅ Infinite mode continues past round 10')
        }
        
      } catch (error) {
        results.push(`❌ Error testing Campaign: ${error}`)
      }
      
      return results
    })
    
    console.log('\n=== Campaign Module Tests ===')
    campaignTests.forEach(result => console.log(result))
    
    const failedTests = campaignTests.filter(r => r.startsWith('❌'))
    expect(failedTests).toHaveLength(0)
  })
  
  test('Navigation: pathfinding around obstacles, waypoints in unblocked grid', async ({ page }) => {
    await page.goto('/')
    
    const navigationTests = await page.evaluate(async () => {
      const results: string[] = []
      
      try {
        const { Navigation } = await import('/src/engine/systems/Navigation.ts')
        
        // Create test obstacles
        const obstacles = [
          { x: 600, y: 600, width: 100, depth: 100, solid: true },
          { x: 300, y: 300, width: 80, depth: 80, solid: true },
          { x: 900, y: 900, width: 60, depth: 60, solid: true },
        ]
        
        const nav = new Navigation(1200, 1200, obstacles)
        
        // Test 1: Grid initialization
        if (nav.cols !== Math.ceil(1200 / 24) || nav.rows !== Math.ceil(1200 / 24)) {
          results.push(`❌ Grid dimensions incorrect: ${nav.cols}x${nav.rows}`)
        } else {
          results.push('✅ Grid initialized with correct dimensions')
        }
        
        // Test 2: Path from same cell returns target
        const sameCellPath = nav.path({ x: 100, y: 100 }, { x: 100, y: 100 })
        if (sameCellPath.length !== 1) {
          results.push(`❌ Same cell path should return 1 waypoint, got: ${sameCellPath.length}`)
        } else {
          results.push('✅ Same cell path returns single waypoint')
        }
        
        // Test 3: Path in empty area (no obstacles)
        const emptyPath = nav.path({ x: 50, y: 50 }, { x: 150, y: 150 })
        if (emptyPath.length === 0) {
          results.push('❌ Empty area path should not be empty')
        } else {
          results.push(`✅ Empty area path found with ${emptyPath.length} waypoints`)
        }
        
        // Test 4: All waypoints are in unblocked grid cells
        const testPath = nav.path({ x: 100, y: 100 }, { x: 1100, y: 1100 })
        let allUnblocked = true
        for (const point of testPath) {
          const cellX = Math.floor(point.x / nav.cell)
          const cellY = Math.floor(point.y / nav.cell)
          const index = cellY * nav.cols + cellX
          if (nav.blocked[index]) {
            results.push(`❌ Waypoint at (${point.x}, ${point.y}) is in blocked cell`)
            allUnblocked = false
            break
          }
        }
        if (allUnblocked && testPath.length > 0) {
          results.push('✅ All waypoints are in unblocked grid cells')
        }
        
        // Test 5: Path around building obstacle
        const aroundObstacle = nav.path({ x: 550, y: 600 }, { x: 650, y: 600 })
        if (aroundObstacle.length === 0) {
          results.push('❌ Should find path around obstacle')
        } else {
          results.push(`✅ Path around obstacle found with ${aroundObstacle.length} waypoints`)
        }
        
        // Test 6: Path reaches other side without collision
        const crossPath = nav.path({ x: 100, y: 600 }, { x: 1100, y: 600 })
        if (crossPath.length === 0) {
          results.push('❌ Should find path across map')
        } else {
          const lastPoint = crossPath[crossPath.length - 1]
          if (Math.abs(lastPoint.x - 1100) > 50 || Math.abs(lastPoint.y - 600) > 50) {
            results.push(`❌ Path doesn't reach target, ended at (${lastPoint.x}, ${lastPoint.y})`)
          } else {
            results.push('✅ Path reaches other side of map')
          }
        }
        
        // Test 7: Target obstructed finds nearest free cell
        const obstructedTarget = nav.path({ x: 100, y: 100 }, { x: 600, y: 600 })
        if (obstructedTarget.length === 0) {
          results.push('❌ Should find path to nearest free cell when target obstructed')
        } else {
          results.push('✅ Finds nearest free cell when target obstructed')
        }
        
        // Test 8: Pathfinding is bounded (doesn't go out of bounds)
        const boundedPath = nav.path({ x: 0, y: 0 }, { x: 1199, y: 1199 })
        let allBounded = true
        for (const point of boundedPath) {
          if (point.x < 0 || point.x >= 1200 || point.y < 0 || point.y >= 1200) {
            results.push(`❌ Waypoint out of bounds: (${point.x}, ${point.y})`)
            allBounded = false
            break
          }
        }
        if (allBounded && boundedPath.length > 0) {
          results.push('✅ All waypoints are within bounds')
        }
        
      } catch (error) {
        results.push(`❌ Error testing Navigation: ${error}`)
      }
      
      return results
    })
    
    console.log('\n=== Navigation Module Tests ===')
    navigationTests.forEach(result => console.log(result))
    
    const failedTests = navigationTests.filter(r => r.startsWith('❌'))
    expect(failedTests).toHaveLength(0)
  })
  
  test('Camera: smooth lead bounded 25 units, zoom 1.035 cinematic resets', async ({ page }) => {
    await page.goto('/')
    
    const cameraTests = await page.evaluate(async () => {
      const results: string[] = []
      
      try {
        const { Camera } = await import('/src/engine/systems/Camera.ts')
        
        const camera = new Camera()
        
        // Test 1: Initial state
        if (camera.x !== 600 || camera.y !== 600 || camera.zoom !== 1) {
          results.push(`❌ Initial state incorrect: (${camera.x}, ${camera.y}, ${camera.zoom})`)
        } else {
          results.push('✅ Camera initialized at (600, 600) with zoom 1')
        }
        
        // Test 2: Smooth follow with lead (bounded 25 units) - needs 120 ticks for exponential convergence
        const playerX = 700
        const playerY = 700
        const aimX = 100
        const aimY = 0
        
        // Update camera 120 times to allow exponential convergence
        for (let i = 0; i < 120; i++) {
          camera.update(0.016, playerX, playerY, aimX, aimY, false)
        }
        
        // Camera should move towards player + lead
        const length = Math.hypot(aimX, aimY) || 1
        const expectedLeadX = playerX + (aimX / length) * 25
        const expectedLeadY = playerY + (aimY / length) * 25
        
        // After 120 updates, camera should be very close to target (exponential convergence)
        const distanceToTarget = Math.hypot(camera.x - expectedLeadX, camera.y - expectedLeadY)
        if (distanceToTarget > 5) {
          results.push(`❌ Camera not converged after 120 ticks, distance: ${distanceToTarget.toFixed(2)}`)
        } else {
          results.push(`✅ Camera follows with smooth lead (converged to ${distanceToTarget.toFixed(2)} units)`)
        }
        
        // Test 3: Lead is bounded to 25 units
        const leadDistance = Math.hypot(camera.x - playerX, camera.y - playerY)
        if (leadDistance > 30) {
          results.push(`❌ Lead distance exceeds 25 units: ${leadDistance}`)
        } else {
          results.push(`✅ Lead bounded correctly: ${leadDistance.toFixed(2)} units`)
        }
        
        // Test 4: Cinematic zoom to 1.035
        const camera2 = new Camera()
        for (let i = 0; i < 20; i++) {
          camera2.update(0.016, 600, 600, 0, 0, true)
        }
        
        if (Math.abs(camera2.zoom - 1.035) > 0.01) {
          results.push(`❌ Cinematic zoom incorrect: ${camera2.zoom}`)
        } else {
          results.push('✅ Cinematic zoom reaches 1.035')
        }
        
        // Test 5: Zoom resets to 1 when not cinematic
        for (let i = 0; i < 20; i++) {
          camera2.update(0.016, 600, 600, 0, 0, false)
        }
        
        if (Math.abs(camera2.zoom - 1) > 0.01) {
          results.push(`❌ Zoom should reset to 1, got: ${camera2.zoom}`)
        } else {
          results.push('✅ Zoom resets to 1 when not cinematic')
        }
        
        // Test 6: Reset function
        camera.reset(800, 800)
        if (camera.x !== 800 || camera.y !== 800 || camera.zoom !== 1) {
          results.push(`❌ Reset failed: (${camera.x}, ${camera.y}, ${camera.zoom})`)
        } else {
          results.push('✅ Reset function works correctly')
        }
        
        // Test 7: Smooth interpolation (exponential decay)
        const camera3 = new Camera()
        const startX = camera3.x
        camera3.update(0.016, 800, 600, 0, 0, false)
        const firstMove = Math.abs(camera3.x - startX)
        
        camera3.update(0.016, 800, 600, 0, 0, false)
        const secondMove = Math.abs(camera3.x - (startX + firstMove))
        
        // Second move should be smaller (exponential decay)
        if (secondMove >= firstMove) {
          results.push(`❌ Camera should use exponential smoothing, moves: ${firstMove}, ${secondMove}`)
        } else {
          results.push('✅ Camera uses exponential smoothing')
        }
        
      } catch (error) {
        results.push(`❌ Error testing Camera: ${error}`)
      }
      
      return results
    })
    
    console.log('\n=== Camera Module Tests ===')
    cameraTests.forEach(result => console.log(result))
    
    const failedTests = cameraTests.filter(r => r.startsWith('❌'))
    expect(failedTests).toHaveLength(0)
  })
  
  test.skip('Baseline: start, movement, auto-shoot, kills, pulse, pause without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`)
      }
    })
    
    await page.goto('/')
    await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
    
    // Start game
    await page.getByRole('button', { name: 'ENTRAR EN LA ZONA' }).click()
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    
    // Test movement
    const startX = await page.evaluate(() => window.__UG_DEBUG__?.playerX)
    await page.keyboard.down('KeyD')
    await page.waitForTimeout(500)
    await page.keyboard.up('KeyD')
    const endX = await page.evaluate(() => window.__UG_DEBUG__?.playerX)
    expect(endX).toBeGreaterThan(startX + 10)
    console.log('✅ Movement working')
    
    // Wait for auto-shoot and kills
    await page.waitForTimeout(3000)
    const kills = await page.evaluate(() => window.__UG_DEBUG__?.kills)
    expect(kills).toBeGreaterThan(0)
    console.log(`✅ Auto-shoot working, kills: ${kills}`)
    
    // Test pulse
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: /Pulso defensivo, recargando/ })).toBeDisabled()
    console.log('✅ Pulse working')
    
    // Test pause
    await page.keyboard.press('KeyP')
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'paused')
    console.log('✅ Pause working')
    
    // Resume
    await page.keyboard.press('Escape')
    await expect(page.locator('main')).toHaveAttribute('data-screen', 'playing')
    console.log('✅ Resume working')
    
    // Check for errors
    if (errors.length > 0) {
      console.log('❌ Errors detected:', errors)
    } else {
      console.log('✅ No errors detected')
    }
    
    expect(errors).toHaveLength(0)
  })
})

test.describe('FPS Baseline Measurement', () => {
  test('Desktop 1920x800 FPS baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 800 })
    await page.goto('/')
    
    await page.getByRole('button', { name: /entrar en la zona/i }).click()
    await page.keyboard.down('KeyD')
    await page.waitForTimeout(5000)
    await page.keyboard.up('KeyD')
    
    const telemetry = await page.evaluate(() => window.__UG_DEBUG__)
    console.log(`\n=== Desktop 1920x800 FPS Baseline ===`)
    console.log(`FPS: ${telemetry?.fps}`)
    console.log(`Frame Time: ${telemetry?.frameMs}ms`)
    console.log(`Render Scale: ${telemetry?.renderScale}`)
    console.log(`Enemies: ${telemetry?.enemies}`)
    console.log(`Mode: ${telemetry?.mode}`)
    
    expect(telemetry?.mode).toBe('canvas2d')
    expect(telemetry?.fps).toBeGreaterThan(0)
    
    await page.screenshot({ path: '/tmp/agent-browser/desktop-1920x800-fps.jpg', quality: 40, fullPage: false })
  })
  
  test('Mobile 390x844 FPS baseline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    
    await page.getByRole('button', { name: /entrar en la zona/i }).click()
    
    // Use touch controls for mobile
    const joystick = page.getByRole('group', { name: 'Joystick de movimiento' })
    const box = await joystick.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2 + 28, box.y + box.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(5000)
      await page.mouse.up()
    }
    
    const telemetry = await page.evaluate(() => window.__UG_DEBUG__)
    console.log(`\n=== Mobile 390x844 FPS Baseline ===`)
    console.log(`FPS: ${telemetry?.fps}`)
    console.log(`Frame Time: ${telemetry?.frameMs}ms`)
    console.log(`Render Scale: ${telemetry?.renderScale}`)
    console.log(`Enemies: ${telemetry?.enemies}`)
    console.log(`Mode: ${telemetry?.mode}`)
    
    expect(telemetry?.mode).toBe('canvas2d')
    expect(telemetry?.fps).toBeGreaterThan(0)
    
    await page.screenshot({ path: '/tmp/agent-browser/mobile-390x844-fps.jpg', quality: 40, fullPage: false })
  })
})
