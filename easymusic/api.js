async function APIneGetUrl(id, br) {
    const apiRes = await fetch(
        "https://music-api.gdstudio.xyz/api.php?types=url&id="
        + id + "&source=netease&br=" + br
    );
    if (apiRes.status !== 200) {
        throw new Error("解析失败，状态码：" + apiRes.status);
    }
    console.log("API响应:", apiRes);
    const data = await apiRes.json();
    console.log("API数据:", data);
    return data.url;
}

async function APIkwGetUrl(id, br) { }