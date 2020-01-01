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

ipc.on("list_accounts", async (event, args) => {
    const col = db.getCollection("accounts");
    const docs = col.find({});
    console.log(docs);
    event.sender.send("accounts", docs);
});

ipc.on("list_transactions", async (event, args) => {
    const limit = args.limit != undefined ? args.limit : 100;

    console.log(args);
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

    // if (args.name != undefined) {
    //     searchObj.name = new RegExp(args.name, 'i');
    // }

    // if (args.filters != undefined) {
    //     let l = [];
    //     for (let i = 0; i < args.filters.length; i++) {
    //         const element = args.filters[i];
    //         if (element.type === 'like') {
    //             const val = new RegExp(element.value, 'i');

    //             // accounts can be filtered using id or name
    //             if (element.field === 'accountId') {
    //                 const accounts = await db.accounts.find({
    //                     $or: [{ accountId: val }, { name: val }],
    //                 });
    //                 let acc_filter = [];
    //                 accounts.forEach(acc => acc_filter.push(acc.accountId));
    //                 l.push({ [element.field]: { $in: acc_filter } });
    //             } else {
    //                 l.push({ [element.field]: val });
    //             }
    //         } else if (element.type === '=') {
    //             l.push({ [element.field]: element.value });
    //         }
    //     }
    //     searchObj.$and = l;
    // }

    // let sortObj = { date: -1 };
    // if (args.sorters != undefined) {
    //     sortObj = {};
    //     args.sorters.forEach(element => {
    //         sortObj[element['field']] = element.dir === 'asc' ? 1 : -1;
    //     });
    // }
    // console.log(searchObj);

    // const since = moment()
    //     .subtract(1, 'months')
    //     .toDate()
    //     .toJSON();

    // searchObj = {
    //     date: {
    //         $gte: since,
    //     },
    // };

    const col = db.getCollection("transactions");
    let queryChain = col.chain().find(searchObj);

    // sort by date as default
    queryChain = queryChain.simplesort("date", true);

    let docs = queryChain.limit(limit).data();

    // convert back date to Date object
    // docs = docs.map(doc => {
    //     return { ...doc, date: new Date(doc.date) };
    // });

    console.log(`${docs.length} transactions found.`);
    event.sender.send("transactions", docs);
});

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
