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
    const transactions = listTransactions(args.filter);
    event.sender.send("quick_chart_built", buildChartData(transactions));
});

function buildChartData(transactions) {
    // group transactions per month
    transactions = transactions.map(doc => {
        return { ...doc, date: new Date(doc.date) };
    });
    const maxMonths = 12;
    const totalPerMonth = Array(maxMonths).fill(0);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getYear();
    for (let i = 0; i < transactions.length; i++) {
        const amount = transactions[i].amount;
        const date = transactions[i].date;

        var nbMonths = currentMonth - date.getMonth();
        var nbYears = currentYear - date.getYear();
        nbMonths += nbYears * 12;

        if (nbMonths >= maxMonths) {
            continue;
        }

        totalPerMonth[nbMonths] += amount;
    }

    var min = Math.min(...totalPerMonth);
    var max = Math.max(...totalPerMonth);

    // build list of months
    let month;
    let chartData = [];
    let date = today;
    for (let i = 0; i < maxMonths; i++) {
        month = moment(date).format("MMM YYYY");
        chartData.unshift({ value: totalPerMonth[i], label: month });
        date.setMonth(date.getMonth() - 1);
    }

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
