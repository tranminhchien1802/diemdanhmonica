import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

let loaded = false;

export const loadFaceModels = async () => {
  if (loaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  loaded = true;
};

export const getDescriptor = async (videoEl) => {
  const det = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return det ? det.descriptor : null;
};

export const getDescriptorFromImage = async (imgEl) => {
  const det = await faceapi
    .detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return det ? det.descriptor : null;
};

export const faceDistance = (a, b) => {
  if (!a || !b) return null;
  const d = a.map((v, i) => v - b[i]);
  return Math.sqrt(d.reduce((s, x) => s + x * x, 0));
};

export const distanceToPercent = (d) =>
  d == null ? 0 : Math.max(0, Math.min(100, Math.round((1 - d / 0.6) * 100)));

export const isMatch = (d) => d != null && d < 0.55;
