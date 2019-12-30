<script>
  import TransactionTable from "../components/TransactionTable.svelte";
  const ipc = require("electron").ipcRenderer;

  let transactions = [];

  ipc.send("list_transactions", { limit: 100 });

  ipc.on("transactions", (event, messages) => {
    // do something
    transactions = messages;
  });

  ipc.on("transactions_updated", (event, messages) => {
    ipc.send("list_transactions", { limit: 100 });
  });
</script>

<TransactionTable {transactions} />
