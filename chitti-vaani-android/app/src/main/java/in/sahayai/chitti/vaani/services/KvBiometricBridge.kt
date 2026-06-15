package `in`.sahayai.chitti.vaani.services

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.util.Base64
import android.webkit.JavascriptInterface
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import `in`.sahayai.chitti.vaani.MainActivity
import `in`.sahayai.chitti.vaani.util.AuditLog

/**
 * Chitti Keys Vault — biometric unlock bridge.
 *
 * Architecture
 * ~~~~~~~~~~~~
 * - Generates an AES-256-GCM key inside the Android Keystore under
 *   alias `chitti_keys_vault_v1`. The key carries
 *   setUserAuthenticationRequired(true) + setInvalidatedByBiometricEnrollment(true) —
 *   meaning every encrypt/decrypt op needs a fresh biometric tap, AND
 *   enrolling a new fingerprint on the device invalidates the key.
 *
 * - The wrapped passphrase + IV is stored in SharedPreferences (NOT in
 *   the Android Keystore — the Keystore holds the wrap-key, never the
 *   passphrase).
 *
 * - Decryption flow: BiometricPrompt opens, the user touches their
 *   fingerprint / shows their face, the system unwraps the Keystore
 *   key into a one-shot Cipher, the Cipher decrypts the stored
 *   passphrase, the bridge calls back into the WebView with the
 *   plaintext passphrase. The plaintext exists in JS memory only for
 *   the duration of the vault session.
 *
 * Bridge contract
 * ~~~~~~~~~~~~~~~
 * All methods return short status strings synchronously OR dispatch
 * a callback into the WebView via evaluateJavascript when the result
 * is async (BiometricPrompt is callback-based).
 *
 *   kvBiometricAvailable()
 *       -> "available" | "not_enrolled" | "no_hardware" |
 *          "hw_unavailable" | "vendor_security_update_required" |
 *          "status_unknown"
 *
 *   kvBiometricEnroll(passphraseB64, jsCallbackFnName)
 *       -> "prompt_shown" (sync); on completion, calls
 *          window[jsCallbackFnName](resultJson) via evaluateJavascript.
 *          resultJson = { ok, error?, wrapped_b64?, iv_b64? } so the
 *          web side can stash it (also stashed server-side for
 *          robustness via SharedPreferences).
 *
 *   kvBiometricUnlock(jsCallbackFnName)
 *       -> "prompt_shown" (sync); on completion, calls
 *          window[jsCallbackFnName](resultJson).
 *          resultJson = { ok, passphrase?, error?, reason? }
 *
 *   kvBiometricForget()
 *       -> "forgotten" | "no_state" — deletes the Keystore alias +
 *          wipes the SharedPreferences entries. Use when the user
 *          rotates the passphrase or disables biometric unlock.
 *
 * Threat model
 * ~~~~~~~~~~~~
 * Real biometric encryption gated by TEE — strongest option short
 * of hardware tokens. NOT a defence against:
 *   - rooted device with active malware
 *   - active adversarial OEM (rare in India market)
 *   - debugger access while the bridge is in the middle of a
 *     BiometricPrompt.AuthenticationResult callback
 *
 * Pairs with the JS-side honest threat-model tab inside the vault.
 */
class KvBiometricBridge(private val ctx: Context) {

    companion object {
        private const val KEY_ALIAS  = "chitti_keys_vault_v1"
        private const val PREFS_NAME = "chitti_keys_vault_biometric_v1"
        private const val PREF_WRAPPED = "wrapped_passphrase_b64"
        private const val PREF_IV      = "iv_b64"
        private const val GCM_TAG_BITS = 128
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    }

    private fun prefs(): SharedPreferences =
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun activity(): FragmentActivity? = ctx as? FragmentActivity

    // ── Availability check ───────────────────────────────────

    @JavascriptInterface
    fun kvBiometricAvailable(): String {
        val bm = BiometricManager.from(ctx)
        val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG
        return when (bm.canAuthenticate(authenticators)) {
            BiometricManager.BIOMETRIC_SUCCESS             -> "available"
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "not_enrolled"
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE   -> "no_hardware"
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> "hw_unavailable"
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> "vendor_security_update_required"
            else -> "status_unknown"
        }
    }

    @JavascriptInterface
    fun kvBiometricHasEnrolled(): Boolean {
        val p = prefs()
        return p.contains(PREF_WRAPPED) && p.contains(PREF_IV) && keyExists()
    }

    // ── Enroll: wrap a passphrase under the TEE key ─────────

    @JavascriptInterface
    fun kvBiometricEnroll(passphrase: String, callbackName: String): String {
        if (passphrase.isEmpty()) return jsResult(callbackName, false, error = "empty_passphrase")
        val act = activity() ?: return jsResult(callbackName, false, error = "no_activity_context")

        // Generate or replace the TEE key.
        val key = try {
            generateOrReplaceKey()
        } catch (e: Exception) {
            AuditLog.append(ctx, "kvBiometricEnroll keygen failed", e.message ?: "")
            return jsResult(callbackName, false, error = "keystore_init_failed: ${e.message}")
        }

        // Init an encrypt-mode Cipher; the user must authorise USAGE
        // via BiometricPrompt before the Cipher actually works.
        val cipher = try {
            Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key) }
        } catch (e: Exception) {
            AuditLog.append(ctx, "kvBiometricEnroll cipher init failed", e.message ?: "")
            return jsResult(callbackName, false, error = "cipher_init_failed: ${e.message}")
        }

        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Chitti — set up biometric unlock")
            .setSubtitle("Touch your fingerprint or show your face to wrap the vault passphrase under the secure enclave")
            .setNegativeButtonText("Cancel")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .setConfirmationRequired(false)
            .build()

        val prompt = BiometricPrompt(act, ContextCompat.getMainExecutor(ctx), object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                try {
                    val authedCipher = result.cryptoObject?.cipher ?: cipher
                    val ct = authedCipher.doFinal(passphrase.toByteArray(Charsets.UTF_8))
                    val iv = authedCipher.iv
                    val ctB64 = Base64.encodeToString(ct, Base64.NO_WRAP)
                    val ivB64 = Base64.encodeToString(iv, Base64.NO_WRAP)
                    prefs().edit().putString(PREF_WRAPPED, ctB64).putString(PREF_IV, ivB64).apply()
                    AuditLog.append(ctx, "kvBiometricEnroll success", "wrapped passphrase stored")
                    callJs(callbackName, """{"ok":true,"wrapped_b64":${jsString(ctB64)},"iv_b64":${jsString(ivB64)}}""")
                } catch (e: Exception) {
                    AuditLog.append(ctx, "kvBiometricEnroll wrap failed", e.message ?: "")
                    callJs(callbackName, """{"ok":false,"error":"wrap_failed: ${jsEscape(e.message ?: "")}"}""")
                }
            }
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                AuditLog.append(ctx, "kvBiometricEnroll auth error", "$errorCode · $errString")
                callJs(callbackName, """{"ok":false,"error":"auth_error_$errorCode","reason":${jsString(errString.toString())}}""")
            }
            override fun onAuthenticationFailed() {
                // Single bad fingerprint — don't terminate the prompt; BiometricPrompt keeps it open.
                AuditLog.append(ctx, "kvBiometricEnroll auth attempt failed", "wrong fingerprint")
            }
        })

        act.runOnUiThread {
            try {
                prompt.authenticate(info, BiometricPrompt.CryptoObject(cipher))
            } catch (e: Exception) {
                AuditLog.append(ctx, "kvBiometricEnroll prompt.authenticate failed", e.message ?: "")
                callJs(callbackName, """{"ok":false,"error":"prompt_failed: ${jsEscape(e.message ?: "")}"}""")
            }
        }
        return "prompt_shown"
    }

    // ── Unlock: unwrap the stored passphrase ────────────────

    @JavascriptInterface
    fun kvBiometricUnlock(callbackName: String): String {
        val act = activity() ?: return jsResult(callbackName, false, error = "no_activity_context")
        val p = prefs()
        val ctB64 = p.getString(PREF_WRAPPED, null) ?: return jsResult(callbackName, false, error = "no_enrolled_state")
        val ivB64 = p.getString(PREF_IV, null)      ?: return jsResult(callbackName, false, error = "no_enrolled_state")

        val key = try { loadKey() } catch (e: KeyPermanentlyInvalidatedException) {
            // Biometric enrolment changed on the device — the Keystore
            // auto-invalidated our key. Wipe state + ask user to re-enrol.
            AuditLog.append(ctx, "kvBiometricUnlock key invalidated", "biometric enrolment changed")
            kvBiometricForget()
            return jsResult(callbackName, false, error = "key_invalidated_reenroll_required")
        } catch (e: Exception) {
            return jsResult(callbackName, false, error = "load_key_failed: ${e.message}")
        }

        val iv = try { Base64.decode(ivB64, Base64.NO_WRAP) } catch (e: Exception) {
            return jsResult(callbackName, false, error = "bad_iv_b64")
        }
        val ct = try { Base64.decode(ctB64, Base64.NO_WRAP) } catch (e: Exception) {
            return jsResult(callbackName, false, error = "bad_ct_b64")
        }

        val cipher = try {
            Cipher.getInstance("AES/GCM/NoPadding").apply {
                init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(GCM_TAG_BITS, iv))
            }
        } catch (e: KeyPermanentlyInvalidatedException) {
            AuditLog.append(ctx, "kvBiometricUnlock cipher init invalidated", "")
            kvBiometricForget()
            return jsResult(callbackName, false, error = "key_invalidated_reenroll_required")
        } catch (e: Exception) {
            return jsResult(callbackName, false, error = "cipher_init_failed: ${e.message}")
        }

        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Chitti — unlock Keys Vault")
            .setSubtitle("Touch your fingerprint or show your face")
            .setNegativeButtonText("Use passphrase instead")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .setConfirmationRequired(false)
            .build()

        val prompt = BiometricPrompt(act, ContextCompat.getMainExecutor(ctx), object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                try {
                    val authedCipher = result.cryptoObject?.cipher ?: cipher
                    val pt = authedCipher.doFinal(ct)
                    val passphrase = String(pt, Charsets.UTF_8)
                    AuditLog.append(ctx, "kvBiometricUnlock success", "passphrase unwrapped")
                    callJs(callbackName, """{"ok":true,"passphrase":${jsString(passphrase)}}""")
                } catch (e: Exception) {
                    AuditLog.append(ctx, "kvBiometricUnlock decrypt failed", e.message ?: "")
                    callJs(callbackName, """{"ok":false,"error":"decrypt_failed: ${jsEscape(e.message ?: "")}"}""")
                }
            }
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                AuditLog.append(ctx, "kvBiometricUnlock auth error", "$errorCode · $errString")
                val reason = when (errorCode) {
                    BiometricPrompt.ERROR_NEGATIVE_BUTTON   -> "user_chose_passphrase"
                    BiometricPrompt.ERROR_USER_CANCELED     -> "user_canceled"
                    BiometricPrompt.ERROR_LOCKOUT,
                    BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "lockout"
                    else -> "auth_error_$errorCode"
                }
                callJs(callbackName, """{"ok":false,"error":${jsString(reason)},"reason":${jsString(errString.toString())}}""")
            }
            override fun onAuthenticationFailed() {
                AuditLog.append(ctx, "kvBiometricUnlock attempt failed", "wrong biometric")
            }
        })

        act.runOnUiThread {
            try {
                prompt.authenticate(info, BiometricPrompt.CryptoObject(cipher))
            } catch (e: Exception) {
                AuditLog.append(ctx, "kvBiometricUnlock prompt.authenticate failed", e.message ?: "")
                callJs(callbackName, """{"ok":false,"error":"prompt_failed: ${jsEscape(e.message ?: "")}"}""")
            }
        }
        return "prompt_shown"
    }

    // ── Forget: wipe TEE key + stored wrap ──────────────────

    @JavascriptInterface
    fun kvBiometricForget(): String {
        var didSomething = false
        try {
            val ks = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
            if (ks.containsAlias(KEY_ALIAS)) { ks.deleteEntry(KEY_ALIAS); didSomething = true }
        } catch (e: Exception) {
            AuditLog.append(ctx, "kvBiometricForget keystore delete failed", e.message ?: "")
        }
        val p = prefs()
        if (p.contains(PREF_WRAPPED) || p.contains(PREF_IV)) {
            p.edit().remove(PREF_WRAPPED).remove(PREF_IV).apply()
            didSomething = true
        }
        AuditLog.append(ctx, "kvBiometricForget", if (didSomething) "state wiped" else "no_state")
        return if (didSomething) "forgotten" else "no_state"
    }

    // ── Keystore key plumbing ───────────────────────────────

    private fun keyExists(): Boolean {
        return try {
            val ks = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
            ks.containsAlias(KEY_ALIAS)
        } catch (e: Exception) { false }
    }

    private fun loadKey(): SecretKey {
        val ks = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val entry = ks.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry
            ?: throw IllegalStateException("Key $KEY_ALIAS missing")
        return entry.secretKey
    }

    private fun generateOrReplaceKey(): SecretKey {
        val ks = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        if (ks.containsAlias(KEY_ALIAS)) ks.deleteEntry(KEY_ALIAS)
        val kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        val spec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setUserAuthenticationRequired(true)
            .setInvalidatedByBiometricEnrollment(true)
            .apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    // Constrain auth specifically to BIOMETRIC_STRONG class on Android 11+.
                    setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
                }
            }
            .build()
        kg.init(spec)
        return kg.generateKey()
    }

    // ── JS callback plumbing ────────────────────────────────

    private fun callJs(callbackName: String, jsonResult: String) {
        val safe = callbackName.replace(Regex("[^A-Za-z0-9_]"), "")
        if (safe.isEmpty()) return
        val act = activity() ?: return
        val script = "try { if (typeof window.$safe === 'function') window.$safe($jsonResult); } catch (e) {}"
        act.runOnUiThread {
            (act as? MainActivity)?.evaluateJavascriptOnWeb(script)
        }
    }

    private fun jsResult(callbackName: String, ok: Boolean, error: String? = null): String {
        callJs(callbackName, """{"ok":$ok${if (error != null) ",\"error\":${jsString(error)}" else ""}}""")
        return "prompt_shown"
    }

    private fun jsString(s: String): String = "\"" + jsEscape(s) + "\""
    private fun jsEscape(s: String): String = s
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
}
