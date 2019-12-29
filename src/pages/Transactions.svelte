<script>
  const ipc = require("electron").ipcRenderer;

  let transactions = [];

  ipc.send("list_transactions");

  ipc.on("transactions", (event, messages) => {
    // do something
    console.log(messages);
    transactions = messages;
  });
</script>

<div>Transactions</div>
<div>{transactions}</div>
