package com.morchellapp.ml

import android.content.Context
import org.tensorflow.lite.Interpreter
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

class TFLiteModel(context: Context) {

    val interpreter: Interpreter

    init {
        val options = Interpreter.Options()
        interpreter = Interpreter(loadModelFile(context), options)
    }

    private fun loadModelFile(context: Context): MappedByteBuffer {
        val desiredName = "morchella_mobilenetv2.tflite"

        try {
            val fd = context.assets.openFd(desiredName)
            val inputStream = FileInputStream(fd.fileDescriptor)
            val fileChannel = inputStream.channel
            return fileChannel.map(FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength)
        } catch (e: Exception) {
            // try to find any .tflite in assets as fallback
            try {
                val list = context.assets.list("") ?: arrayOf()
                val candidate = list.firstOrNull { it.endsWith(".tflite") }
                if (candidate != null) {
                    // copy to cache and load
                    val outFile = File(context.cacheDir, candidate)
                    context.assets.open(candidate).use { input ->
                        FileOutputStream(outFile).use { output ->
                            input.copyTo(output)
                        }
                    }
                    val inputStream = FileInputStream(outFile)
                    val fileChannel = inputStream.channel
                    return fileChannel.map(FileChannel.MapMode.READ_ONLY, 0, fileChannel.size())
                } else {
                    throw RuntimeException("No .tflite model found in assets")
                }
            } catch (ex: Exception) {
                throw RuntimeException("Failed to load TFLite model", ex)
            }
        }
    }
}
