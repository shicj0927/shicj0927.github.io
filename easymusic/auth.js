username = ""
password = ""
nickname = ""
loginedIn = false
authSystemOK = true
cliend = null

try {
    client = supabase.createClient(
        'https://gngbchriiumgcjaahjsf.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZ2JjaHJpaXVtZ2NqYWFoanNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzk2MDMsImV4cCI6MjA5MDM1NTYwM30.QzRcXza84MAL5WN6v4KE5-6La_EgH4NnCRSQqm9a7FE'
    )
} catch (e) {
    console.error("Supabase初始化失败，无法使用在线登录功能", e);
    authSystemOK = false;
}

function writeCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function readCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

if (authSystemOK) {
    // 尝试从cookie中读取登录状态
    const savedUsername = readCookie("username");
    const savedPassword = readCookie("password");
    if (savedUsername && savedPassword) {
        login(savedUsername, savedPassword);
        username = savedUsername;
        password = savedPassword;
    }
}

function login(username, password) {
    if (!authSystemOK) {
        alert("登录系统不可用，请稍后再试");
        return;
    }
    client.auth.signInWithPassword({ email: username, password: password }).then(async ({ data, error }) => {
        if (error) {
            alert("登录失败：" + error.message);
        } else {
            loginedIn = true;
            username = data.user.email;
            document.getElementById("username-btn").innerText = username;
            document.getElementById("user-btn").innerText = "登出";
            document.getElementById("user-btn").style.color = "red";
            writeCookie("username", username, 7);
            writeCookie("password", password, 7);
            hideModal('login-modal');
            if ((await ODBRead()) == null) {
                // 新用户，初始化数据
                showModal('set-nickname-modal');
                return true;
            }
            document.getElementById("wait-content").innerHTML = "正在同步数据……";
            showModal("wait-modal");
            checkResult = await ODBcheckData();
            if (checkResult == "included") {
                // document.getElementById("wait-content").innerHTML = "正在同步数据……";
                // showModal("wait-modal");
                try {
                    data = await ODBRead();
                    await DBoverwriteSettings(data.settings);
                    await DBoverwriteSongLists(data.songlists);
                    await DBoverwriteSongs(data.songdatas);
                    await load_song_lists();
                    await auto_load_list_detail();
                }
                catch (err) {
                    alert("同步失败：", err)
                    logout();
                }
            }
            else if (checkResult == "diff") {
                if (confirm("服务器上的数据和本地数据不一致，是否覆盖本地数据？（在下一个询问中可以选择上传本地数据）")) {
                    document.getElementById("wait-content").innerHTML = "正在同步数据……";
                    showModal("wait-modal");
                    try {
                        data = await ODBRead();
                        await DBoverwriteSettings(data.settings);
                        await DBoverwriteSongLists(data.songlists);
                        await DBoverwriteSongs(data.songdatas);
                        await load_song_lists();
                        await auto_load_list_detail();
                    }
                    catch (err) {
                        alert("同步失败：", err)
                        logout();
                    }
                }
                else if (confirm("是否将本地数据覆盖到服务器？")) {
                    document.getElementById("wait-content").innerHTML = "正在同步数据……";
                    showModal("wait-modal");
                    try {
                        await ODBWrite(ODBGetLocalData());
                    }
                    catch (err) {
                        alert("同步失败：", err)
                        logout();
                    }
                }
                else {
                    logout();
                }
            }
            hideModal("wait-modal");
            nickname = (await ODBRead()).userdata.nickname || "";
            if (nickname != "") {
                document.getElementById("username-btn").innerText = nickname;
            }
            return true;
        }
    });
    return false;
}

let syncing = false;

async function setNickname() {
    if (!authSystemOK) {
        alert("系统不可用，请稍后再试");
        return;
    }
    if (syncing) return;
    syncing = true;
    document.getElementById("wait-content").innerHTML = "正在同步数据……";
    showModal("wait-modal");
    try {
        await ODBRegInit();
    }
    catch (err) {
        alert("同步失败：", err)
        logout();
    }
    finally {
        syncing = false;
    }
    hideModal("wait-modal");
    // nickname = (await ODBGetLocalData()).userdata.nickname || "";
    if (nickname != "") {
        document.getElementById("username-btn").innerText = nickname;
    }
}

function logout() {
    if (!authSystemOK) {
        alert("登录系统不可用，请稍后再试");
        return;
    }
    client.auth.signOut().then(({ error }) => {
        if (error) {
            alert("登出失败：" + error.message);
        } else {
            loginedIn = false;
            username = "";
            document.getElementById("username-btn").innerText = "未登录";
            document.getElementById("user-btn").innerText = "登录";
            document.getElementById("user-btn").style.color = "green";
            deleteCookie("username");
            deleteCookie("password");
        }
    });
}

function register(username, password) {
    if (!authSystemOK) {
        alert("注册系统不可用，请稍后再试");
        return;
    }
    client.auth.signUp({ email: username, password: password }).then(({ data, error }) => {
        if (error) {
            alert("注册失败：" + error.message);
        } else {
            alert("注册成功，请前往邮箱验证后登录");
            hideModal('reg-modal');
        }
    });
}

const btn_login = document.getElementById("login-ok-btn");

btn_login.addEventListener('click', () => {
    username = document.getElementById("login-username").value;
    password = document.getElementById("login-password").value;
    login(username, password);
});

document.getElementById("reg-ok-btn").addEventListener('click', () => {
    username = document.getElementById("reg-username").value;
    password = document.getElementById("reg-password").value;
    // nickname = document.getElementById("reg-nickname").value;
    register(username, password);
});

// document.getElementById("set-nickname-ok-btn").addEventListener('click', async () => {
//     nickname = document.getElementById("set-nickname").value;
//     await setNickname();
//     hideModal('set-nickname-modal');
// });

const btn_setnickname = document.getElementById("set-nickname-ok-btn");

btn_setnickname.addEventListener('click', async () => {
    btn_setnickname.disabled = true;
    try {
        nickname = document.getElementById("set-nickname").value;
        await setNickname();
        hideModal('set-nickname-modal');
    } finally {
        btn_setnickname.disabled = false;
    }
});

function resetPassword(old_password, new_password, repeat_password) {
    console.log(old_password, password)
    if (!authSystemOK) {
        alert("系统不可用，请稍后再试");
        return;
    }
    if (old_password !== password) {
        alert("旧密码错误");
        return;
    }
    if (new_password !== repeat_password) {
        alert("新密码和确认密码不匹配");
        return;
    }
    client.auth.updateUser({
        password: new_password
    }).then(({ data, error }) => {
        if (error) {
            alert("修改密码失败：" + error.message);
        } else {
            alert("修改密码成功");
            password = new_password;
            deleteCookie("password");
            writeCookie("password", password, 7);
            hideModal('reset-password-modal');
        }
    });
}

document.getElementById("reset-ok-btn").addEventListener('click', () => {
    const old_password = document.getElementById("reset-old-password").value;
    const new_password = document.getElementById("reset-new-password").value;
    const repeat_password = document.getElementById("reset-confirm-password").value;
    resetPassword(old_password, new_password, repeat_password);
});