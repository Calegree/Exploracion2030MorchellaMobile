package com.morchellapp.ml

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.DataType

class MorchellaClassifier(context: Context) {

    private val model = TFLiteModel(context)

    /**
     * Run inference and return raw output as 1D FloatArray
     */
    fun predictRaw(bitmap: Bitmap): FloatArray {
        val input = ImageProcessorUtil.preprocess(bitmap)

        val interpreter = model.interpreter

        // determine output shape
        val outputTensor = interpreter.getOutputTensor(0)
        val shape = outputTensor.shape() // e.g. [1,2]
        val outSize = if (shape.size >= 2) shape[1] else shape[0]

        // prepare output array matching expected shape (Array(1){FloatArray(outSize)})
        val output = Array(1) { FloatArray(outSize) }

        interpreter.run(input.buffer, output)

        // flatten
        return output[0]
    }
}
