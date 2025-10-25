// --- الكود الجافاسكريبت بالكامل كما هو في النسخة السابقة ---
// (تم التأكد من صحته وتضمين التحسينات السابقة)

const GEMINI_API_KEY = "AIzaSyByERNaTPUtuleb62ok6YAOlADKoiSM-zM";
const DEEPSEEK_API_KEY = "sk-3ac8d0208edd4ada9e949eb366a4a262";

const form = document.getElementById('ai-form');
const resultContainer = document.getElementById('result-container');
const resultBox = document.getElementById('result-box');
const messageBox = document.getElementById('message-box');
const progressText = document.getElementById('progress-text');
const loader = document.getElementById('loader');
const resultsTitle = document.getElementById('results-title');
const clearFormBtn = document.getElementById('clear-form-btn');
const submitButton = form.querySelector('button[type="submit"]');
const searchIcon = document.getElementById('search-icon'); 

const contactButton = document.getElementById('contact-us-btn');
const contactModalOverlay = document.getElementById('contact-modal-overlay');
const contactModal = document.getElementById('contact-modal');
const contactCloseModalBtn = document.getElementById('contact-modal-close-btn');

const typeInput = document.getElementById('type');
const modelInput = document.getElementById('model');
const typeSuggestions = document.getElementById('type-suggestions');
const modelSuggestions = document.getElementById('model-suggestions');
const vinInput = document.getElementById('vin_input');
const vinCounter = document.getElementById('vin-counter');

let carMakes = [];
let carModels = [];

const carMakesUrl = 'https://raw.githubusercontent.com/iqsd2020-ctrl/Sjad/refs/heads/main/%D9%85%D8%A7%D8%B1%D9%83%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA.csv';
const carModelsUrl = 'https://raw.githubusercontent.com/iqsd2020-ctrl/Sjad/refs/heads/main/%D8%B7%D8%B1%D8%A7%D8%B2%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA.csv';

let currentSearchMode = 'specs'; 
const tabs = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.search-panel');

const historyContainer = document.getElementById('history-container');
const historyBox = document.getElementById('history-box');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const MAX_HISTORY = 10;

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;


function openModal(modal, overlay) {
    overlay.style.display = 'block';
    modal.style.display = 'block';
}
function closeModal(modal, overlay) {
    overlay.style.display = 'none';
    modal.style.display = 'none';
}

contactButton.addEventListener('click', () => openModal(contactModal, contactModalOverlay));
contactCloseModalBtn.addEventListener('click', () => closeModal(contactModal, contactModalOverlay));
contactModalOverlay.addEventListener('click', () => closeModal(contactModal, contactModalOverlay));

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const targetPanelId = tab.id.replace('-tab', '-search-panel');
        document.getElementById(targetPanelId).classList.add('active');
        
        currentSearchMode = tab.id.split('-')[0];
        
        resultBox.innerHTML = '';
        resultsTitle.style.display = 'none';
        messageBox.style.display = 'none';
    });
});

form.addEventListener('submit', async function(event) {
    event.preventDefault(); 
    
    messageBox.style.display = 'none';
    resultBox.innerHTML = '';
    resultsTitle.style.display = 'none';

    progressText.style.display = 'none';
    if (searchIcon) searchIcon.style.display = 'none'; 
    loader.classList.remove('hidden');
    submitButton.disabled = true;

    let userQuery = '';
    let systemInstruction = '';
    let displayTitle = { make: '', model: '', year: '' };
    let searchData = {};
    let resultData = {}; 

    try {
        if (currentSearchMode === 'specs') {
            const year = document.getElementById('year').value;
            const type = typeInput.value;
            const model = modelInput.value;
            const market = document.getElementById('market').value;
            
            if (!type || !model || !year || !market) {
                throw new Error("الرجاء ملء جميع حقول البحث بالمواصفات.");
            }

            userQuery = createSpecsQuery(year, type, model, market);
            systemInstruction = createSpecsSystemInstruction();
            displayTitle = { make: type, model: model, year: year };
            
            searchData = {
                mode: 'specs',
                id: `specs-${year}-${type}-${model}-${market}`,
                title: `${year} - ${type} - ${model} (${market})`,
                typeDisplay: 'مواصفات',
                tabId: 'specs-tab',
                data: { year, type, model, market }
            };
            
            resultData = { 
                type: 'specs',
                title: `${type} ${model} ${year}`,
                id: `specs-res-${Date.now()}`
            };

        } else if (currentSearchMode === 'vin') {
            const vin = vinInput.value.toUpperCase();
            
            if (!vin || !VIN_REGEX.test(vin)) {
                throw new Error("الرجاء إدخال رقم VIN صحيح (17 رمزاً، بدون الأحرف I, O, Q).");
            }
            
            userQuery = createVinQuery(vin); 
            systemInstruction = createVinSystemInstruction(); 
            displayTitle = { make: 'VIN', model: vin, year: '' }; 
            
            searchData = {
                mode: 'vin',
                id: `vin-${vin}`,
                title: `VIN: ${vin}`,
                typeDisplay: 'VIN',
                tabId: 'vin-tab',
                data: { vin }
            };
            
            resultData = { 
                type: 'vin', 
                title: `VIN: ${vin}`,
                id: `vin-res-${vin}`
            };

        } else if (currentSearchMode === 'reverse') {
            const fccId = document.getElementById('fcc_input').value.toUpperCase();
            const partNumber = document.getElementById('pn_input').value.toUpperCase();

            if (!fccId && !partNumber) {
                throw new Error("الرجاء إدخال FCC ID أو Part Number للبحث العكسي.");
            }
            
            userQuery = createReverseQuery(fccId, partNumber);
            systemInstruction = createReverseSystemInstruction();
            displayTitle = { fccId: fccId, partNumber: partNumber };
            
            searchData = {
                mode: 'reverse',
                id: `reverse-${fccId}-${partNumber}`,
                title: `${fccId || ''} / ${partNumber || ''}`,
                typeDisplay: 'عكسي',
                tabId: 'reverse-tab',
                data: { fccId, partNumber }
            };
            
            resultData = { 
                type: 'reverse',
                title: `${fccId || ''} / ${partNumber || ''}`,
                id: `reverse-res-${fccId}-${partNumber}`
            };
        }
        
        let rawText;
        try {
            console.log("Attempting search with Gemini...");
            rawText = await callGeminiAPI(userQuery, systemInstruction);
        } catch (geminiError) {
            console.warn("Gemini API failed:", geminiError.message);
            showMessage("فشل الخادم الأول. جارٍ المحاولة بالخادم الاحتياطي...", 'info');
            
            try {
                console.log("Attempting search with DeepSeek...");
                rawText = await callDeepSeekAPI(userQuery, systemInstruction); 
            } catch (deepSeekError) {
                console.error("DeepSeek API failed:", deepSeekError.message);
                throw new Error("فشل الاتصال بكلا الخادمين. الرجاء المحاولة لاحقاً.");
            }
        }
        
        saveToHistory(searchData);
        
        resultData.rawText = rawText; 
        
        let resultsFound = false;
        if (currentSearchMode === 'specs' || currentSearchMode === 'vin') {
            resultsFound = displaySpecsResults(rawText, displayTitle, resultData);
        } else if (currentSearchMode === 'reverse') {
            resultsFound = displayReverseResults(rawText, displayTitle, resultData);
        }
        
        if (!resultsFound) {
            showEmptyState();
        } else {
            showMessage('تم العثور على نتائج بنجاح!', 'success');
        }

    } catch (error) {
        console.error("Submit Error:", error);
        showMessage(error.message || 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.', 'error');
    } finally {
        loader.classList.add('hidden');
        progressText.style.display = 'block';
        if (searchIcon) searchIcon.style.display = 'block'; 
        submitButton.disabled = false;
    }
});

clearFormBtn.addEventListener('click', function() {
    const activePanel = document.querySelector('.search-panel.active');
    if (activePanel) {
        activePanel.querySelectorAll('input, select').forEach(el => {
            if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
            } else {
                el.value = '';
            }
        });
    }
    if (currentSearchMode === 'vin') {
        updateVinCounter(0);
    }
    
    messageBox.style.display = 'none';
    resultBox.innerHTML = '';
    resultsTitle.style.display = 'none';
});

function createSpecsQuery(year, type, model, market) {
    return `ابحث عن بيانات الريموت لسيارة:
- الماركة: ${type}
- الطراز: ${model}
- السنة: ${year}
- السوق: ${market}
ابحث عن FCC ID و Part Number ونوع الريموت ونوع نصل المفتاح (مثل TOY48 أو KK12).
ابحث أيضًا عن 2-3 احتمالات أو بدائل شائعة إذا كانت متوفرة.
---
${getSpecsFormatInstruction()}`;
}

function createVinQuery(vin) {
    return `مهم للغاية: لديك مهمتان متسلسلسان.
المهمة 1 (التحقق أولاً): خذ رقم VIN التالي: ${vin}. ابحث في Google ومواقع فك تشفير VIN (مثل partsouq.com أو carfax.com أو أي VIN decoder) لتحديد **بدقة** ما هي "الماركة" و "الطراز" و "السنة" الحقيقية. قم بمطابقة النتائج من أكثر من موقع. لا تفترض، بل تحقق.
المهمة 2 (البحث ثانياً): *فقط بعد أن تتحقق من معلومات السيارة من المهمة 1*، استخدم هذه المعلومات (الماركة، الطراز، السنة) للبحث عن بيانات الريموت الخاصة بها.
ابحث عن: FCC ID, Part Number, نوع الريموت, نصل المفتاح.
وابحث عن 2-3 بدائل.
---
${getVinFormatInstruction()}`;
}

function createReverseQuery(fccId, partNumber) {
    return `ابحث عن السيارات المتوافقة مع:
- FCC ID: ${fccId || 'N/A'}
- Part Number: ${partNumber || 'N/A'}
اذكر 5-7 سيارات متوافقة، مع ذكر الطراز، سنوات التصنيع، وأي ملاحظات هامة.
---
الرجاء تنسيق الرد **فقط** بالشكل التالي (لا تضف أي نص إضافي):
CAR_1_MODEL: [الطراز 1]
CAR_1_YEARS: [سنوات التصنيع 1]
CAR_1_NOTES: [ملاحظات 1 أو "N/A"]
...
CAR_7_MODEL: [الطراز 7]
CAR_7_YEARS: [سنوات التصنيع 7]
CAR_7_NOTES: [ملاحظات 7 أو "N/A"]
`;
}

function getSpecsFormatInstruction() {
    return `الرجاء تنسيق الرد **فقط** بالشكل التالي (لا تضف أي نص إضافي، استخدم "غير متوفر" أو "N/A" إذا لم تُعثر على بيانات):
FCC_ID: [البيانات أو "غير متوفر"]
PART_NUMBER: [البيانات أو "غير متوفر"]
REMOTE_TYPE: [البيانات أو "غير متوفر"]
KEY_BLADE: [البيانات أو "غير متوفر"]
ALT_1_FCC: [بيانات البديل 1 أو "N/A"]
ALT_1_PN: [بيانات البديل 1 أو "N/A"]
ALT_1_NOTES: [ملاحظات 1 أو "N/A"]
ALT_2_FCC: [بيانات البديل 2 أو "N/A"]
ALT_2_PN: [بيانات البديل 2 أو "N/A"]
ALT_2_NOTES: [ملاحظات 2 أو "N/A"]
ALT_3_FCC: [بيانات البديل 3 أو "N/A"]
ALT_3_PN: [بيانات البديل 3 أو "N/A"]
ALT_3_NOTES: [ملاحظات 3 أو "N/A"]`;
}

function getVinFormatInstruction() {
    return `الرجاء تنسيق الرد **فقط** بالشكل التالي (لا تضف أي نص إضافي، استخدم "غير متوفر" أو "N/A" إذا لم تُعثر على بيانات):
MAKE: [الماركة التي وجدتها]
MODEL: [الطراز الذي وجدته]
YEAR: [السنة التي وجدتها]
FCC_ID: [البيانات أو "غير متوفر"]
PART_NUMBER: [البيانات أو "غير متوفر"]
REMOTE_TYPE: [البيانات أو "غير متوفر"]
KEY_BLADE: [البيانات أو "غير متوفر"]
ALT_1_FCC: [بيانات البديل 1 أو "N/A"]
ALT_1_PN: [بيانات البديل 1 أو "N/A"]
ALT_1_NOTES: [ملاحظات 1 أو "N/A"]
ALT_2_FCC: [بيانات البديل 2 أو "N/A"]
ALT_2_PN: [بيانات البديل 2 أو "N/A"]
ALT_2_NOTES: [ملاحظات 2 أو "N/A"]
ALT_3_FCC: [بيانات البديل 3 أو "N/A"]
ALT_3_PN: [بيانات البديل 3 أو "N/A"]
ALT_3_NOTES: [ملاحظات 3 أو "N/A"]`;
}

function createSpecsSystemInstruction() {
    return {
        parts: [{ text: "أنت مساعد خبير في قطع غيار السيارات، متخصص في ريموتات المفاتيح. ابحث عن المعلومات المطلوبة بدقة والتزم **تماماً** بالتنسيق المطلوب في نهاية طلب المستخدم. لا تضف أي مقدمات أو خواتيم. يجب أن تكون جميع القيم باللغة العربية باستثناء FCC ID و Part Number و Key Blade." }]
    };
}
function createReverseSystemInstruction() {
     return {
        parts: [{ text: "أنت مساعد خبير في قطع غيار السيارات. ابحث عن السيارات المتوافقة والتزم **تماماً** بالتنسيق المطلوب (CAR_1_MODEL, CAR_1_YEARS...). لا تضف أي مقدمات أو خواتيم." }]
    };
}

function createVinSystemInstruction() {
    return {
        parts: [{ text: "أنت مساعد خبير في قطع غيار السيارات. مهمتك الأولى هي فك تشفير VIN للعثور على الماركة والطراز والسنة. مهمتك الثانية هي العثور على معلومات الريموت لتلك السيارة. التزم **تماماً** بالتنسيق المطلوب (MAKE, MODEL, YEAR, FCC_ID...). لا تضف أي مقدمات أو خواتيم." }]
    };
}

async function callGeminiAPI(userQuery, systemInstruction) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: systemInstruction,
        tools: [{ "google_search": {} }]
    };
    
    const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText || rawText.trim() === '') {
        throw new Error("لم يتم العثور على معلومات مفيدة من الـ API.");
    }
    return rawText;
}

async function callDeepSeekAPI(userQuery, systemInstruction) {
    const apiKey = DEEPSEEK_API_KEY; 
    const apiUrl = `https://api.deepseek.com/chat/completions`;

    console.warn("Calling DeepSeek. Note: Google Search grounding is not available for this API. Results may vary.");

    const payload = {
        model: "deepseek-chat",
        messages: [
            { "role": "system", "content": systemInstruction.parts[0].text },
            { "role": "user", "content": userQuery }
        ]
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    };

    let delay = 1000;
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch(apiUrl, options);
            if (response.ok) {
                const data = await response.json();
                const rawText = data.choices?.[0]?.message?.content;
                if (!rawText || rawText.trim() === '') {
                    throw new Error("لم يتم العثور على معلومات مفيدة من DeepSeek API.");
                }
                return rawText;
            }
            if (response.status === 429 || response.status >= 500) {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            } else {
                const errorData = await response.json();
                throw new Error(`DeepSeek Client Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            if (i === 2) throw error;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
    throw new Error("فشل الاتصال بـ DeepSeek API بعد عدة محاولات.");
}


function extract(rawText, key) {
    const regex = new RegExp(`^${key}: (.*)`, "im"); 
    const match = rawText.match(regex);
    return match && match[1] ? match[1].trim() : "غير متوفر";
}

function showEmptyState() {
    resultsTitle.style.display = 'none';
    const template = document.getElementById('empty-state-template');
    const clone = template.content.cloneNode(true);
    resultBox.appendChild(clone);
}
    
function displaySpecsResults(rawText, title, resultData) {
    resultBox.innerHTML = ''; 

    const fccId = extract(rawText, "FCC_ID");
    const partNumber = extract(rawText, "PART_NUMBER");
    
    if ((fccId === "غير متوفر" || fccId === "N/A") && (partNumber === "غير متوفر" || partNumber === "N/A")) {
        return false; 
    }
    
    resultsTitle.style.display = 'flex'; 
    const remoteType = extract(rawText, "REMOTE_TYPE");
    const keyBlade = extract(rawText, "KEY_BLADE");
    
    let headerTitle = '';
    
    if (resultData.type === 'vin') {
        const apiMake = extract(rawText, "MAKE");
        const apiModel = extract(rawText, "MODEL");
        const apiYear = extract(rawText, "YEAR");
        
        if (apiMake !== "غير متوفر" && apiMake !== "N/A" && apiModel !== "غير متوفر" && apiModel !== "N/A") {
            headerTitle = `${apiMake} ${apiModel} ${apiYear || ''}`;
            resultData.title = headerTitle; 
        } else {
            headerTitle = `نتائج للـ VIN: ${title.model}`;
        }
    } else {
        headerTitle = `${title.make} ${title.model} ${title.year}`;
    }

    resultData.fccId = fccId;
    resultData.partNumber = partNumber;
    resultData.keyBlade = keyBlade;
    resultData.remoteType = remoteType;
    
    const copyIconSvgPath = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>`;

    const mainResultsHtml = `
        <div class="accordion-header" onclick="toggleAccordion(this)">
            <h3 class="font-bold text-lg text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-gold">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v-2.25l5.227-5.227c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
                <span>${headerTitle}</span>
            </h3>
            
            <div class="accordion-actions">
                <button class="action-btn" title="مشاركة النتيجة" onclick="shareResult(${JSON.stringify(resultData).replace(/"/g, "'")})">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.19.02.38.05.57.09m0 0c2.083.36 3.997.96 5.681 1.94m0 0c.16.1.31.2.46.3m0 0a2.25 2.25 0 1 0 0-2.186m0 2.186c-.19-.02-.38-.05-.57-.09m0 0c-2.083-.36-3.997-.96-5.681-1.94m0 0c-.16-.1-.31-.2-.46-.3m0 0a2.25 2.25 0 1 0 0 2.186m0-2.186-.57.09" />
                    </svg>
                </button>
            </div>

            <svg class="accordion-icon w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        <div class="accordion-content">
            <div class="p-4 border border-gray-700 rounded-lg overflow-x-auto">
                <table class="results-table">
                    <tbody>
                        <tr>
                            <td class="font-semibold text-gold pr-4 py-2 w-1/3">FCC ID:</td>
                            <td class="latin-font py-2 flex justify-between items-center">
                                <span>${fccId}</span>
                                ${(fccId !== 'غير متوفر' && fccId !== 'N/A') ? `<svg onclick="copyToClipboard(this.previousElementSibling.textContent, this)" title="نسخ FCC ID" class="copy-btn w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${copyIconSvgPath}</svg>` : ''}
                            </td>
                        </tr>
                        <tr>
                            <td class="font-semibold text-gold pr-4 py-2">Part Number:</td>
                            <td class="latin-font py-2 flex justify-between items-center">
                                <span>${partNumber}</span>
                                ${(partNumber !== 'غير متوفر' && partNumber !== 'N/A') ? `<svg onclick="copyToClipboard(this.previousElementSibling.textContent, this)" title="نسخ Part Number" class="copy-btn w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${copyIconSvgPath}</svg>` : ''}
                            </td>
                        </tr>
                        <tr>
                            <td class="font-semibold text-gold pr-4 py-2">نوع الريموت:</td>
                            <td class="py-2">${remoteType}</td>
                        </tr>
                        <tr>
                            <td class="font-semibold text-gold pr-4 py-2">نصل المفتاح:</td>
                            <td class="latin-font py-2 flex justify-between items-center">
                                <span>${keyBlade}</span>
                                ${(keyBlade !== 'غير متوفر' && keyBlade !== 'N/A') ? `<svg onclick="copyToClipboard(this.previousElementSibling.textContent, this)" title="نسخ نصل المفتاح" class="copy-btn w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${copyIconSvgPath}</svg>` : ''}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    resultBox.innerHTML += mainResultsHtml;

    let alternatives = [];
    for (let i = 1; i <= 3; i++) {
        const altFcc = extract(rawText, `ALT_${i}_FCC`);
        const altPn = extract(rawText, `ALT_${i}_PN`);
        const altNotes = extract(rawText, `ALT_${i}_NOTES`);
        
        if ((altFcc !== "غير متوفر" && altFcc !== "N/A") || (altPn !== "غير متوفر" && altPn !== "N/A")) {
            alternatives.push({
                fccId: (altFcc && altFcc !== "غير متوفر" && altFcc !== "N/A") ? altFcc : "N/A",
                partNumber: (altPn && altPn !== "غير متوفر" && altPn !== "N/A") ? altPn : "N/A",
                notes: (altNotes && altNotes !== "غير متوفر" && altNotes !== "N/A") ? altNotes : "لا توجد ملاحظات."
            });
        }
    }

    if (alternatives.length > 0) {
        let alternativesHtml = alternatives.map(alt => `
            <div class="alternative-card space-y-2 mb-3">
                <div class="flex justify-between items-center">
                    <strong class="text-gray-400">FCC ID:</strong>
                    <span class="latin-font">${alt.fccId}</span>
                </div>
                <div class="flex justify-between items-center">
                    <strong class="text-gray-400">Part Number:</strong>
                    <span class="latin-font">${alt.partNumber}</span>
                </div>
                <div>
                    <strong class="text-gray-400">ملاحظات:</strong>
                    <p class="text-sm text-gray-300 leading-relaxed mt-1">${alt.notes}</p>
                </div>
            </div>
        `).join('');

        const altSectionHtml = `
            <div class="accordion-header" onclick="toggleAccordion(this)">
                <h3 class="font-bold text-lg text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25 12 21m0 0-3.75-3.75M12 21V3" />
                    </svg>
                    <span>احتمالات أخرى مطابقة (${alternatives.length})</span>
                </h3>
                <svg class="accordion-icon w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            <div class="accordion-content">
                <div class="p-4 border border-gray-700 rounded-lg scrollable-card-container">
                    ${alternativesHtml}
                </div>
            </div>
        `;
        resultBox.innerHTML += altSectionHtml;
    } else {
         resultBox.innerHTML += `
            <p class="text-gray-400 text-center py-4">لا توجد بدائل شائعة مسجلة لهذه المواصفات.</p>
        `;
    }
    
    const firstAccordion = resultBox.querySelector('.accordion-header');
    if(firstAccordion) {
        firstAccordion.click();
    }
    
    return true;
}

function displayReverseResults(rawText, title, resultData) {
    resultBox.innerHTML = '';
    
    let cars = [];
    for (let i = 1; i <= 7; i++) {
        const model = extract(rawText, `CAR_${i}_MODEL`);
        const years = extract(rawText, `CAR_${i}_YEARS`);
        const notes = extract(rawText, `CAR_${i}_NOTES`);
        
        if (model !== "غير متوفر" && model !== "N/A") {
            cars.push({ model, years, notes });
        }
    }
    
    if (cars.length === 0) {
        return false; 
    }
    
    resultsTitle.style.display = 'flex'; 
    let titleText = title.fccId ? `FCC ID: ${title.fccId}` : `P/N: ${title.partNumber}`;
    if (title.fccId && title.partNumber) {
        titleText = `FCC ID: ${title.fccId} | P/N: ${title.partNumber}`;
    }
    
    resultData.cars = cars;
    
    let carsHtml = cars.map(car => `
        <div class="alternative-card space-y-2 mb-3">
            <div class="flex justify-between items-center">
                <strong class="text-gray-400">الطراز:</strong>
                <span class="font-semibold">${car.model}</span>
            </div>
            <div class="flex justify-between items-center">
                <strong class="text-gray-400">السنوات:</strong>
                <span class="latin-font">${car.years}</span>
            </div>
            <div>
                <strong class="text-gray-400">ملاحظات:</strong>
                <p class="text-sm text-gray-300 leading-relaxed mt-1">${car.notes}</p>
            </div>
        </div>
    `).join('');
    
    const mainResultsHtml = `
        <div class="accordion-header active" onclick="toggleAccordion(this)">
            <h3 class="font-bold text-lg text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-gold">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5h16.5m-16.5 0T3.375 14.25m16.5 4.5c0 .621-.504 1.125-1.125 1.125h-1.5c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125H21v-1.5m-16.5 4.5c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375v1.5M9 13.5l3 3m0 0l3-3m-3 3v-6m0 1.5H7.5m3-1.5h1.5m4.5 1.5H15" />
                </svg>
                <span>السيارات المتوافقة (${titleText})</span>
            </h3>
            
            <div class="accordion-actions">
                <button class="action-btn" title="مشاركة النتيجة" onclick="shareResult(${JSON.stringify(resultData).replace(/"/g, "'")})">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.19.02.38.05.57.09m0 0c2.083.36 3.997.96 5.681 1.94m0 0c.16.1.31.2.46.3m0 0a2.25 2.25 0 1 0 0-2.186m0 2.186c-.19-.02-.38-.05-.57-.09m0 0c-2.083-.36-3.997-.96-5.681-1.94m0 0c-.16-.1-.31-.2-.46-.3m0 0a2.25 2.25 0 1 0 0 2.186m0-2.186-.57.09" />
                    </svg>
                </button>
            </div>

            <svg class="accordion-icon w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        <div class="accordion-content active">
            <div class="p-4 border border-gray-700 rounded-lg scrollable-card-container">
                ${carsHtml}
            </div>
        </div>
    `;
    resultBox.innerHTML = mainResultsHtml;
    return true;
}

function copyToClipboard(text, iconElement) {
   if (!text || text === 'غير متوفر' || text === 'N/A') return;
   
   const originalPath = iconElement.innerHTML;
   const checkMarkPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';

   const showFeedback = () => {
       showMessage('تم النسخ: ' + text, 'info');
       iconElement.innerHTML = checkMarkPath;
       iconElement.classList.add('copied');
       
       setTimeout(() => {
           iconElement.innerHTML = originalPath;
           iconElement.classList.remove('copied');
       }, 2000);
   };

   if (navigator.clipboard && navigator.clipboard.writeText) {
       navigator.clipboard.writeText(text).then(showFeedback).catch(err => {
           console.error('Failed to copy with Clipboard API: ', err);
           fallbackCopyText(text, showFeedback);
       });
   } else {
       fallbackCopyText(text, showFeedback);
   }
}

function fallbackCopyText(text, successCallback) {
   const el = document.createElement('textarea');
   el.value = text;
   el.style.position = 'absolute';
   el.style.left = '-9999px';
   document.body.appendChild(el);
   el.select();
   try {
     document.execCommand('copy');
     successCallback();
   } catch (err) {
     console.error('Failed to copy text: ', err);
     showMessage('فشل النسخ', 'error');
   }
   document.body.removeChild(el);
}

function toggleAccordion(header) {
    if (event.target.closest('.action-btn')) {
        event.stopPropagation();
        return;
    }
    header.classList.toggle('active');
    const content = header.nextElementSibling;
    if (content.classList.contains('active')) {
        content.classList.remove('active');
    } else {
        content.classList.add('active');
    }
}

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    
    if (type === 'success') {
        messageBox.style.backgroundColor = 'var(--success-color)';
    } else if (type === 'error') {
        messageBox.style.backgroundColor = 'var(--error-color)';
    } else if (type === 'info') {
        messageBox.style.backgroundColor = 'var(--info-color)';
    }
    messageBox.style.color = 'white';
    
    const duration = Math.max(3000, message.length * 100); 
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, duration);
}

async function fetchWithRetry(url, options, maxRetries = 3, initialDelay = 1000) {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response.json();
            }
            if (response.status === 429 || response.status >= 500) {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; 
            } else {
                const errorData = await response.json();
                throw new Error(`Client Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
    throw new Error("فشل الاتصال بالـ API بعد عدة محاولات.");
}

async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        const text = await response.text();
        return text.split('\n')
                   .map(item => item.trim())
                   .filter(item => item.length > 0);
    } catch (error) {
        console.error(`Error loading CSV from ${url}:`, error);
        return [];
    }
}

function showSuggestions(value, list, container, inputElement) {
    container.innerHTML = '';
    if (value.length === 0) {
        container.style.display = 'none';
        return;
    }
    const filtered = list.filter(item => 
        item.toLowerCase().startsWith(value.toLowerCase())
    );
    if (filtered.length > 0) {
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = item;
            div.addEventListener('click', () => {
                inputElement.value = item;
                container.style.display = 'none';
            });
            container.appendChild(div);
        });
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    historyBox.innerHTML = '';
    if (history.length > 0) {
        historyContainer.style.display = 'block';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span class="latin-font">${item.title}</span>
                <span class="history-type">${item.typeDisplay}</span>
            `;
            div.onclick = () => {
                populateFormFromHistory(item);
                form.requestSubmit(); 
            };
            historyBox.appendChild(div);
        });
    } else {
        historyContainer.style.display = 'none';
    }
}

function saveToHistory(searchData) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(item => item.id !== searchData.id);
    history.unshift(searchData);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    localStorage.setItem('searchHistory', JSON.stringify(history));
    loadHistory();
}

function populateFormFromHistory(item) {
    document.getElementById(item.tabId).click();
    
    if (item.mode === 'specs') {
        document.getElementById('year').value = item.data.year;
        typeInput.value = item.data.type;
        modelInput.value = item.data.model;
        document.getElementById('market').value = item.data.market;
    } else if (item.mode === 'reverse') {
        document.getElementById('fcc_input').value = item.data.fccId;
        document.getElementById('pn_input').value = item.data.partNumber;
    } else if (item.mode === 'vin') {
        vinInput.value = item.data.vin;
        updateVinCounter(item.data.vin.length);
    }
}

async function shareResult(resultData) {
    let text = `*نتائج بحث MASTER KEY*\n\n`;
    text += `*البحث:* ${resultData.title}\n`;
    
    let typeDisplay = 'مواصفات';
    if (resultData.type === 'reverse') typeDisplay = 'بحث عكسي';
    if (resultData.type === 'vin') typeDisplay = 'بحث VIN';
    
    text += `*النوع:* ${typeDisplay}\n\n`;

    if (resultData.type === 'specs' || resultData.type === 'vin') {
        text += `*FCC ID:* ${resultData.fccId || 'N/A'}\n`;
        text += `*Part Number:* ${resultData.partNumber || 'N/A'}\n`;
        text += `*نصل المفتاح:* ${resultData.keyBlade || 'N/A'}\n`;
        text += `*نوع الريموت:* ${resultData.remoteType || 'N/A'}\n`;
    } else if (resultData.type === 'reverse' && resultData.cars) {
        text += "*السيارات المتوافقة:*\n";
        resultData.cars.forEach((car, index) => {
            text += `${index + 1}. ${car.model} (${car.years})\n`;
        });
    }

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'نتائج بحث MASTER KEY',
                text: text,
            });
        } else {
            throw new Error('Web Share API not supported');
        }
    } catch (err) {
        fallbackCopyText(text, () => {
             showMessage('تم نسخ ملخص النتيجة للحافظة', 'info');
        });
    }
}

function updateVinCounter(length) {
    vinCounter.textContent = `(${length}/17)`;
    if (length === 17 && VIN_REGEX.test(vinInput.value)) {
        vinCounter.classList.add('valid');
    } else {
        vinCounter.classList.remove('valid');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    
    const CORRECT_PIN = "1420";
    const securityOverlay = document.getElementById('security-overlay');
    const securityModal = document.getElementById('security-modal');
    const pinInputs = document.querySelectorAll('#pin-container input');
    const loginBtn = document.getElementById('login-btn');
    const pinError = document.getElementById('pin-error');
    const mainBody = document.querySelector('body'); 

    pinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (input.value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                pinInputs[index - 1].focus();
            }
            if (e.key === 'Enter' && index === pinInputs.length - 1) {
                loginBtn.click();
            }
        });
    });

    pinInputs[0].addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text');
        if (pasteData && pasteData.length === 4 && /^[0-9]+$/.test(pasteData)) {
            pinInputs.forEach((input, index) => {
                input.value = pasteData[index];
            });
            pinInputs[3].focus();
        }
    });

    loginBtn.addEventListener('click', () => {
        const pin = Array.from(pinInputs).map(input => input.value).join('');
        
        if (pin === CORRECT_PIN) {
            securityModal.style.display = 'none';
            securityOverlay.style.display = 'none';
            mainBody.style.overflow = 'auto'; 
        } else {
            pinError.style.display = 'block';
            pinInputs[0].focus(); 
            pinInputs[0].select(); 
            setTimeout(() => {
                window.location.href = 'https://www.google.com'; // إعادة التوجيه عند الخطأ
            }, 1000); 
        }
    });

    pinInputs[0].focus();
    
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const tempMsg = document.createElement('div');
            tempMsg.textContent = 'جارٍ حذف الكاش وتحديث التطبيق...';
            tempMsg.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--info-color);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                z-index: 10001; 
                font-family: 'Cairo', sans-serif;
                font-weight: 600;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(tempMsg);
            
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    if (registrations.length > 0) {
                        for (let registration of registrations) {
                            await registration.unregister();
                        }
                        console.log('Service Workers القديمة تم إلغاء تسجيلها.');
                    } else {
                        console.log('لا يوجد Service Workers لإلغاء تسجيلها.');
                    }
                }
                
                if (window.caches) {
                    const cacheNames = await window.caches.keys();
                    await Promise.all(cacheNames.map(cacheName => {
                        console.log('Deleting cache:', cacheName);
                        return window.caches.delete(cacheName);
                    }));
                    console.log('تم مسح الكاش بنجاح.');
                } else {
                    console.log('API الكاش غير مدعوم.');
                }

                setTimeout(() => {
                    window.location.reload(true); 
                }, 1500); 

            } catch (error) {
                console.error('فشل في حذف الكاش:', error);
                tempMsg.textContent = 'حدث خطأ. حاول إعادة تحميل الصفحة يدوياً.';
                tempMsg.style.backgroundColor = 'var(--error-color)';
                
                setTimeout(() => {
                    window.location.reload(true);
                }, 1500);
            }
        });
    }

    carMakes = await fetchCSV(carMakesUrl);
    carModels = await fetchCSV(carModelsUrl);
    
    loadHistory();
    
    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('searchHistory');
        loadHistory();
    });
    
    vinInput.addEventListener('input', (e) => {
        const vin = e.target.value.toUpperCase();
        e.target.value = vin; 
        updateVinCounter(vin.length);
    });
    
    typeInput.addEventListener('input', () => {
        showSuggestions(typeInput.value, carMakes, typeSuggestions, typeInput);
    });
    
    modelInput.addEventListener('input', () => {
        showSuggestions(modelInput.value, carModels, modelSuggestions, modelInput);
    });
    
    document.addEventListener('click', (e) => {
        if (!typeInput.contains(e.target) && !typeSuggestions.contains(e.target)) {
            typeSuggestions.style.display = 'none';
        }
        if (!modelInput.contains(e.target) && !modelSuggestions.contains(e.target)) {
            modelSuggestions.style.display = 'none';
        }
    });
});