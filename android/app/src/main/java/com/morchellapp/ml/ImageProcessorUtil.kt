package com.morchellapp.ml

import android.graphics.Bitmap
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp

object ImageProcessorUtil {

    fun preprocess(bitmap: Bitmap): TensorImage {
        val tensorImage = TensorImage.fromBitmap(bitmap)

        val processor = ImageProcessor.Builder()
            .add(ResizeOp(224, 224, ResizeOp.ResizeMethod.BILINEAR))
            .build()

        return processor.process(tensorImage)
    }
}
