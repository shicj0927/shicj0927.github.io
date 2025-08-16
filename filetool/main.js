// AES 加解密工具，文件处理和下载逻辑
async function getKeyFromPassword(password) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), {name: "PBKDF2"}, false, ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("webfile-aes-salt"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptFile(file, password) {
    const key = await getKeyFromPassword(password);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const data = await file.arrayBuffer();
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, key, data
    );
    // 拼接 IV + 加密数据
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    return result;
}

async function decryptFile(file, password) {
    const key = await getKeyFromPassword(password);
    const data = await file.arrayBuffer();
    const iv = new Uint8Array(data.slice(0, 12));
    const encrypted = data.slice(12);
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv }, key, encrypted
        );
        return new Uint8Array(decrypted);
    } catch (e) {
        throw new Error("密钥错误或文件损坏");
    }
}

function downloadFile(data, filename) {
    const blob = new Blob([data]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showMsg(msg) {
    document.getElementById('msg').textContent = msg;
}

document.getElementById('encryptBtn').onclick = async function() {
    const fileInput = document.getElementById('encryptFile');
    const keyInput = document.getElementById('encryptKey');
    if (!fileInput.files[0] || !keyInput.value) {
        showMsg('请选择文件并输入密钥');
        return;
    }
    showMsg('加密中...');
    try {
        const file = fileInput.files[0];
        const encrypted = await encryptFile(file, keyInput.value);
        // 文件名加 .dat 后缀
        const parts = file.name.split('.');
        let newName = file.name + '.dat';
        if (parts.length > 1) {
            newName = parts.slice(0, -1).join('.') + '.' + parts.slice(-1) + '.dat';
        }
        downloadFile(encrypted, newName);
        showMsg('加密完成，已下载');
    } catch (e) {
        showMsg('加密失败: ' + e.message);
    }
};

document.getElementById('decryptBtn').onclick = async function() {
    const fileInput = document.getElementById('decryptFile');
    const keyInput = document.getElementById('decryptKey');
    if (!fileInput.files[0] || !keyInput.value) {
        showMsg('请选择加密文件并输入密钥');
        return;
    }
    showMsg('解密中...');
    try {
        const file = fileInput.files[0];
        const decrypted = await decryptFile(file, keyInput.value);
        // 去掉 .dat 后缀
        let newName = file.name;
        if (newName.endsWith('.dat')) {
            newName = newName.slice(0, -4);
        }
        downloadFile(decrypted, newName);
        showMsg('解密完成，已下载');
    } catch (e) {
        showMsg('解密失败: ' + e.message);
    }
};
