// פונקציה להמרת תאריך לועזי לעברי בפורמט הרצוי
function getHebrewDate(dateStr) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-u-ca-hebrew', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}


async function fetchShabbatTimes() {
    // הוספת &hebrew=1 מחזירה את כל הנתונים כולל תאריכים בכתב עברי
    const url = `https://www.hebcal.com/shabbat?cfg=json&city=IL-Haifa&m=on&lg=he&hebrew=1`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        
        
        // 1. מציאת פריט הפרשה עבור השם והתאריך העברי
        const parashaItem = data.items.find(i => i.category === 'parashat');
        if (parashaItem) {
            document.getElementById('parasha-name').innerText = parashaItem.hebrew;
            // שימוש בפורמט התאריך העברי של הדפדפן
            document.getElementById('hebrew-date').innerText = `★ ${getHebrewDate(parashaItem.date)} ★`;
        }
        
        // 2. זמני הדלקת נרות
        const candleItem = data.items.find(i => i.category === 'candles');
        if (candleItem) {
            const candleTime = new Date(candleItem.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('candle-lighting').innerText = candleTime;
            document.getElementById('candle-lighting-top').innerText = candleTime;
        }
        
        // 3. מוצאי שבת
        const havdalahItem = data.items.find(i => i.category === 'havdalah');
        if (havdalahItem) {
            const havTime = new Date(havdalahItem.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('havdalah').innerText = havTime;
            document.getElementById('havdalah-top').innerText = havTime;
        }
        
    } catch (error) {
        console.error("שגיאה:", error);
    }
}

// הפעלת הפונקציה בטעינת הדף
window.onload = fetchShabbatTimes;