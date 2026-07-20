import {
  ShaderMount,
  getShaderColorFromString,
  neuroNoiseFragmentShader,
} from "https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.77/+esm";

const shaderElement = document.querySelector("#shader-background");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

const shaderSpeed = 0.08;
const maxPixelCount = 1_500_000;

if (shaderElement) {
  try {
    const shaderMount = new ShaderMount(
      shaderElement,
      neuroNoiseFragmentShader,
      {
        u_colorFront: getShaderColorFromString("#67d9eb"),
        u_colorMid: getShaderColorFromString("#8e3b90"),
        u_colorBack: getShaderColorFromString("#06151b"),
        u_brightness: 0.06,
        u_contrast: 0.42,
        u_fit: 0,
        u_scale: 1.1,
        u_rotation: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_offsetX: 0,
        u_offsetY: 0,
        u_worldWidth: 0,
        u_worldHeight: 0,
      },
      {
        alpha: false,
        antialias: false,
        powerPreference: "low-power",
      },
      motionPreference.matches ? 0 : shaderSpeed,
      0,
      1,
      maxPixelCount,
    );

    const updateMotion = (event) => {
      shaderMount.setSpeed(event.matches ? 0 : shaderSpeed);
    };

    motionPreference.addEventListener("change", updateMotion);
    window.requestAnimationFrame(() => shaderElement.classList.add("is-ready"));
  } catch (error) {
    shaderElement.hidden = true;
    console.warn("Paper shader unavailable; using the image fallback.", error);
  }
}
