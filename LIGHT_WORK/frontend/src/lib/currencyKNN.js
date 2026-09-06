// Pakistani currency recognition with zero pre-existing dataset.
//
// There's no public trained PKR-note classifier to import. Rather than stub
// this out, we use a genuinely functional few-shot approach: MobileNet (pretrained
// on ImageNet, running fully in-browser via TF.js) extracts a feature embedding for
// each video frame, and a KNN classifier is trained live from a handful of example
// shots the user (or the app's bundled seed images) provides for each denomination.
// This is the same technique behind tools like Google's Teachable Machine and needs
// no server-side training step.
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as knnClassifier from "@tensorflow-models/knn-classifier";

let net = null;
let classifier = null;

export async function loadCurrencyModel() {
  if (!net) {
    await tf.ready();
    net = await mobilenet.load({ version: 2, alpha: 1.0 });
  }
  if (!classifier) classifier = knnClassifier.create();
  return { net, classifier };
}

export async function addCurrencyExample(videoOrImg, label) {
  const { net: n, classifier: c } = await loadCurrencyModel();
  const activation = n.infer(videoOrImg, true);
  c.addExample(activation, label);
  activation.dispose();
}

export async function predictCurrency(videoOrImg) {
  const { net: n, classifier: c } = await loadCurrencyModel();
  if (c.getNumClasses() === 0) return null;
  const activation = n.infer(videoOrImg, true);
  const result = await c.predictClass(activation, 5);
  activation.dispose();
  return result; // { label, confidences: { [label]: prob } }
}

export function getExampleCounts() {
  if (!classifier) return {};
  return classifier.getClassExampleCount();
}

export function clearCurrencyExamples() {
  classifier = knnClassifier.create();
}

export const PKR_DENOMINATIONS = ["10", "20", "50", "100", "500", "1000", "5000"];
