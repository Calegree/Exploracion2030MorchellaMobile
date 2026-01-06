package com.morchellapp.native

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import java.nio.ByteBuffer
import java.nio.ByteOrder

class MorchellaModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private var interpreter: Interpreter? = null
  private var labels: List<String>? = null

  override fun getName(): String {
    return "MorchellaClassifier"
  }

  private fun ensureLoaded() {
    if (interpreter == null) {
      val model = FileUtil.loadMappedFile(reactApplicationContext, "morchella_classifier_small.tflite")
      interpreter = Interpreter(model)
    }
    if (labels == null) {
      labels = FileUtil.loadLabels(reactApplicationContext, "labels.txt")
    }
  }

  @ReactMethod
  fun classify(imageUri: String, promise: Promise) {
    try {
      ensureLoaded()

      // Load image from URI
      val uri = Uri.parse(imageUri)
      val stream = reactApplicationContext.contentResolver.openInputStream(uri)
      if (stream == null) throw Exception("Unable to open image stream")
      val bmp = BitmapFactory.decodeStream(stream)
      val resized = Bitmap.createScaledBitmap(bmp, 224, 224, true)

      // Prepare input buffer (1,224,224,3) float32 normalized /255.0
      val inputBuffer = ByteBuffer.allocateDirect(4 * 1 * 224 * 224 * 3)
      inputBuffer.order(ByteOrder.nativeOrder())
      val intValues = IntArray(224 * 224)
      resized.getPixels(intValues, 0, 224, 0, 0, 224, 224)
      var pixel = 0
      for (i in 0 until 224) {
        for (j in 0 until 224) {
          val `val` = intValues[pixel++] // ARGB
          val r = ((`val` shr 16) and 0xFF).toFloat() / 255.0f
          val g = ((`val` shr 8) and 0xFF).toFloat() / 255.0f
          val b = ((`val`) and 0xFF).toFloat() / 255.0f
          inputBuffer.putFloat(r)
          inputBuffer.putFloat(g)
          inputBuffer.putFloat(b)
        }
      }
      inputBuffer.rewind()

      // Prepare output buffer according to model's output shape
      val outTensor = interpreter!!.getOutputTensor(0)
      val outShape = outTensor.shape() // e.g., [1,2] or [1,1]
      val outDim = if (outShape.size >= 2) outShape[1] else 1
      val output = Array(1) { FloatArray(outDim) }

      interpreter!!.run(inputBuffer, output)

      // Flatten raw output
      val raw = FloatArray(outDim)
      for (i in 0 until outDim) raw[i] = output[0][i]

      // Determine probabilities
      val probMorchella: Float
      val probNoMorchella: Float
      if (outDim == 1) {
        val p = raw[0]
        probMorchella = p
        probNoMorchella = 1.0f - p
      } else {
        // assume index 0 -> no_morchella, index1 -> morchella or use labels order
        // We'll assume labels order matches output order
        // if labels size matches, map accordingly
        // Here we consider index corresponding to labels list
        // compute normalized probs if not already
        var sum = 0.0f
        for (v in raw) sum += v
        if (sum == 0.0f) sum = 1.0f
        // assume morchella is at index 1 if labels has it, else take max
        probMorchella = if (raw.size > 1) raw[1] / sum else raw[0] / sum
        probNoMorchella = if (raw.size > 0) raw[0] / sum else 1.0f - probMorchella
      }

      // Predicted index and label
      val predictedIndex: Int = if (outDim == 1) {
        if (probMorchella >= probNoMorchella) 1 else 0
      } else {
        var maxIdx = 0
        var maxVal = raw[0]
        for (i in 1 until raw.size) {
          if (raw[i] > maxVal) { maxVal = raw[i]; maxIdx = i }
        }
        maxIdx
      }

      val lbls = labels ?: listOf("no_morchella", "morchella")
      val predictedLabel = if (predictedIndex in lbls.indices) lbls[predictedIndex] else lbls.last()

      val confidence = maxOf(probMorchella, probNoMorchella)

      // Build result map
      val map = Arguments.createMap()
      val rawArr = Arguments.createArray()
      for (v in raw) rawArr.pushDouble(v.toDouble())
      map.putArray("raw_output", rawArr)
      map.putDouble("prob_morchella", probMorchella.toDouble())
      map.putDouble("prob_no_morchella", probNoMorchella.toDouble())
      map.putInt("predicted_index", predictedIndex)
      map.putString("predicted_label", predictedLabel)
      map.putDouble("confidence", confidence.toDouble())
      val printed = Arguments.createArray()
      printed.pushString("Input resized to 224x224 and normalized")
      printed.pushString("Model inference completed")
      map.putArray("printed_lines", printed)

      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("MODEL_ERROR", e.message ?: "Unknown error")
    }
  }
}

