import {
  ShaderMount,
  getShaderColorFromString,
  staticMeshGradientFragmentShader,
} from "https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.77/+esm";

const shaderElement = document.querySelector("#shader-background");
const maxPixelCount = 1_500_000;

if (shaderElement) {
  try {
    const colors = [
      "#020507",
      "#071017",
      "#0d1d27",
      "#24172f",
      "#102b31",
    ].map(getShaderColorFromString);

    new ShaderMount(
      shaderElement,
      staticMeshGradientFragmentShader,
      {
        u_colors: colors,
        u_colorsCount: colors.length,
        u_positions: 38,
        u_waveX: 0.42,
        u_waveXShift: 0.18,
        u_waveY: 0.34,
        u_waveYShift: 0.66,
        u_mixing: 0.9,
        u_grainMixer: 0.2,
        u_grainOverlay: 0.18,
        u_fit: 0,
        u_scale: 1,
        u_rotation: 315,
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
      0,
      0,
      1,
      maxPixelCount,
    );

    window.requestAnimationFrame(() => shaderElement.classList.add("is-ready"));
  } catch (error) {
    shaderElement.hidden = true;
    console.warn("Paper shader unavailable; using the image fallback.", error);
  }
}
