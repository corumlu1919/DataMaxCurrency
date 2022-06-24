const axios = require('axios').default;
const parseString = require('xml2js').parseStringPromise;

async function buildRequest(year, month, day) {
    let requestUrl = `https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`

    try {
        const resp = await axios.get(requestUrl);

        return resp.data;
    } catch (err) {
        console.log(err);
    }
}

async function buildMapFromData(data) {
    const map = new Map();

    const currentYearParsed = await parseString(data);

    for (let currency of currentYearParsed['Tarih_Date'].Currency) {
        map.set(currency['$'].Kod, {
            currencyCode: currency['$'].Kod,
            value: currency.ForexBuying[0]
        })
    }

    return map;
}

async function run(){
    const yearCount = 10;
    const startYear = 2022;
    const targetMonth = "06"

    const yearMap = {
        2022: "07",
        2021: "07",
        2020: "18",
        2019: "18",
        2018: "22",
        2017: "22",
        2016: "17",
        2015: "17",
        2014: "10",
        2013: "10",
        2012: "06",
        2011: "06",
    }

    for (let i = 0; i < yearCount; i++) {
        const yearBeforeNum = startYear - i - 1;
        const currentYearNum = startYear - i;

        const yearBefore = await buildRequest(yearBeforeNum, targetMonth, yearMap[yearBeforeNum])
        const currentYear = await buildRequest(currentYearNum, targetMonth, yearMap[currentYearNum])

        const beforeYearMap = await buildMapFromData(yearBefore);
        const currentYearMap = await buildMapFromData(currentYear);

        let maxPercentage = 0;
        let maxCurrency;

        for (let [currencyCode, data] of currentYearMap) {
            let currentYearVal = data.value;

            if (!beforeYearMap.has(currencyCode)) {
                continue;
            }

            const beforeYearVal = (beforeYearMap.get(currencyCode)).value;

            const percentage = (( currentYearVal - beforeYearVal) / beforeYearVal) * 100;

            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                maxCurrency = currencyCode;
            }
        }

        const maxCurrencyBeforeYearValue = (beforeYearMap.get(maxCurrency)).value
        const maxCurrencyCurrentYearValue = (currentYearMap.get(maxCurrency)).value

        console.log(`${yearBeforeNum} (${maxCurrencyBeforeYearValue}) - ${currentYearNum} (${maxCurrencyCurrentYearValue}): ${maxCurrency} (${maxPercentage}%)`)
        await sleep(1000)
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

run()
