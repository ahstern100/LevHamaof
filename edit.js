function formatHebrewDate(engDateStr) {
    if (!engDateStr) return "";

    // מיפוי חודשים
    const monthMap = {
        'Nisan': 'ניסן', 'Iyyar': 'אייר', 'Sivan': 'סיון', 'Tamuz': 'תמוז',
        'Av': 'אב', 'Elul': 'אלול', 'Tishrei': 'תשרי', 'Cheshvan': 'חשוון',
        'Kislev': 'כסלו', 'Tevet': 'טבת', 'Sh\'vat': 'שבט', 'Adar I': 'אדר א׳',
        'Adar II': 'אדר ב׳', 'Adar': 'אדר'
    };

    // פונקציית עזר לגימטריה (עד 1000)
    function toGematria(num) {
        const letters = {
            1000: '', 900: 'ת"ק', 800: 'ת"ק', 700: 'ת"ק', 600: 'תר', 500: 'תק',
            400: 'ת', 300: 'ש', 200: 'ר', 100: 'ק', 90: 'צ', 80: 'פ', 70: 'ע',
            60: 'ס', 50: 'נ', 40: 'מ', 30: 'ל', 20: 'כ', 10: 'י', 9: 'ט', 8: 'ח',
            7: 'ז', 6: 'ו', 5: 'ה', 4: 'ד', 3: 'ג', 2: 'ב', 1: 'א'
        };
        let result = '';
        let n = num;

        // טיפול מיוחד ב-15 ו-16 (ט"ו ו-ט"ז)
        if (n === 15) return 'ט"ו';
        if (n === 16) return 'ט"ז';

        const keys = [400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        for (let key of keys) {
            while (n >= key) {
                result += letters[key];
                n -= key;
            }
        }

        // הוספת גרשיים
        if (result.length > 1) {
            return result.slice(0, -1) + '"' + result.slice(-1);
        } else {
            return result + "'";
        }
    }

    // פירוק המחרוזת (למשל "28 Tevet 5786")
    const parts = engDateStr.split(' ');
    if (parts.length < 3) return engDateStr;

    const day = parseInt(parts[0]);
    const monthEng = parts.slice(1, -1).join(' '); // מטפל במקרים כמו "Adar I"
    const year = parseInt(parts[parts.length - 1]);

    const dayHeb = toGematria(day);
    const monthHeb = monthMap[monthEng] || monthEng;
    const yearHeb = 'תש' + toGematria(year % 100); // הופך 5786 ל-תשפ"ו

    return `${dayHeb} ב${monthHeb} ${yearHeb}`;
}

function getMevarchimDetails(items) {
    const mevarchimItem = items.find(i => i.category === 'mevarchim');
    
    if (!mevarchimItem) {
        return { roshChodesh: "אין ברכת החודש", molad: "" };
    }

    // 1. מציאת ימי ראש חודש - מחפשים את האירועים מסוג roshchodesh ב-API
    // הערה: Hebcal מחזיר בדרך כלל את ימי ר"ח הקרובים. 
    // אנחנו נחפש את אלו ששמם תואם לחודש שמברכים (שמופיע ב-title של המברכים)
    const targetMonth = mevarchimItem.title.replace("Shabbat Mevarchim Chodesh ", "").trim();
    const roshChodeshItems = items.filter(i => i.category === 'roshchodesh' && i.title.includes(targetMonth));

    let roshChodeshStr = "";
    if (roshChodeshItems.length > 0) {
        // מיפוי ימי השבוע מהתאריך של ה-API
        const days = roshChodeshItems.map(item => {
            const date = new Date(item.date);
            return ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'][date.getDay()];
        });

        const monthHeb = mevarchimItem.hebrew.replace("מברכים חודש ", "");
        const daysText = days.length > 1 ? `בימים ${days[0]}-${days[1]}` : `ביום ${days[0]}`;
        roshChodeshStr = `ר"ח ${monthHeb} ${daysText}`;
    }

    // 2. חילוץ המולד מה-memo (כפי שמופיע בצילום המסך)
    const memo = mevarchimItem.memo || "";
    let moladStr = "";
    
    if (memo.includes("בְּשָׁבוּעַ,")) {
        // לוקחים את כל הטקסט שאחרי "בשבוע," ומנקים ניקוד
        const moladRaw = memo.split("בְּשָׁבוּעַ,")[1].trim();
        const moladClean = moladRaw.replace(/[\u0591-\u05C7]/g, "");
        moladStr = `המולד: ${moladClean}`;
    }

    return {
        roshChodesh: roshChodeshStr,
        molad: moladStr
    };
}

// פונקציות עזר לחישוב זמנים (נשארות כפי שהיו)
function parseTime(timeStr) {
    if(!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function formatTime(date) {
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function roundToNearest(date, minutes, direction = 'up') {
    const ms = minutes * 60 * 1000;
    if (direction === 'up') return new Date(Math.ceil(date.getTime() / ms) * ms);
    return new Date(Math.round(date.getTime() / ms) * ms);
}

function createRowHtml(label = '', time = '') {
    const div = document.createElement('div');
    div.className = 'edit-row dynamic-row';
    div.innerHTML = `
        <input type="text" class="row-label" value="${label}" placeholder="פעילות">
        <input type="text" class="row-time" value="${time}" placeholder="שעה">
        <button class="remove-row-btn" onclick="this.parentElement.remove()">-</button>
    `;
    return div;
}

function addRow(containerId, label = '', time = '') {
    document.getElementById(containerId).appendChild(createRowHtml(label, time));
}

// פונקציה לטעינת הנתונים
async function loadData() {
    const savedConfig = localStorage.getItem('shabbatConfig');
    
    // ניקוי ראשוני של השורות
    document.getElementById('night-rows-edit').innerHTML = '';
    document.getElementById('day-rows-edit').innerHTML = '';
    document.getElementById('afternoon-rows-edit').innerHTML = '';

    if (savedConfig) {
        // --- מצב 1: יש נתונים שמורים (חוזרים מעריכה) ---
        const c = JSON.parse(savedConfig);
        
        document.getElementById('header').value = c.header;
        document.getElementById('hebDate').value = c.hebDate;
        document.getElementById('candlesLabel').value = c.candlesLabel;
        document.getElementById('candlesTime').value = c.candlesTime;
        document.getElementById('havdalahLabel').value = c.havdalahLabel;
        document.getElementById('havdalahTime').value = c.havdalahTime;
        document.getElementById('logoUrl').value = c.logoUrl || "";
        
        c.nightRows.forEach(r => addRow('night-rows-edit', r.label, r.time));
        c.dayRows.forEach(r => addRow('day-rows-edit', r.label, r.time));
        c.afternoonRows.forEach(r => addRow('afternoon-rows-edit', r.label, r.time));
        
        document.getElementById('showBirkat').checked = c.showBirkat;
        document.getElementById('birkatTitle').value = c.birkatTitle;
        document.getElementById('moladText').value = c.moladText;
        document.getElementById('showLevana').checked = c.showLevana;
        document.getElementById('notice').value = c.notice;
        document.getElementById('footerText').value = c.footerText;
        document.getElementById('bgImage').value = c.bgImage;

    } else {
        // --- מצב 2: טעינה ראשונית מ-Hebcal ---
        try {
            const response = await fetch('https://www.hebcal.com/shabbat?cfg=json&city=IL-Haifa&m=on&lg=he&hebrew=1');
            const data = await response.json();

            const parasha = data.items.find(i => i.category === 'parashat');
            const candlesItem = data.items.find(i => i.category === 'candles');
            const havdalahItem = data.items.find(i => i.category === 'havdalah');

            const candlesTimeStr = new Date(candlesItem.date).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
            const havdalahTimeStr = new Date(havdalahItem.date).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});

            document.getElementById('header').value = parasha ? parasha.hebrew : "";
            document.getElementById('hebDate').value = formatHebrewDate(parasha.hdate) || "";
            document.getElementById('candlesTime').value = candlesTimeStr;
            document.getElementById('havdalahTime').value = havdalahTimeStr;

            const candlesDate = parseTime(candlesTimeStr);
            const havdalahDate = parseTime(havdalahTimeStr);

            // ליל שבת אוטומטי
            const shir = roundToNearest(candlesDate, 5, 'up');
            addRow('night-rows-edit', 'הדלקת נרות', candlesTimeStr);
            addRow('night-rows-edit', 'שיר השירים', formatTime(shir));
            addRow('night-rows-edit', 'מנחה', formatTime(new Date(shir.getTime() + 10 * 60000)));
            addRow('night-rows-edit', 'קבלת שבת', '');
            addRow('night-rows-edit', 'דבר תורה', '');
            addRow('night-rows-edit', 'ערבית', '');

            // יום שבת אוטומטי
            addRow('day-rows-edit', 'שחרית', '08:15');
            addRow('day-rows-edit', 'קידושא רבא', '10:15');
            addRow('day-rows-edit', 'דבר תורה', '10:25');
            addRow('day-rows-edit', 'תפילת ילדים', '10:40');

            // אחה"צ אוטומטי
            let minchaDay = new Date(havdalahDate.getTime() - 120 * 60000);
            minchaDay = roundToNearest(minchaDay, 15, 'up');
            if (minchaDay < parseTime('15:45')) minchaDay = parseTime('15:45');
            const arvait = roundToNearest(new Date(havdalahDate.getTime() - 10 * 60000), 5, 'up');

            addRow('afternoon-rows-edit', 'מנחה', formatTime(minchaDay));
            addRow('afternoon-rows-edit', 'ערבית', formatTime(arvait));
            addRow('afternoon-rows-edit', 'צאת שבת', havdalahTimeStr);

            document.getElementById('notice').value = "על ההורים להשגיח על ילדיהם!";
            
            const mevarchimInfo = getMevarchimDetails(data.items);
if (mevarchimInfo.molad) {
    document.getElementById('showBirkat').checked = true;
    document.getElementById('birkatTitle').value = mevarchimInfo.roshChodesh;
    document.getElementById('moladText').value = mevarchimInfo.molad;
}
        } catch (e) { console.error("Error loading Hebcal:", e); }
    }
}

function saveAndShow() {
    const getRows = (id) => Array.from(document.querySelectorAll(`#${id} .dynamic-row`)).map(r => ({
        label: r.querySelector('.row-label').value,
        time: r.querySelector('.row-time').value
    }));

    const config = {
        header: document.getElementById('header').value,
        hebDate: document.getElementById('hebDate').value,
        candlesLabel: document.getElementById('candlesLabel').value,
        candlesTime: document.getElementById('candlesTime').value,
        havdalahLabel: document.getElementById('havdalahLabel').value,
        havdalahTime: document.getElementById('havdalahTime').value,
        logoUrl: document.getElementById('logoUrl').value,
        nightTitle: document.getElementById('nightTitle').value,
        nightRows: getRows('night-rows-edit'),
        dayTitle: document.getElementById('dayTitle').value,
        dayRows: getRows('day-rows-edit'),
        afternoonTitle: document.getElementById('afternoonTitle').value,
        afternoonRows: getRows('afternoon-rows-edit'),
        showBirkat: document.getElementById('showBirkat').checked,
        birkatTitle: document.getElementById('birkatTitle').value,
        moladText: document.getElementById('moladText').value,
        showLevana: document.getElementById('showLevana').checked,
        notice: document.getElementById('notice').value,
        footerText: document.getElementById('footerText').value,
        bgImage: document.getElementById('bgImage').value
    };

    localStorage.setItem('shabbatConfig', JSON.stringify(config));
    window.location.href = 'result.html';
}

window.onload = loadData;