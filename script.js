/**
 * 核心渲染：大字頭 + 地區標籤 + 異讀分列
 */
function doSearch() {
    const inputChar = document.getElementById('searchInput').value.trim();
    const resultContainer = document.getElementById('results');
    resultContainer.innerHTML = '';
    
    if (!inputChar) return;

    const opts = getActiveOptions();
    const mode = opts.displayMode;
    const fragment = document.createDocumentFragment();

    // 過濾重複輸入字元
    [...new Set(inputChar)].forEach(rawKey => {
        let keysToSearch = [rawKey];
        if (typeof VARIANT_MAP !== 'undefined' && VARIANT_MAP[rawKey]) {
            keysToSearch = keysToSearch.concat(VARIANT_MAP[rawKey]);
        }

        [...new Set(keysToSearch)].forEach(key => {
            const items = typeof DICT_DATA !== 'undefined' ? DICT_DATA[key] : null;
            if (!items || !items.length) return;

            const charBox = document.createElement('div');
            charBox.className = 'char-entry-group'; 
            const first = items[0];

            // 渲染頭部
            charBox.innerHTML = `
                <div class="char-header">
                    <div class="watermark">${key}</div>
                    <div class="header-content">
                        <h1 class="char-large">${key}</h1>
                        <div class="char-info">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="radical-badge">部首</span><span>${first.rad || '-'}部</span>
                            </div>
                            <div class="divider"></div>
                            <div class="info-grid">
                                <span>部外：${first.stk_ex || '0'} 畫</span>
                                <span>總畫：${first.stk_ttl || '-'} 畫</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 渲染詞條內容
            items.forEach((item, index) => {
                const process = (status) => {
                    if (!status || status === '/') return null;
                    const clean = status.replace(/[（\(][^）\)]+[）\)]/g, '').trim();
                    // 修正：只有在選擇「推導拼讀(bopomofo)」時才進行推導，否則直接回傳原始地位
                    return (mode === 'bopomofo' && typeof derivePhonology === 'function') ? derivePhonology(clean, opts) : clean;
                };

                const mainV = (mode === 'orig') ? (item.orig || '/') : (process(item.status) || '/');
                const varV = process(item.var);

                const tagsHtml = [
                    item.陸 ? `<span class="tag-badge">陸</span><span class="tag-text">${item.陸}</span>` : '',
                    item.臺 ? `<span class="tag-badge">臺</span><span class="tag-text">${item.臺}</span>` : '',
                    item.異 ? `<span class="tag-badge badge-alt">異</span><span class="tag-text">${item.異}</span>` : ''
                ].filter(Boolean).join(' ');

                const variantHtml = varV ? `<div class="variant-tag-group"><span class="tag-badge">異讀</span><span class="tag-text-alt">${varV}</span></div>` : '';

                const defsHtml = (item.mean || '').split('\n').filter(m => m.trim()).map((m, i) => `
                    <div class="def-row">
                        <div class="def-index">${i + 1}</div>
                        <div class="def-text">${m.replace(/^([^。]+。)/, '<span class="def-core">$1</span>').replace(/「([^」]+)」/g, '<span class="word-pill">$1</span>')}</div>
                    </div>
                `).join('');

                const section = document.createElement('div');
                section.className = 'reading-section';
                section.innerHTML = `
                    <div class="pronunciation-bar">
                        <div class="pron-left">
                            <div class="pron-main">${mainV}</div>
                            ${variantHtml}
                        </div>
                        <div class="vert-divider"></div>
                        <div class="pron-sub">${tagsHtml}</div>
                    </div>
                    <div class="definition-section">${defsHtml}</div>
                `;
                charBox.appendChild(section);
            });
            fragment.appendChild(charBox);
        });
    });
    resultContainer.appendChild(fragment);
}

// UI 狀態控制
function openSettings() { document.getElementById('modalOverlay').style.display='flex'; updateUI(); }
function closeSettings() { document.getElementById('modalOverlay').style.display='none'; }
function updateUI() {
    const el = document.querySelector('input[name="displayMode"]:checked');
    if (el) document.getElementById('derivationOptions').style.display = (el.value === 'bopomofo') ? 'block' : 'none';
}

function getActiveOptions() {
    const opts = {};
    document.querySelectorAll('.opt').forEach(el => opts[el.dataset.key] = el.checked);
    // 修正：加了安全判定，即使 HTML 少了某些選項也不會報錯中斷
    ['displayMode', 'phoneticScheme', 'toneMode'].forEach(k => {
        const el = document.querySelector(`input[name="${k}"]:checked`);
        if (el) opts[k] = el.value;
    });
    opts.toneMode = opts.toneMode || "5";
    return opts;
}

function saveAndSearch() { 
    localStorage.setItem('phon_cfg', JSON.stringify(getActiveOptions())); 
    closeSettings(); 
    doSearch(); 
}

// 初始化事件與監聽器
document.addEventListener('DOMContentLoaded', () => {
    const saved = JSON.parse(localStorage.getItem('phon_cfg') || '{}');
    ['displayMode', 'phoneticScheme', 'toneMode'].forEach(n => {
        if(saved[n]) { 
            const r = document.querySelector(`input[name="${n}"][value="${saved[n]}"]`); 
            if(r) r.checked = true; 
        }
    });
    
    document.querySelectorAll('.opt').forEach(el => { 
        if(saved.hasOwnProperty(el.dataset.key)) el.checked = saved[el.dataset.key]; 
    });
    updateUI();

    // 事件委派：統一處理點擊與鍵盤事件
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });

    document.getElementById('btnSettings').addEventListener('click', (e) => {
        e.stopPropagation(); 
        document.getElementById('dropdownMenu').style.display = 'block';
    });

    document.querySelectorAll('input[name="displayMode"]').forEach(el => {
        el.addEventListener('change', updateUI);
    });

    window.addEventListener('click', () => {
        document.getElementById('dropdownMenu').style.display = 'none';
    });
});