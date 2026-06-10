//数据库结构
// --创建表
// create table user_data(
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users not null,
//     data jsonb,
//     updated_at timestamp default now()
// );

// --开启行级安全
// alter table user_data enable row level security;

// --只允许访问自己的数据
// create policy "Users can only access their own data"
// on user_data
// for all
// using(auth.uid() = user_id)
// with check(auth.uid() = user_id);

async function ODBRead() {
    if (!(authSystemOK && loginedIn)) {
        throw new Error("无法打开数据库");
    }

    const { data: { user } } = await client.auth.getUser();

    const { data, error } = await client
        .from("user_data")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("读取数据库失败", error);
        throw error;
    }

    return data ? data.data : null;
}

async function ODBWrite(data) {
    if (!(authSystemOK && loginedIn)) {
        throw new Error("无法打开数据库");
    }

    const { data: { user } } = await client.auth.getUser();

    const { error } = await client
        .from("user_data")
        .upsert(
            {
                user_id: user.id,
                data: data,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: 'user_id'
            }
        );

    if (error) {
        console.error("写入数据库失败", error);
        throw error;
    }

    return true;
}

/*
用户数据格式：
{
    userdata: {
        username: "example",
        email: "example@example.com"
    },
    songdatas: {
        "netease-123456": {
            url: "http://example.com/song.mp3",
            data: { ... }
        },
        ...
    },
    settings: {
        saveInfo: true,
        saveLyric: true,
        ...
    },
    songlists: {
        "1": {
            name: "我的歌单",
            data: [ "netease-123456", "qq-654321", ... ]
        },
         ...
    }
}
*/

async function ODBGetLocalData() {
    dat = {};
    dat.userdata = {
        nickname: nickname,
        email: username
    };
    dat.songdatas = [];
    dat.settings = await DBgetSettings();
    dat.songlists = [];
    songLists = await DBgetSongLists();
    temp = [];
    dat.songlists = songLists;
    for (i in songLists) {
        nowList = songLists[i].data;
        // console.log(nowList)
        for (j in nowList) {
            song = nowList[j];
            // console.log("正在获取歌曲数据", song);
            if (!temp[song.sid]) {
                temp[song.sid] = true;
                dat.songdatas.push(await DBgetSongInfo(song.sid));
            }
        }
    }
    return dat;
}

async function ODBRegInit() {
    if (!(authSystemOK && loginedIn)) {
        throw new Error("未登录");
    }
    ODBWrite(await ODBGetLocalData());
}

async function ODBuploadLoaclData() {
    if (!(authSystemOK && loginedIn)) {
        throw new Error("未登录");
    }
    ODBWrite(await ODBGetLocalData());
}

async function ODBcheckData() {
    if (!(authSystemOK && loginedIn)) {
        throw new Error("未登录");
    }
    // data = {}
    // console.log(data)
    data = await ODBRead();
    if (!data) {
        throw new Error("数据库数据格式错误");
    }
    if (!data.userdata || !data.songdatas || !data.settings || !data.songlists) {
        throw new Error("数据库数据格式错误");
    }
    local = await ODBGetLocalData();
    console.log(data)
    console.log(local)
    const datMap = new Map();
    for (const list of data.songlists) {
        const set = new Set();
        for (const item of list.data) {
            set.add(item.sid);
        }
        datMap.set(list.name, set);
    }
    let isSame = true;
    for (const localList of local.songlists) {
        const datSet = datMap.get(localList.name);
        if (!datSet) {
            return "diff";
        }
        const localSet = new Set();
        for (const item of localList.data) {
            localSet.add(item.sid);
        }
        for (const sid of localSet) {
            if (!datSet.has(sid)) {
                return "diff";
            }
        }
        if (datSet.size !== localSet.size) {
            isSame = false;
        }
    }
    if (data.songlists.length !== local.songlists.length) {
        isSame = false;
    }
    return isSame ? "same" : "included";
}

async function ODBGetNickname() {
    try {
        const data = await ODBRead();
        return data.userdata.nickname;
    }
    catch (err) {
        throw new Error("获取用户名失败");
    }
}