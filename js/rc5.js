/**
 * RC5 Encryption Algorithm Implementation
 * 
 * RC5 is a symmetric block cipher designed by Ron Rivest
 * This implementation uses 32-bit words, 12 rounds, and variable key length
 */

class RC5 {
    constructor(key) {
        if (typeof key === 'string') {
            this.key = new TextEncoder().encode(key);
        } else {
            this.key = key;
        }
        
        // RC5 parameters
        this.w = 32; // word size in bits
        this.r = 12; // number of rounds
        this.b = this.key.length; // key length in bytes
        this.t = 2 * (this.r + 1); // size of table S
        
        // Magic constants for RC5-32
        this.P = 0xB7E15163;
        this.Q = 0x9E3779B9;
        
        // Initialize the key schedule
        this.S = this.keySchedule();
    }

    // Key schedule algorithm
    keySchedule() {
        const S = new Array(this.t);
        const L = new Array(Math.ceil(this.b / 4));
        
        // Initialize L array from key
        for (let i = 0; i < Math.ceil(this.b / 4); i++) {
            L[i] = 0;
            for (let j = 0; j < 4 && (4 * i + j) < this.b; j++) {
                L[i] |= (this.key[4 * i + j] << (8 * j));
            }
        }
        
        // Initialize S array
        S[0] = this.P;
        for (let i = 1; i < this.t; i++) {
            S[i] = this.add32(S[i - 1], this.Q);
        }
        
        // Mix key into S
        let A = 0, B = 0, i = 0, j = 0;
        const v = 3 * Math.max(this.t, L.length);
        
        for (let k = 0; k < v; k++) {
            A = S[i] = this.rotateLeft(this.add32(this.add32(S[i], A), B), 3);
            B = L[j] = this.rotateLeft(this.add32(this.add32(L[j], A), B), this.add32(A, B) & 31);
            i = (i + 1) % this.t;
            j = (j + 1) % L.length;
        }
        
        return S;
    }

    // 32-bit addition with overflow handling
    add32(a, b) {
        return (a + b) >>> 0;
    }

    // Left rotation
    rotateLeft(value, amount) {
        amount = amount & 31;
        return ((value << amount) | (value >>> (32 - amount))) >>> 0;
    }

    // Right rotation
    rotateRight(value, amount) {
        amount = amount & 31;
        return ((value >>> amount) | (value << (32 - amount))) >>> 0;
    }

    // Encrypt a 64-bit block (two 32-bit words)
    encryptBlock(A, B) {
        A = this.add32(A, this.S[0]);
        B = this.add32(B, this.S[1]);
        
        for (let i = 1; i <= this.r; i++) {
            A = this.add32(this.rotateLeft(A ^ B, B & 31), this.S[2 * i]);
            B = this.add32(this.rotateLeft(B ^ A, A & 31), this.S[2 * i + 1]);
        }
        
        return [A >>> 0, B >>> 0];
    }

    // Decrypt a 64-bit block (two 32-bit words)
    decryptBlock(A, B) {
        for (let i = this.r; i >= 1; i--) {
            B = this.rotateRight(this.add32(B, -this.S[2 * i + 1]), A & 31) ^ A;
            A = this.rotateRight(this.add32(A, -this.S[2 * i]), B & 31) ^ B;
        }
        
        B = this.add32(B, -this.S[1]);
        A = this.add32(A, -this.S[0]);
        
        return [A >>> 0, B >>> 0];
    }

    // Convert string to bytes
    stringToBytes(str) {
        return new TextEncoder().encode(str);
    }

    // Convert bytes to string
    bytesToString(bytes) {
        return new TextDecoder().decode(bytes);
    }

    // Convert bytes to 32-bit words
    bytesToWords(bytes) {
        const words = [];
        for (let i = 0; i < bytes.length; i += 4) {
            let word = 0;
            for (let j = 0; j < 4 && i + j < bytes.length; j++) {
                word |= (bytes[i + j] << (8 * j));
            }
            words.push(word >>> 0);
        }
        return words;
    }

    // Convert 32-bit words to bytes
    wordsToBytes(words) {
        const bytes = [];
        for (const word of words) {
            for (let i = 0; i < 4; i++) {
                bytes.push((word >>> (8 * i)) & 0xFF);
            }
        }
        return new Uint8Array(bytes);
    }

    // PKCS7 padding
    addPadding(bytes, blockSize = 8) {
        const padding = blockSize - (bytes.length % blockSize);
        const padded = new Uint8Array(bytes.length + padding);
        padded.set(bytes);
        for (let i = bytes.length; i < padded.length; i++) {
            padded[i] = padding;
        }
        return padded;
    }

    // Remove PKCS7 padding
    removePadding(bytes) {
        if (bytes.length === 0) return bytes;
        const padding = bytes[bytes.length - 1];
        if (padding > 8 || padding === 0) return bytes;
        
        // Verify padding
        for (let i = bytes.length - padding; i < bytes.length; i++) {
            if (bytes[i] !== padding) return bytes;
        }
        
        return bytes.slice(0, bytes.length - padding);
    }

    // Encrypt string
    encrypt(plaintext) {
        if (!plaintext || plaintext.length === 0) {
            return '';
        }

        try {
            const bytes = this.stringToBytes(plaintext);
            const paddedBytes = this.addPadding(bytes);
            const words = this.bytesToWords(paddedBytes);
            const encryptedWords = [];

            // Encrypt in 64-bit blocks (2 words)
            for (let i = 0; i < words.length; i += 2) {
                const A = words[i] || 0;
                const B = words[i + 1] || 0;
                const [encA, encB] = this.encryptBlock(A, B);
                encryptedWords.push(encA, encB);
            }

            const encryptedBytes = this.wordsToBytes(encryptedWords);
            
            // Convert to base64 for safe transport
            return btoa(String.fromCharCode(...encryptedBytes));
        } catch (error) {
            return plaintext; // Return original on error
        }
    }

    // Decrypt string
    decrypt(ciphertext) {
        if (!ciphertext || ciphertext.length === 0) {
            return '';
        }

        try {
            // Convert from base64
            const encryptedBytes = new Uint8Array(
                atob(ciphertext).split('').map(char => char.charCodeAt(0))
            );
            
            const words = this.bytesToWords(encryptedBytes);
            const decryptedWords = [];

            // Decrypt in 64-bit blocks (2 words)
            for (let i = 0; i < words.length; i += 2) {
                const A = words[i] || 0;
                const B = words[i + 1] || 0;
                const [decA, decB] = this.decryptBlock(A, B);
                decryptedWords.push(decA, decB);
            }

            const decryptedBytes = this.wordsToBytes(decryptedWords);
            const unpaddedBytes = this.removePadding(decryptedBytes);
            
            return this.bytesToString(unpaddedBytes);
        } catch (error) {
            return ciphertext; // Return original on error
        }
    }
}

// Utility class for medical data encryption
class MedicalDataCrypto {
    constructor() {
        // Use a default key - in production, this should be more secure
        this.defaultKey = 'medic-secret-key-2025';
        this.rc5 = new RC5(this.defaultKey);
    }

    // Fields that should be encrypted
    getEncryptableFields() {
        return [
            'nama',
            'alamat',
            'nomor_hp',
            'keluhan',
            'diagnosa',
            'tindakan',
            'resep_obat',
            'dokter_penanggung_jawab'
        ];
    }

    // Encrypt medical data object
    encryptData(data) {
        const encryptedData = { ...data };
        const encryptableFields = this.getEncryptableFields();

        encryptableFields.forEach(field => {
            if (encryptedData[field] && typeof encryptedData[field] === 'string') {
                encryptedData[field] = this.rc5.encrypt(encryptedData[field]);
            }
        });

        return encryptedData;
    }

    // Decrypt medical data object
    decryptData(data) {
        const decryptedData = { ...data };
        const encryptableFields = this.getEncryptableFields();

        encryptableFields.forEach(field => {
            if (decryptedData[field] && typeof decryptedData[field] === 'string') {
                decryptedData[field] = this.rc5.decrypt(decryptedData[field]);
            }
        });

        return decryptedData;
    }

    // Decrypt array of medical data
    decryptDataArray(dataArray) {
        if (!Array.isArray(dataArray)) {
            return dataArray;
        }

        return dataArray.map(item => this.decryptData(item));
    }


}

// Export for global use
window.RC5 = RC5;
window.MedicalDataCrypto = MedicalDataCrypto;
