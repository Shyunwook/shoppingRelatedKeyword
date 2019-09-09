const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const fs = require('fs');
const Excel = require('exceljs');
const cron = require('node-cron');

app.get('/', async (req, res) => {
    res.send('main');
});

async function main(){
    console.log('크롤링 시작');
    let target_list = await readBrandList();

    for (target of target_list) {
        let html = await getNaverRelateKeyword(target);

        let $ = cheerio.load(html);
        let data = $('div.co_relation_srh').find('ul>li>a');

        let related = [];
        data.each((i) => {
            related.push($(data[i]).text().trim());
        });

        let param = {
            date: moment().format('YYYY-MM-DD'),
            keyword: target,
            related: related
        }
        writeExcelFile(param);
    }

}

function writeExcelFile(param){
    let rel_list = param.related.toString();
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile('./data.xlsx')
        .then(function () {
            var worksheet = workbook.getWorksheet(1);
            var lastRow = worksheet.lastRow;
            var getRowInsert = worksheet.getRow(++(lastRow.number));
            getRowInsert.getCell('A').value = param.date;
            getRowInsert.getCell('B').value = param.keyword;
            getRowInsert.getCell('C').value = rel_list;
            getRowInsert.commit();
            return workbook.xlsx.writeFile('./data.xlsx');
        });
}

function readBrandList() {
    return new Promise((resolve, reject) => {
        fs.readFile('./brand.txt', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.split('\n'));
            }
        })
    })
}

function getNaverRelateKeyword(keyword) {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            let result = await axios.get(`http://shopping.naver.com/search/all.nhn?where=all&frm=
            NVSCTAB&query=${encodeURIComponent(keyword)}`);
            console.log(keyword);
            resolve(result.data);
        }, 500);
    })
}

app.listen(3000, function () {
    console.log('app is running on 3000...!!');
})


cron.schedule('0 0 1 * * *', () => {
    main();
    console.log('크롤링 완료...!');
    fs.appendFile('./date.txt', `${moment().format('YYYY-MM-DD')}
    `,function(err){
        if(err){
            console.log(err);
        }
    })
})

