/**
 * 學生字典音韻推導引擎 (IPA 核心演進版 - 全功能整合)
 */

// --- 基礎 IPA 規則配置 ---
const INITIALS_RULES = {
    "幫": "p", "滂": "pʰ", "明": "m", "非": "f", "敷": "fʰ", "奉": "f", "微": "ʋ",
    "端": "t", "透": "tʰ", "泥": "n", "來": "l", "日": "ɹ", "知": "tʃ", "徹": "tʃʰ", "孃": "ɲ",
    "精": "ts", "清": "tsʰ", "心": "s", "邪": "z", "照": "tʃ", "穿": "tʃʰ", "審": "ʃ", "禪": "ʒ",
    "見": "k", "谿": "kʰ", "疑": "ŋ", "曉": "x", "匣": "χ", "影": "ʔ",
    "並": (t) => t === "平" ? "bʱ" : "b", 
    "定": (t) => t === "平" ? "dʱ" : "d",
    "澄": (t) => t === "平" ? "dʒʱ" : "dʒ", 
    "從": (t) => t === "平" ? "dzʱ" : "dz",
    "羣": (t) => t === "平" ? "gʱ" : "g",
    "牀": (t, mouth) => (mouth === "齊" || mouth === "撮") ? "ʒ" : "dʒʱ",
    "喻": (t, mouth) => (mouth === "齊" ? "j" : (mouth === "撮" ? "ɥ" : "w"))
};

const FINALS_BASE = {
    "東董送屋": { "合": "uŋ", "撮": "yŋ" },
    "冬腫宋沃": { "合": "uŋ", "撮": "yŋ" },
    "江講絳覺": { "合": "uɑŋ", "齊": "iɑŋ" }, 
    "覺": { "合": "uɔŋ", "齊": "iɔŋ" }, 
    "支紙寘": { "開": "ɿ", "齊": "i", "合": "uəi" },
    "微尾未": { "齊": "i", "合": "uəi" },
    "魚語御": { "合": "u", "撮": "y" },
    "虞麌遇": { "合": "u", "撮": "y" },
    "齊薺霽": { "開": "ɿ", "齊": "iəi", "合": "uəi" },
    "泰": { "開": "ai", "合": "uəi" },
    "佳蟹卦": { "開": "ai", "齊": "iai", "合": "uai" },
    "灰賄隊": { "開": "ai", "合": "uəi" },
    "真軫震質": { "開": "ən", "齊": "in", "合": "un", "撮": "yn" },
    "文吻問物": { "開": "ən", "齊": "in", "合": "un", "撮": "yn" },
    "元阮願月": { "開": "ən", "齊": "iɛn", "撮": "yɛn", "合": (i) => "非敷奉微".includes(i) ? "uan" : "uən" },
    "寒旱翰曷": { "開": "an", "合": "uɔn" },
    "刪潸諫黠": { "齊": "ian", "合": "uan", "開": (i) => "見溪曉匣疑影".includes(i) ? "ian" : "an"},
    "先銑霰屑": { "開": "an", "齊": "iɛn", "合": "uan", "撮": "yɛn" },
    "蕭筱嘯": { "齊": "iɛu" },
    "肴巧效": { "開": "au", "齊": "iau" },
    "豪皓號": { "開": "ɔu" },
    "歌哿箇": { "開": "ɔ", "齊": "iɛ", "合": "uɔ", "撮": "yɛ" },
    "麻馬禡": { "開": "a", "合": "ua", "齊": (i, tone, mouth, grade) => (grade === "二") ? "ia" : "iɛ" },
    "陽養漾藥": { "開": "ɑŋ", "齊": "iɑŋ", "合": "uɔŋ" },
    "藥": { "開": "ɔŋ", "齊": "iɔŋ", "合": "uɔŋ", "撮": "yɔŋ" },
    "庚梗敬": { "齊": "iŋ", "合": "uəŋ", "撮": "yəŋ", "開": (i) => "影".includes(i) ? "iŋ" : "əŋ"},
    "陌": { "開": "əŋ", "齊": "iŋ", "合": "uəŋ", "撮": "yəŋ"},
    "青迥徑錫": { "齊": "iŋ", "撮": "yəŋ" },
    "蒸職": { "開": "əŋ", "齊": "iŋ", "合": "uəŋ" },
    "尤有宥": { "開": "əu", "齊": "iu", "合": (i) => "非敷奉微".includes(i) ? "uəu" : "iu" },
    "侵寢沁緝": { "開": "əm", "齊": "im" },
    "覃感勘合": { "開": "am" },
    "鹽琰豔葉": { "齊": "iɛm" },
    "咸豏陷洽": { "齊": "iam", "合": "uam" }
};

const FINALS_RULES = {};
for (const [chars, rules] of Object.entries(FINALS_BASE)) {
    for (const char of chars) FINALS_RULES[char] = rules;
}

// --- 核心轉換函數 ---
function ipaToOthers(ipaStr, toneCode, type) {
    if (!ipaStr) return "";
    const initMap = {
        "tsʰ": ["ㄘ","c"], "tɕʰ": ["ㄑ","q"], "dzʱ": ["ㄘ","c"], "tʃʰ": ["ㄔ","ch"], "dʒʱ": ["ㄔ","ch"], "dz": ["ㄗ","z"], "dʒ": ["ㄓ","zh"],
        "pʰ": ["ㄆ","p"], "bʱ": ["ㄆ","p"], "tʰ": ["ㄊ","t"], "dʱ": ["ㄊ","t"], "kʰ": ["ㄎ","k"], "gʱ": ["ㄎ","k"],
        "ts": ["ㄗ","z"], "tɕ": ["ㄐ","j"], "tʃ": ["ㄓ","zh"], "p": ["ㄅ","b"], "b": ["ㄅ","b"], "t": ["ㄉ","d"], "d": ["ㄉ","d"], "k": ["ㄍ","g"], "g": ["ㄍ","g"],
        "m": ["ㄇ","m"], "f": ["ㄈ","f"], "fʰ": ["ㄈ","f"], "v": ["ㄈ","v"], "ʋ": ["ㄪ","v"], "n": ["ㄋ","n"], "l": ["ㄌ","l"],
        "s": ["ㄙ","s"], "ɕ": ["ㄒ","x"], "z": ["ㄙ","s"], "ʃ": ["ㄕ","sh"], "ʒ": ["ㄕ","sh"], "x": ["ㄏ","h"], "χ": ["ㄏ","h"], "ŋ": ["ㄫ","ng"],
        "ɲ": ["ㄋ","n"], "ɹ": ["ㄖ","r"], "ʔ": ["",""], "j": ["",""], "ɥ": ["",""], "w": ["",""]
    };

    const finalMap = {
        "uɑŋ": ["ㄨㄤ","uang"], "iɑŋ": ["ㄧㄤ","iang"], "uɔŋ": ["ㄨㄤ","uang"], "yɔŋ": ["ㄩㄤ","iang"],
        "uɔk": ["ㄨㄛ","uok"], "iɔk": ["ㄧㄛ","iok"], "uɔŋ": ["ㄨㄛ","uok"], "yɔk": ["ㄩㄛ","üok"],
        "iɛu": ["ㄧㄠ","iau"], "iau": ["ㄧㄠ","iau"], "uəi": ["ㄨㄟ","uei"],
        "iɛm": ["ㄧㄢ","iam"], "iam": ["ㄧㄢ","iam"],"iɛn": ["ㄧㄢ","ian"], "ian": ["ㄧㄢ","ian"], "yɛn": ["ㄩㄢ","üan"], "uɛn": ["ㄨㄢ","uan"], 
        "iɛp": ["ㄧㄝ","iap"], "iam": ["ㄧㄚ","iap"],"iɛt": ["ㄧㄝ","ian"], "iat": ["ㄧㄚ","ian"], "yɛt": ["ㄩㄝ","üan"], "uɛt": ["ㄨㄛ","uat"], 
        "iəi": ["ㄧㄟ","iei"], "iai": ["ㄧㄞ","iai"], "uai": ["ㄨㄞ","uai"], "uɔn": ["ㄨㄢ","uan"], "uən": ["ㄨㄣ","un"],
       "uɔt": ["ㄨㄛ","uan"], "uət": ["ㄨ","ut"],"yək": ["ㄩ","iuk"], "uək": ["ㄨㄥ","uek"],
        "yəŋ": ["ㄩㄥ","üeng"], "uəŋ": ["ㄨㄥ","ueng"], "uəu": ["ㄨ","u"], "yɛ": ["ㄩㄝ","üe"],
        "uɔ": ["ㄨㄛ","uo"], "iɛ": ["ㄧㄝ","ie"], "uŋ": ["ㄨㄥ","ung"], "yŋ": ["ㄩㄥ","iung"],
        "ai": ["ㄞ","ai"], "əi": ["ㄟ","ei"],"au": ["ㄠ","au"], "ɔu": ["ㄠ","au"], "an": ["ㄢ","an"], "ən": ["ㄣ","en"],
        "ɑŋ": ["ㄤ","ang"], "əŋ": ["ㄥ","eng"], "am": ["ㄢ","am"], "əm": ["ㄣ","em"], "əu": ["ㄡ","ou"],
        "ɔk": ["ㄛ","ok"], "ək": ["ㄜ","ek"], "ap": ["ㄚ","ap"], "əm": ["ㄜ","ep"], 
        "ia": ["ㄧㄚ","ia"], "ua": ["ㄨㄚ","ua"], "iŋ": ["ㄧㄥ","ing"], "in": ["ㄧㄣ","in"], "yn": ["ㄩㄣ","ün"],
        "im": ["ㄧㄣ","im"], "iu": ["ㄧㄡ","iu"], "i": ["ㄧ","i"], "u": ["ㄨ","u"], "y": ["ㄩ","ü"],
        "ip": ["ㄧㄣ","ip"], "ik": ["ㄧ","ik"], "it": ["ㄧ","it"], "yt": ["ㄩ","üt"],
        "a": ["ㄚ","a"], "ɔ": ["ㄛ","o"], "ɛ": ["ㄝ","eh"], "ə": ["ㄜ","e"], "ɿ": ["","ih"],"ʅ": ["","ih"],
        "aʔ": ["ㄚ","a"], "iɛʔ": ["ㄧㄝ","ie"], "iaʔ": ["ㄧㄚ","ia"], "əʔ": ["ㄜ","e"], "ɿʔ": ["ㄭ","i"], "iɔʔ": ["ㄧㄛ","io"], "uɔʔ": ["ㄨㄛ","uo"], "yɔʔ": ["ㄩㄛ","üo"], "uəʔ": ["ㄨㄜ","ue"], "yʔ": ["ㄩ","ü"]
    , "yɛʔ": ["ㄩㄝ","üe"],"uɛʔ": ["ㄨㄛ","uo"]
    };

    const idx = (type === "zhuyin") ? 0 : 1;
    let resInit = "", resFinal = ipaStr;
    const sortedInits = Object.keys(initMap).sort((a, b) => b.length - a.length);
    for (let k of sortedInits) {
        if (ipaStr.startsWith(k)) {
            resInit = initMap[k][idx];
            resFinal = ipaStr.substring(k.length);
            break;
        }
    }

    let finalOut = finalMap[resFinal] ? finalMap[resFinal][idx] : resFinal;
    if (type === "zhuyin") {
        const marks = { "44":"", "22":"ˊ", "53":"ˇ", "31":"ˇ", "35":"ˋ", "13":"ˋ" };
        if (resFinal === "ɿ") finalOut = "";
        return resInit + finalOut + (marks[toneCode] || "");
    } else {
        const toneIdx = { "44":0, "22":1, "53":2, "31":2, "35":3, "13":3 }[toneCode];
        return applyPinyinTone(resInit + finalOut, toneIdx);
    }
}

function applyPinyinTone(str, toneIdx) {
    if (toneIdx === undefined) return str;
    const tones = { 'a':['ā','á','ǎ','à'], 'e':['ē','é','ě','è'], 'i':['ī','í','ǐ','ì'], 'o':['ō','ó','ǒ','ò'], 'u':['ū','ú','ǔ','ù'], 'ü':['ǖ','ǘ','ǚ','ǜ'] };
    const priority = ['a', 'e', 'o', 'i', 'u', 'ü'];
    for (let char of priority) {
        if (str.includes(char)) return str.replace(char, tones[char][toneIdx]);
    }
    return str;
}

// --- 主推導引擎 ---
function derivePhonology(status, opts) {
    const m = status.match(/^([一-龥])(開|合|齊|撮)?([一二三四])?([一-龥])([平上去入])$/);
    if (!m) return status;
    let [_, init, mouth="開", grade, rime, tone] = m;

    let resI = (typeof INITIALS_RULES[init] === "function") ? INITIALS_RULES[init](tone, mouth) : INITIALS_RULES[init];
    let resF = "";
    const rules = FINALS_RULES[rime];
    if (rules) {
        const key = mouth + (grade || "");
        resF = rules[key] || rules[mouth] || "";
        if (typeof resF === "function") resF = resF(init, tone, mouth, grade, rime);
    }

// --- 演變邏輯 (修正版) ---

    // 1. 物理轉換：陽聲韻轉入聲 (物理屬性，最先執行)
    if (tone === "入") {
        resF = resF.replace(/m$/, "p").replace(/n$/, "t").replace(/ŋ$/, "k");
    }

// 2. 演變功能：輕唇不合
    if (opts.dropFw && /^[ppʰbmfv]/.test(resI)) {if (/^u[aə]/.test(resF)) { resF = resF.substring(1); } 
        else if (resF === "uŋ") resF = "əŋ"; else if (resF === "un") resF = "ən";
        }

    // 3. 演變功能：咸入山 (修正：確保在合併前執行)
    if (opts.mergeHamShan) {
        resF = resF.replace(/am$/, "an").replace(/im$/, "in").replace(/ap$/, "at").replace(/ip$/, "it");
    }

    // 4. 演變功能：簡化山攝 (新增功能塊)
if (opts.simplifyShan) {
    // 將 uɔn 併入 uan
    if (resF === "uɔn") resF = "uan";
}

// 5. 演變功能：莊三化二
    // 修正：將 [] 改為 ()，確保只匹配完整的庄組聲母 (tʃ, dʒ, ʃ, ʒ, ɹ)
    // 這樣就不會誤傷端組 (t, d) 或 精組 (ts)
    if (opts.zhuangSan && /^(tʃ|dʒ|ʃ|ʒ|ɹ)/.test(resI)) {
        const zsMap = { 
            "i": "ʅ", "in": "ən", "im": "əm", 
            "ip": opts.mergeRuRime ? "ʅp" : "əp",
            "iŋ": "əŋ", "ik": "ək"
        };
        
        if (zsMap[resF]) {
            resF = zsMap[resF];
        } else if (resF.startsWith("iɛ")) {
            resF = resF.replace(/^iɛ/, "a"); // iɛn -> an
        } else if (resF.length > 1 && resF.startsWith("i")) {
            resF = resF.replace(/^i/, "");   // iɑŋ -> ɑŋ
        } else if (resF.startsWith("y")) {
            resF = resF.replace(/^y/, "u");   // yŋ -> uŋ
        }
    }

    // 6. 演變功能：見系顎化
    if (opts.palatalization && /^[iyjɥ]/.test(resF)) {
        const pMap = { "k":"tɕ", "kʰ":"tɕʰ", "g":"tɕ", "gʱ":"tɕʰ", "x":"ɕ", "χ":"ɕ" };
        if (pMap[resI]) resI = pMap[resI];
    }

    // 7. 演變功能：東庚合併 (修正「國」字問題)
    if (opts.mergeDongGeng) {
        const voicelessList = "幫滂端透精清心照穿審見谿曉影";
        if ("庚梗敬陌".includes(rime)) {
            if (mouth === "合") resF = (tone === "入") ? "uk" : "uŋ"; // 修正入聲結尾
            else if (mouth === "撮") resF = voicelessList.includes(init) ? "iŋ" : "yŋ";
        } else if (rime === "蒸" && mouth === "合") {
            resF = (tone === "入") ? "uk" : "uŋ";
        } else if (rime === "職") {
            if (mouth === "合") resF = (tone === "入") ? "uɔk" : "uɔŋ"; // 國字所在韻
            else if (mouth === "撮") resF = (tone === "入") ? "yk" : "yŋ";
        }
    }

    // 8. 演變功能：日母兒化
    if (opts.riToEr && resI === "ɹ" && resF === "i") { resI = ""; resF = "ər"; }

    // 9. 演變功能：疑微脫落
    if (opts.dropVng && (resI === "ŋ" || resI === "ʋ")) resI = "";

    // 10 演變功能：齊韻歸一
    if (opts.qiToI && resF === "iəi") resF = "i";

    // 11. 入聲喉塞音化 (最後一步：將所有入聲結尾 p/t/k 轉為 ʔ)
    if (tone === "入" && opts.mergeRuRime) {
        resF = resF.replace(/[ptk]$/, "ʔ");
    }

// --- 聲調處理與動態合併邏輯 (修正版) ---
    const voiceless = "幫滂非敷端透精清心照穿審見谿曉影";
    const quanZhuo = "並奉定澄從羣牀邪禪匣"; // 明確定義全濁聲母
    const isVoiceless = voiceless.includes(init);
    const isQuanZhuo = quanZhuo.includes(init);

    // 1. 確定基礎原始八調標籤
    let toneKey = (isVoiceless ? "陰" : "陽") + tone;

    // 2. 鏈式合併邏輯
    const tMode = opts.toneMode || "8";
    
    // 七調模式：全濁上歸陽去 (13)，次濁上依舊是陽上 (31)
    if (tMode === "7" || tMode === "6" || tMode === "5") {
        if (toneKey === "陽上" && isQuanZhuo) {
            toneKey = "陽去"; // 關鍵修正：全濁上 -> 13
        }
        // 注意：此時次濁上仍維持 "陽上"，標籤不變，最終映射為 31
    }

    if (tMode === "6" || tMode === "5") {
        // 六調模式：陰陽去合併 (通常陽去併入陰去 35)
        if (toneKey === "陽去") toneKey = "陰去";
    }

    if (tMode === "5") {
        // 五調模式：陰陽入合併
        if (toneKey === "陽入") toneKey = "陰入";
    }

    // 3. 映射最終調值
    const toneValueMap = {
        "陰平": "44", "陽平": "22", "陰上": "53", "陽上": "31",
        "陰去": "35", "陽去": "13", "陰入": "44", "陽入": "22"
    };
    const toneCode = toneValueMap[toneKey];

    if (opts.phoneticScheme === "ipa") return resI + resF + toneCode;
    return ipaToOthers(resI + resF, toneCode, opts.phoneticScheme);
}
