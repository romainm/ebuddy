<script>
  import TransactionTable from "../components/TransactionTable.svelte";
  import moment from "moment";
  import { accounts, transactionFilter } from "../store/cache";
  const ipc = require("electron").ipcRenderer;

  let transactionsToImport = [];
  let accountsToImport = [];
  let nbTransactionsToCheck = 0;

  $: recordButtonDisabled =
    transactionsToImport.length === 0 || nbTransactionsToCheck > 0;

  $: console.log(`${nbTransactionsToCheck} transactions to check`);

  const readIt = async function(event) {
    let importData = {
      transactions: [],
      accountById: new Map(),
      balance: {
        amount: 0,
        date: null
      }
    };
    let index = 0;
    for (let i = 0; i < event.target.files.length; i++) {
      let data = await readFile(event.target.files[i]);
      const ofx = data.split("<OFX>", 2);
      const content = ofx[1].split(/\r?\n/);
      const key_value_re = /<([^>]+)>(.*)/;
      let currentStatement;
      let bankId, accountId, accountType;
      let fullAccountId = null;
      for (const element of content) {
        let reObj = key_value_re.exec(element);
        if (reObj != null) {
          const key = reObj[1];
          const val = reObj[2];
          switch (key) {
            case "BANKID":
              bankId = val;
              break;
            case "ACCTID":
              accountId = val;
              break;
            case "ACCTTYPE":
              accountType = val;
              break;
            case "/BANKACCTFROM":
              fullAccountId = `${bankId}-${accountId}`;
              if (!importData.accountById.has(fullAccountId)) {
                importData.accountById.set(fullAccountId, {
                  id: fullAccountId,
                  type: accountType
                });
              }
              break;
            case "STMTTRN":
              currentStatement = { index, exists: false };
              if (fullAccountId) {
                currentStatement.accountId = fullAccountId;
              }
              index += 1;
              break;
            case "/STMTTRN":
              importData.transactions.push(currentStatement);
              currentStatement = {};
              break;
            case "TRNAMT":
              currentStatement["amount"] = parseFloat(val);
              break;
            case "DTPOSTED":
              currentStatement["date"] = moment(val, "YYYYMMDD").toDate();
              break;
            case "MEMO":
              currentStatement["name"] = val;
              break;
            case "FITID":
              currentStatement["fitId"] = val;
              break;
          }
        }
      }
    }
    // sort by date desc
    importData.transactions.sort((a, b) => b.date - a.date);
    transactionsToImport = importData.transactions;

    accountsToImport = [...importData.accountById.values()];

    // check transactions to see if they have already been recorded
    nbTransactionsToCheck = transactionsToImport.length;

    ipc.send("check_existing_transactions", transactionsToImport);
    ipc.on("check_existing_transactions_result", (event, indices) => {
      console.log("yeah");
      console.log(indices);
      for (let i = 0; i < indices.length; i++) {
        transactionsToImport[i].exists = true;
      }
      nbTransactionsToCheck = 0;
    });

    console.log("tran");
    console.log(transactionsToImport);
  };

  const recordTransactions = function() {
    const existingAccountIds = $accounts.map(account => account.id);

    // only record accounts that we don't have already
    let safeAccounts = [];
    accountsToImport.forEach(account => {
      if (existingAccountIds.indexOf(account.id) === -1) {
        safeAccounts.push({
          id: account.id,
          type: account.type
        });
      }
    });

    console.log(`${transactionsToImport.length} original transactions`);
    transactionsToImport = transactionsToImport.filter(t => !t.exists);
    console.log(`${transactionsToImport.length} to import`);
    if (transactionsToImport.length === 0) {
      console.log("nothing to import.");
      return;
    }

    const safeTransactions = transactionsToImport.map(doc => {
      return {
        name: doc.name,
        date: doc.date,
        amount: doc.amount,
        fitId: doc.fitId,
        accountId: doc.accountId
      };
    });

    if (safeAccounts.length > 0) {
      ipc.send("record_accounts", safeAccounts);
    }
    ipc.send("record_transactions", safeTransactions);

    transactionsToImport = [];
    accountsToImport = [];
  };

  const readFile = function(f) {
    return new Promise(function(resolve, reject) {
      const reader = new FileReader();
      reader.onload = function(e) {
        resolve(e.target.result);
      };
      reader.onerror = function(e) {
        reject(new Error(e.target.result));
      };
      reader.readAsText(f);
    });
  };
</script>

<input type="file" on:input={readIt} multiple />
<button disabled={recordButtonDisabled} on:click={recordTransactions}>
  Record Transactions
</button>
<TransactionTable transactions={transactionsToImport} />
