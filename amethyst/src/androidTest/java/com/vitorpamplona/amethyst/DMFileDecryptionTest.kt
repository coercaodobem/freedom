/*
 * Copyright (c) 2025 Vitor Pamplona
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
package com.vitorpamplona.amethyst

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.vitorpamplona.amethyst.commons.service.http.EncryptedBlobInterceptor
import com.vitorpamplona.amethyst.commons.service.http.EncryptionKeyCache
import com.vitorpamplona.crypto.aes.AESGCM
import io.mockk.every
import io.mockk.firstArg
import io.mockk.mockk
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DMFileDecryptionTest {
    @Test
    fun decryptsEncryptedVideoLocallyAndRemovesRangeHeader() {
        val plaintext = ByteArray(8_192) { (it % 251).toByte() }
        val cipher = AESGCM()
        val encrypted = cipher.encrypt(plaintext)
        val url = "http://example.test/encrypted-video.mp4"
        val keyCache = EncryptionKeyCache().apply {
            add(url, cipher, "video/mp4")
        }
        val request = Request.Builder()
            .url(url)
            .header("Range", "bytes=0-1023")
            .get()
            .build()
        val encryptedResponse = Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(200)
            .message("OK")
            .body(encrypted.toResponseBody("application/octet-stream".toMediaType()))
            .build()

        var requestSeen: Request? = null
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns request
        every { chain.proceed(any()) } answers {
            requestSeen = firstArg<Request>()
            encryptedResponse.newBuilder().request(requestSeen!!).build()
        }

        val response = EncryptedBlobInterceptor(keyCache).intercept(chain)
        response.use {
            assertArrayEquals(plaintext, it.body.bytes())
            assertEquals("video/mp4", it.body.contentType().toString())
            assertEquals(plaintext.size.toString(), it.header("content-length"))
        }
        assertNull(requestSeen?.header("Range"))
    }
}
