import tensorflow as tf
import sys

# Usage: python convert_to_tflite.py model.keras output.tflite

if len(sys.argv) < 3:
    print("Usage: python convert_to_tflite.py <model.keras> <output.tflite>")
    sys.exit(1)

keras_path = sys.argv[1]
output_path = sys.argv[2]

print(f"Loading Keras model from {keras_path}")
model = tf.keras.models.load_model(keras_path)

converter = tf.lite.TFLiteConverter.from_keras_model(model)
# Recommended optimizations for mobile
converter.optimizations = [tf.lite.Optimize.DEFAULT]
# You can enable float16 quantization for smaller models (optional)
# converter.target_spec.supported_types = [tf.float16]

print("Converting to TFLite...")
tflite_model = converter.convert()

with open(output_path, "wb") as f:
    f.write(tflite_model)

print(f"Saved TFLite model to {output_path}")
