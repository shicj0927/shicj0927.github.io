// AES-GCM 解密工具，与 main.js 保持一致
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
        ["decrypt"]
    );
}

async function decryptDatFile(arrayBuffer, password) {
    const key = await getKeyFromPassword(password);
    const iv = new Uint8Array(arrayBuffer.slice(0, 12));
    const encrypted = arrayBuffer.slice(12);
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv }, key, encrypted
        );
        return new Uint8Array(decrypted);
    } catch (e) {
        throw new Error("密钥错误或文件损坏");
    }
}

function showMsg(msg) {
    document.getElementById('msg').textContent = msg;
}

function getQueryParam(name) {
    const url = window.location.search;
    const params = new URLSearchParams(url);
    return params.get(name);
}

window.onload = function() {
    const url = getQueryParam('url');
    if (url) {
        document.getElementById('urlInput').value = decodeURIComponent(url);
    }
};

document.getElementById('downloadBtn').onclick = async function() {
    const url = document.getElementById('urlInput').value.trim();
    const password = document.getElementById('keyInput').value;
    if (!url || !password) {
        showMsg('请输入 .dat 文件的 URL 和密钥');
        return;
    }
    showMsg('下载并解密中...');
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('下载失败，状态码：' + res.status);
        const arrayBuffer = await res.arrayBuffer();
        const decrypted = await decryptDatFile(arrayBuffer, password);
        // 获取原文件名（去掉 .dat 后缀）
        let filename = 'decrypted';
        const disposition = res.headers.get('content-disposition');
        if (disposition && disposition.includes('filename=')) {
            filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
            if (filename.endsWith('.dat')) filename = filename.slice(0, -4);
        } else {
            const urlParts = url.split('/');
            filename = urlParts[urlParts.length - 1] || filename;
            if (filename.endsWith('.dat')) filename = filename.slice(0, -4);
        }
        const blob = new Blob([decrypted]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMsg('下载并解密完成：' + filename);
    } catch (e) {
        showMsg('下载或解密失败: ' + e.message);
    }
};
