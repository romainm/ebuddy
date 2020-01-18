const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const ipc = ipcMain;
const loki = require("lokijs");
const lfsa = require("../node_modules/lokijs/src/loki-fs-structured-adapter.js");
const moment = require("moment");
const fs = require("fs");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let accountPath = path.join(process.env.HOME, "buddy", "test");
let currentPath = path.join(accountPath, "current.db");
const adapter = new lfsa();

function databaseInitialize() {
    const colNames = ["accounts", "transactions"];
    colNames.forEach(name => {
        if (!db.getCollection(name)) {
            console.log("adding collection " + name);
            db.addCollection(name);
        }
    });
}

function loadDb() {
    if (!fs.existsSync(accountPath)) {
        fs.mkdirSync(accountPath, { recursive: true });
    }
    const db = new loki(currentPath, {
        adapter: adapter,
        autoload: true,
        autoloadCallback: databaseInitialize,
        autosave: true,
        autosaveInterval: 2000,
    });
    return db;
}
let db = loadDb();

function createWindow() {
    const mode = process.env.NODE_ENV;
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            // requires for "requires" keyword
            nodeIntegration: true,
        },
    });

    let watcher;
    if (process.env.NODE_ENV === "development") {
        watcher = require("chokidar").watch(
            path.join(__dirname, "../public/bundle.js"),
            { ignoreInitial: true }
        );
        watcher.on("change", () => {
            mainWindow.reload();
        });
    }

    mainWindow.loadURL(
        `file://${path.join(__dirname, "../public/index.html")}`
    );
    mainWindow.on("closed", () => {
        mainWindow = null;
        if (watcher) {
            watcher.close();
        }
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

const obj_sum = function(items, prop) {
    return items.reduce(function(a, b) {
        return a + b[prop];
    }, 0);
};

ipc.on("list_accounts", async (event, args) => {
    const col = db.getCollection("accounts");
    const colTransactions = db.getCollection("transactions");
    const docs = col.find({});

    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        if (
            doc.initialBalance === undefined ||
            doc.initialBalanceDate === undefined
        ) {
            doc.balance = 0;
            continue;
        }
        const transactions = colTransactions.find({
            accountId: doc.id,
            date: { $gte: doc.initialBalanceDate },
        });

        doc.balance = doc.initialBalance + obj_sum(transactions, "amount");
    }

    console.log(docs);
    event.sender.send("accounts", docs);
});

function listTransactions(args) {
    const limit = args.limit != undefined ? args.limit : -1;

    let searchObj = {};

    if (args.accountId) {
        searchObj.accountId = args.accountId;
    }
    if (args.text) {
        const re = [args.text, "i"];
        searchObj.$or = [
            { name: { $regex: re } },
            { category: { $regex: re } },
        ];
    }

    const col = db.getCollection("transactions");
    let queryChain = col.chain().find(searchObj);

    // sort by date as default
    queryChain = queryChain.simplesort("date", true);

    let docs = queryChain.limit(limit).data();

    console.log(`${args}: ${docs.length} transactions found.`);
    return docs;
}

ipc.on("list_transactions", async (event, args) => {
    args.limit = 1000;
    const transactions = listTransactions(args);
    event.sender.send("transactions", transactions);
});

ipc.on("build_quick_chart", async (event, args) => {
    console.log("building quick chart");
    console.log(args);
    // TODO add limit in time
    const transactions = listTransactions(args.filter);
    event.sender.send("quick_chart_built", buildChartData(transactions, args));
});

function _buildDateWeek() {
    const startOfWeek = moment().startOf("isoWeek");
    const endOfWeek = moment().endOf("isoWeek");
    return [startOfWeek, endOfWeek];
}

function _nextStartDateWeek(date) {
    return date.clone().subtract(1, "week");
}

function _buildDateMonth() {
    const startOfMonth = moment().startOf("month");
    const endOfMonth = moment().endOf("month");
    return [startOfMonth, endOfMonth];
}

function _nextStartDateMonth(date) {
    return date.clone().subtract(1, "month");
}

function _buildDateYear() {
    const startOfYear = moment().startOf("year");
    const endOfYear = moment().endOf("year");
    return [startOfYear, endOfYear];
}

function _nextStartDateYear(date) {
    return date.clone().subtract(1, "year");
}

function buildChartData(transactions, args) {
    // group unit: by week (7 days), fortnight (14 days), month, quarter, year
    /*
        startDate / endDate

        week: 27 Dec 18
        fortnight: 27 Dec 18
        month: Jan 18
        year: 2018
        quarter: Jan 18

        current date always included in the last item
        month: current month
        week: current week (start on monday)
        fortnight: not yet
        trimester: start in Jan, Apr, Jul, Oct

    */
    const units = {
        month: {
            template: "MMM YY",
            buildDateFunc: _buildDateMonth,
            nextStartDateFunc: _nextStartDateMonth,
        },
        year: {
            template: "YYYY",
            buildDateFunc: _buildDateYear,
            nextStartDateFunc: _nextStartDateYear,
        },
        week: {
            template: "DD MMM YY",
            buildDateFunc: _buildDateWeek,
            nextStartDateFunc: _nextStartDateWeek,
        },
        fortnight: { template: "DD MMM YY" },
        trimester: { template: "MMM YY" },
        semester: { template: "MMM YY" },
    };

    const maxUnits = args.nbUnits === undefined ? 12 : args.nbUnits;
    const groupUnit = args.groupUnit === undefined ? "month" : args.groupUnit;

    // build start dates for structure
    const chartData = [];

    const unit = units[groupUnit];

    // build start and end date of current period
    let [startDate, endDate] = unit.buildDateFunc();
    // because momentjs sets date as last second on previous day
    // startDate.add(1, "second");
    // endDate.add(1, "second");

    transactions = transactions.map(doc => {
        return { ...doc, date: new Date(doc.date) };
    });
    transactions.sort((a, b) => a.date > b.date);

    let transactionIndex = 0;
    for (let i = 0; i < maxUnits; i++) {
        d = {};
        // console.log(startDate.toDate());
        // console.log(endDate.toDate());
        // console.log("---");

        d.startDate = startDate.toDate();
        d.endDate = endDate.toDate();
        d.label = startDate.format(unit.template);
        d.value = 0;

        // transactions are sorted latest to oldest so
        // we just stop when we find a transaction that is earlier than startDate
        for (; transactionIndex < transactions.length; transactionIndex++) {
            const t = transactions[transactionIndex];
            if (t.date < d.startDate) {
                break;
            }
            d.value += t.amount;
            // console.log(`${d.startDate}-${d.endDate} : ${t.date}`);
        }

        chartData.unshift(d);

        // prepare next unit
        endDate = startDate;
        startDate = unit.nextStartDateFunc(startDate);
    }

    // console.log(chartData);
    return chartData;
}

ipc.on("record_accounts", async (event, args) => {
    console.log("recording accounts");
    console.log(args);
    // validate content of args
    const col = db.getCollection("accounts");
    col.insert(args);
    event.sender.send("accounts_updated");
});

ipc.on("update_account", async (event, account) => {
    console.log("updating account");
    // validate content of args
    console.log(account);
    const col = db.getCollection("accounts");
    col.update(account);
    event.sender.send("accounts_updated");
});

ipc.on("record_transactions", async (event, args) => {
    console.log("recording transactions");
    // validate content of args
    console.log(args);
    const col = db.getCollection("transactions");
    col.insert(args);
    event.sender.send("transactions_updated");
});

ipc.on("update_transactions", async (event, transactions) => {
    console.log("updating transactions");
    // validate content of args
    console.log(transactions);
    const col = db.getCollection("transactions");
    col.update(transactions);
    event.sender.send("transactions_updated");
});

ipc.on("check_existing_transactions", async (event, args) => {
    let dupIndices = new Set();
    const col = db.getCollection("transactions");

    for (let i = 0; i < args.length; i++) {
        const element = args[i];
        let searchObj = {
            accountId: element.accountId,
            fitId: element.fitId,
            name: element.name,
            amount: element.amount,
            date: element.date,
        };
        const docs = col.find(searchObj);
        if (docs.length) {
            dupIndices.add(i);
        }
    }

    event.sender.send("check_existing_transactions_result", [...dupIndices]);
});
