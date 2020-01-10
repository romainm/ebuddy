<script>
    import Nav from "./components/Nav.svelte";
    import { accounts } from "./store/cache";
    import Router from "svelte-spa-router";
    import Transactions from "./pages/Transactions.svelte";
    import Import from "./pages/Import.svelte";
    import Reports from "./pages/Reports.svelte";
    const ipc = require("electron").ipcRenderer;

    import moment from "moment";
    window.moment = moment;

    let segment;

    ipc.on("accounts", (event, messages) => {
        accounts.set(messages);
    });
    ipc.on("accounts_updated", (event, messages) => {
        ipc.send("list_accounts");
    });

    ipc.send("list_accounts");

    const routes = {
        "/": Transactions,
        "/transactions": Transactions,
        "/import": Import,
        "/reports": Reports,
    };
</script>

<style>

</style>

<div id="app">
    <Nav {segment} />
    <Router {routes} />

</div>
