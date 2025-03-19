import * as THREE from "three"
import Stats from "stats.js"
import { GUI } from "lil-gui"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Timer } from "three/addons/misc/Timer.js"
import "./style.css"

/*
 * Scene, Camera & Controls
 */

const canvas = {
  width: innerWidth,
  height: innerHeight,
  dom: document.getElementById("webgl"),
}
canvas.aspect = canvas.width / canvas.height

const scene = new THREE.Scene()
// scene.add(new THREE.AxesHelper(1))

const camera = new THREE.PerspectiveCamera(75, canvas.aspect, 0.1, 100)
scene.add(camera)
camera.position.set(2, 2, 2)

const controls = new OrbitControls(camera, canvas.dom)
controls.enableDamping = true

/*
 * Galaxy generator
 */
const gui = new GUI().close()
const parameters = {
  count: 1_00_000,
  size: 0.01,
  radius: 5,
  branches: 3,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  colorInside: "#ff6030",
  colorOutside: "#1b3984",
}

//#region Debug
gui
  .add(parameters, "count")
  .min(100)
  .max(1_000_000)
  .step(1)
  .onFinishChange(generateGalaxy)

gui
  .add(parameters, "size")
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .onFinishChange(generateGalaxy)

gui
  .add(parameters, "radius")
  .min(1)
  .max(20)
  .step(0.001)
  .onFinishChange(generateGalaxy)

gui
  .add(parameters, "branches")
  .min(2)
  .max(20)
  .step(1)
  .onFinishChange(generateGalaxy)

gui
  .add(parameters, "spin")
  .min(-5)
  .max(5)
  .step(0.001)
  .onFinishChange(generateGalaxy)

gui
  .add(parameters, "randomness")
  .min(0)
  .max(2)
  .step(0.001)
  .onFinishChange(generateGalaxy)

gui
  .add(parameters, "randomnessPower")
  .min(1)
  .max(10)
  .step(0.001)
  .onFinishChange(generateGalaxy)

gui.addColor(parameters, "colorInside").onFinishChange(generateGalaxy)

gui.addColor(parameters, "colorOutside").onFinishChange(generateGalaxy)
//#endregion

let geometry = null,
  material = null,
  galaxy = null

function generateGalaxy() {
  // clear canvas
  if (galaxy) {
    geometry.dispose()
    material.dispose()
    scene.remove(galaxy)
  }

  // geometry
  geometry = new THREE.BufferGeometry()

  const positions = new Float32Array(parameters.count * 3)
  const colors = new Float32Array(parameters.count * 3)
  const colorInside = new THREE.Color(parameters.colorInside)
  const colorOutside = new THREE.Color(parameters.colorOutside)

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3
    const rad = Math.random() * parameters.radius
    const spinAngle = rad * parameters.spin
    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * 2 * Math.PI

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? -1 : 1)
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? -1 : 1)
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? -1 : 1)

    positions[i3] = Math.cos(branchAngle + spinAngle) * rad + randomX // x
    positions[i3 + 1] = randomY
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * rad + randomZ // z

    const mixColor = colorInside.clone()
    mixColor.lerp(colorOutside, rad / parameters.radius)

    colors[i3] = mixColor.r
    colors[i3 + 1] = mixColor.g
    colors[i3 + 2] = mixColor.b
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

  // material
  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: true,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  })

  galaxy = new THREE.Points(geometry, material)
  scene.add(galaxy)
}

generateGalaxy()

/*
 * Renderer & Animation
 */

const renderer = new THREE.WebGLRenderer({
  canvas: canvas.dom,
})
renderer.setSize(canvas.width, canvas.height)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

const timer = new Timer()

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

renderer.setAnimationLoop((ts) => {
  stats.begin()
  timer.update(ts) //! timer need update

  const _delta = timer.getDelta()

  galaxy.rotation.y += _delta * 0.1

  controls.update()
  renderer.render(scene, camera)
  stats.end()
})

/*
 * Resize & Fullscreen
 */

window.addEventListener("resize", (_) => {
  canvas.width = innerWidth
  canvas.height = innerHeight
  canvas.aspect = canvas.width / canvas.height

  camera.aspect = canvas.aspect
  camera.updateProjectionMatrix()

  renderer.setSize(canvas.width, canvas.height)
  renderer.setPixelRatio(Math.min(2, devicePixelRatio))
})

window.addEventListener("dblclick", () => {
  if (canvas.dom.requestFullscreen)
    document.fullscreenElement
      ? document.exitFullscreen()
      : canvas.dom.requestFullscreen()

  if (canvas.dom.requestWebkitFullscreen)
    document.webkitFullscreenElement
      ? document.exitWebkitFullscreen()
      : canvas.dom.requestWebkitFullscreen()
})
